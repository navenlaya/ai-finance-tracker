import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { generateInsightsWithCaching } from '@/lib/ai/insights'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get accounts, transactions, and existing insights in parallel to reduce database connections
    const [accounts, existingInsights] = await Promise.all([
      db.account.findMany({
        where: { userId },
        include: {
          transactions: {
            where: {
              date: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
              }
            },
            orderBy: { date: 'desc' }
          }
        }
      }),
      db.insight.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    ])

    if (accounts.length === 0) {
      return NextResponse.json({ 
        error: 'Please connect a bank account first' 
      }, { status: 400 })
    }

    // Get all transactions from connected accounts
    const allTransactions = accounts.flatMap(account => account.transactions)
    
    if (allTransactions.length === 0) {
      return NextResponse.json({ 
        error: 'No transactions found. Please wait for transactions to sync.' 
      }, { status: 400 })
    }

    const lastGenerated = existingInsights.length > 0 ? existingInsights[0].createdAt : null

    // Calculate monthly income (rough estimate from positive transactions)
    const monthlyIncome = allTransactions
      .filter(t => t.amount < 0) // Income is negative in Plaid
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 3 // Rough monthly estimate

    console.log(`Generating insights for user ${userId} with ${allTransactions.length} transactions`)

    // Generate insights with caching
    const { insights, fromCache, generatedAt } = await generateInsightsWithCaching(
      allTransactions,
      monthlyIncome,
      existingInsights,
      lastGenerated
    )

    if (fromCache) {
      console.log('Returning cached insights')
      return NextResponse.json({
        insights: existingInsights,
        fromCache: true,
        generatedAt: lastGenerated,
        message: 'Using cached insights'
      })
    }

    // Store new insights in database
    console.log(`Storing ${insights.length} new insights`)
    
    try {
      // Use a transaction to create all insights atomically and reduce connection overhead
      const createdInsights = await db.$transaction(
        insights.map(insight => 
          db.insight.create({
            data: {
              userId,
              content: JSON.stringify(insight),
              type: insight.category,
              createdAt: generatedAt,
              updatedAt: generatedAt
            }
          })
        )
      )

      console.log(`Successfully created ${createdInsights.length} insights`)

      return NextResponse.json({
        insights: createdInsights.map(insight => ({
          ...insight,
          parsedContent: JSON.parse(insight.content)
        })),
        fromCache: false,
        generatedAt,
        message: `Generated ${insights.length} new insights`
      })
    } catch (dbError) {
      console.error('Database error when storing insights:', dbError)
      
      // Return the insights anyway, even if we can't store them
      return NextResponse.json({
        insights: insights.map(insight => ({
          id: `temp-${Date.now()}-${Math.random()}`,
          userId,
          content: JSON.stringify(insight),
          type: insight.category,
          createdAt: generatedAt,
          updatedAt: generatedAt,
          parsedContent: insight
        })),
        fromCache: false,
        generatedAt,
        message: `Generated ${insights.length} insights (not saved due to database error)`,
        warning: 'Insights generated but not saved. Please check database connection.'
      })
    }

  } catch (error) {
    console.error('Error generating insights:', error)
    
    if (error instanceof Error) {
      // Handle specific AI service errors
      if (error.message.includes('AI service is temporarily busy')) {
        return NextResponse.json({ 
          error: 'AI service is temporarily busy. Please try again in a moment.' 
        }, { status: 503 })
      }
      
      if (error.message.includes('quota exceeded')) {
        return NextResponse.json({ 
          error: 'AI service quota exceeded. Please try again later.' 
        }, { status: 429 })
      }
      
      if (error.message.includes('configuration error')) {
        return NextResponse.json({ 
          error: 'AI service configuration error. Please contact support.' 
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate insights. Please try again.' 
    }, { status: 500 })
  }
}

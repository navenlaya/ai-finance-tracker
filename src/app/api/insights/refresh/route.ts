import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { generateAllInsights } from '@/lib/ai/insights'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Refreshing insights for user ${userId}`)

    // Delete all existing insights for this user
    await db.insight.deleteMany({
      where: { userId }
    })

    console.log('Deleted existing insights')

    // Check if user has connected accounts
    const accounts = await db.account.findMany({
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
    })

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

    // Calculate monthly income (rough estimate from positive transactions)
    const monthlyIncome = allTransactions
      .filter(t => t.amount < 0) // Income is negative in Plaid
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 3 // Rough monthly estimate

    console.log(`Generating fresh insights for ${allTransactions.length} transactions`)

    // Generate fresh insights
    const { allInsights } = await generateAllInsights(allTransactions, monthlyIncome)

    // Store new insights in database
    console.log(`Storing ${allInsights.length} fresh insights`)
    
    // Use a transaction to create all insights atomically and reduce connection overhead
    const createdInsights = await db.$transaction(
      allInsights.map(insight => 
        db.insight.create({
          data: {
            userId,
            content: JSON.stringify(insight),
            type: insight.category,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      )
    )

    console.log(`Successfully refreshed ${createdInsights.length} insights`)

    return NextResponse.json({
      insights: createdInsights.map(insight => ({
        ...insight,
        parsedContent: JSON.parse(insight.content)
      })),
      message: `Refreshed ${allInsights.length} insights`,
      generatedAt: new Date()
    })

  } catch (error) {
    console.error('Error refreshing insights:', error)
    
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
      error: 'Failed to refresh insights. Please try again.' 
    }, { status: 500 })
  }
}

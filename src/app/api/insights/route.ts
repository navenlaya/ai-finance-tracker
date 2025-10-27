import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')

    // Build where clause
    const whereClause: any = { userId }
    if (category && category !== 'all') {
      whereClause.type = category
    }

    // Fetch insights from database
    const insights = await db.insight.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Parse the content field and add metadata
    const parsedInsights = insights.map(insight => {
      try {
        const parsedContent = JSON.parse(insight.content)
        return {
          id: insight.id,
          userId: insight.userId,
          type: insight.type,
          createdAt: insight.createdAt,
          updatedAt: insight.updatedAt,
          ...parsedContent
        }
      } catch (error) {
        console.error('Error parsing insight content:', error)
        return {
          id: insight.id,
          userId: insight.userId,
          type: insight.type,
          createdAt: insight.createdAt,
          updatedAt: insight.updatedAt,
          title: 'Parsing Error',
          description: 'Unable to parse insight content',
          category: 'general',
          priority: 'low'
        }
      }
    })

    // Group insights by category for easier frontend consumption
    const groupedInsights = parsedInsights.reduce((groups, insight) => {
      const category = insight.category || 'general'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(insight)
      return groups
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      insights: parsedInsights,
      groupedInsights,
      total: insights.length,
      lastUpdated: insights.length > 0 ? insights[0].createdAt : null
    })

  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch insights' 
    }, { status: 500 })
  }
}

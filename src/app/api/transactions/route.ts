import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    console.log('Transactions API: userId =', userId)
    
    if (!userId) {
      console.log('Transactions API: No userId, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get search params for filtering
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('Transactions API: Fetching transactions for user', userId)

    // Build where clause - transactions are filtered through account relationship
    const where: any = {
      account: {
        userId
      }
    }

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // Fetch transactions
    const transactions = await db.transaction.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        account: {
          select: {
            accountName: true,
            institutionName: true
          }
        }
      }
    })

    console.log('Transactions API: Found', transactions.length, 'transactions')

    // Get total count for pagination
    const totalCount = await db.transaction.count({ where })

    const response = {
      transactions,
      totalCount,
      hasMore: offset + transactions.length < totalCount
    }
    
    console.log('Transactions API: Returning response:', response)
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

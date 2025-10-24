import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Test database connection
    const userCount = await db.user.count()
    const accountCount = await db.account.count()
    const transactionCount = await db.transaction.count()

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      stats: {
        users: userCount,
        accounts: accountCount,
        transactions: transactionCount,
      },
      userId: userId,
    })

  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    
    return NextResponse.json(
      { 
        error: 'Database connection failed',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

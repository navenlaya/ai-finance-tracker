import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { calculateMonthlyIncome, calculateMonthlyExpenses } from '@/lib/plaid/utils'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current month start and end dates
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

    // Get all transactions for the current month
    const transactions = await db.transaction.findMany({
      where: {
        account: {
          userId: userId,
        },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        amount: true,
        date: true,
      },
    })

    // Calculate metrics
    const monthlyIncome = calculateMonthlyIncome(transactions)
    const monthlyExpenses = calculateMonthlyExpenses(transactions)
    const netIncome = monthlyIncome - monthlyExpenses
    const savingsRate = monthlyIncome > 0 ? (netIncome / monthlyIncome) * 100 : 0

    return NextResponse.json({
      monthlyIncome,
      monthlyExpenses,
      netIncome,
      savingsRate,
      transactionCount: transactions.length,
    })

  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}


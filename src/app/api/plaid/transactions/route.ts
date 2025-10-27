import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { plaidClient } from '@/lib/plaid/client'
import { decrypt } from '@/lib/utils/encryption'
import { db } from '@/lib/db'
import { TransactionsGetRequest } from 'plaid'
import { extractPlaidCategory } from '@/lib/plaid/utils'

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { accountId, startDate, endDate } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Get account from database
    const account = await db.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Decrypt access token
    const accessToken = decrypt(account.plaidAccessToken)

    // Set date range (default to last 30 days)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Fetch transactions from Plaid
    const transactionsRequest: TransactionsGetRequest = {
      access_token: accessToken,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    }

    const plaidResponse = await plaidClient.transactionsGet(transactionsRequest)
    const plaidTransactions = plaidResponse.data.transactions

    // Store transactions in database (avoid duplicates)
    let newTransactionsCount = 0
    let updatedTransactionsCount = 0

    for (const plaidTransaction of plaidTransactions) {
      // Check if transaction already exists
      const existingTransaction = await db.transaction.findFirst({
        where: {
          accountId: account.id,
          // Using transaction name and amount as unique identifier
          // In production, you'd want to use plaidTransactionId field
          name: plaidTransaction.name,
          amount: plaidTransaction.amount,
          date: new Date(plaidTransaction.date),
        },
      })

      if (existingTransaction) {
        // Update existing transaction
        await db.transaction.update({
          where: { id: existingTransaction.id },
          data: {
            category: extractPlaidCategory(plaidTransaction),
            pending: plaidTransaction.pending,
            updatedAt: new Date(),
          },
        })
        updatedTransactionsCount++
      } else {
        // Create new transaction
        await db.transaction.create({
          data: {
            accountId: account.id,
            amount: plaidTransaction.amount,
            date: new Date(plaidTransaction.date),
            name: plaidTransaction.name,
            category: extractPlaidCategory(plaidTransaction),
            pending: plaidTransaction.pending,
          },
        })
        newTransactionsCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transactions synced successfully',
      new_transactions: newTransactionsCount,
      updated_transactions: updatedTransactionsCount,
      total_transactions: plaidTransactions.length,
      date_range: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
    })

  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    
    // Handle Plaid-specific errors
    if (error.response?.data) {
      const plaidError = error.response.data
      
      if (plaidError.error_code === 'ITEM_LOGIN_REQUIRED') {
        return NextResponse.json(
          { 
            error: 'Bank account reconnection required',
            error_code: 'ITEM_LOGIN_REQUIRED',
            details: 'Please reconnect your bank account to continue syncing transactions'
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Failed to fetch transactions',
          details: plaidError.error_message 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { getTransactions } from '@/lib/api/plaid'
import { decrypt } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    // Get user's accounts
    const accounts = await db.account.findMany({
      where: { userId },
    })

    if (accounts.length === 0) {
      return NextResponse.json({
        transactions: [],
        message: 'No accounts connected',
      })
    }

    // Get transactions for each account
    const allTransactions = []
    const encryptionKey = process.env.ENCRYPTION_KEY!

    for (const account of accounts) {
      try {
        const accessToken = decrypt(account.plaidAccessToken, encryptionKey)
        const plaidTransactions = await getTransactions(accessToken, startDate, endDate)

        // Convert Plaid transactions to our format and store in database
        for (const plaidTx of plaidTransactions) {
          const existingTransaction = await db.transaction.findFirst({
            where: { 
              // Assuming we store plaid transaction ID in a field
              accountId: account.id,
              // You might want to add a plaidTransactionId field to your schema
            },
          })

          if (!existingTransaction) {
            await db.transaction.create({
              data: {
                accountId: account.id,
                amount: plaidTx.amount,
                date: new Date(plaidTx.date),
                name: plaidTx.name,
                category: plaidTx.category?.join(', '),
                pending: plaidTx.pending,
              },
            })
          }

          allTransactions.push({
            id: plaidTx.transaction_id,
            amount: plaidTx.amount,
            date: plaidTx.date,
            name: plaidTx.name,
            category: plaidTx.category,
            pending: plaidTx.pending,
            accountId: account.id,
          })
        }
      } catch (error) {
        console.error(`Error fetching transactions for account ${account.id}:`, error)
        // Continue with other accounts
      }
    }

    return NextResponse.json({ transactions: allTransactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

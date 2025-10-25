import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { plaidClient } from '@/lib/plaid/client'
import { decrypt } from '@/lib/utils/encryption'
import { db } from '@/lib/db'
import { TransactionsSyncRequest } from 'plaid'
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

    // Get all user's connected accounts
    const userAccounts = await db.account.findMany({
      where: { userId },
    })

    if (userAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts to sync',
        synced_accounts: 0,
        total_transactions: 0,
      })
    }

    let totalNewTransactions = 0
    let totalUpdatedTransactions = 0
    let syncedAccounts = 0
    const errors: string[] = []

    // Sync each account
    for (const account of userAccounts) {
      try {
        // Decrypt access token
        const accessToken = decrypt(account.plaidAccessToken)

        // Get the latest cursor for this account (if any)
        // For now, we'll sync all transactions from the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        // Use transactions/sync endpoint for efficient syncing
        const syncRequest: TransactionsSyncRequest = {
          access_token: accessToken,
          cursor: '', // Start from beginning for now
          count: 500,
        }

        const plaidResponse = await plaidClient.transactionsSync(syncRequest)
        const plaidTransactions = plaidResponse.data.added
        const modifiedTransactions = plaidResponse.data.modified
        const removedTransactions = plaidResponse.data.removed

        // Process added transactions
        for (const plaidTransaction of plaidTransactions) {
          // Check if transaction already exists
          const existingTransaction = await db.transaction.findFirst({
            where: {
              accountId: account.id,
              name: plaidTransaction.name,
              amount: plaidTransaction.amount,
              date: new Date(plaidTransaction.date),
            },
          })

          if (!existingTransaction) {
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
            totalNewTransactions++
          }
        }

        // Process modified transactions
        for (const plaidTransaction of modifiedTransactions) {
          const existingTransaction = await db.transaction.findFirst({
            where: {
              accountId: account.id,
              name: plaidTransaction.name,
              amount: plaidTransaction.amount,
              date: new Date(plaidTransaction.date),
            },
          })

          if (existingTransaction) {
            await db.transaction.update({
              where: { id: existingTransaction.id },
              data: {
                category: extractPlaidCategory(plaidTransaction),
                pending: plaidTransaction.pending,
                updatedAt: new Date(),
              },
            })
            totalUpdatedTransactions++
          }
        }

        // Process removed transactions (mark as deleted or remove)
        for (const removedTransaction of removedTransactions) {
          await db.transaction.deleteMany({
            where: {
              accountId: account.id,
              name: removedTransaction.name,
              amount: removedTransaction.amount,
              date: new Date(removedTransaction.date),
            },
          })
        }

        // Update account's last sync time
        await db.account.update({
          where: { id: account.id },
          data: { updatedAt: new Date() },
        })

        syncedAccounts++

      } catch (error: any) {
        console.error(`Error syncing account ${account.id}:`, error)
        
        if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
          errors.push(`Account ${account.institutionName} requires reconnection`)
        } else {
          errors.push(`Failed to sync account ${account.institutionName}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      synced_accounts: syncedAccounts,
      total_accounts: userAccounts.length,
      new_transactions: totalNewTransactions,
      updated_transactions: totalUpdatedTransactions,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error: any) {
    console.error('Error during sync:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

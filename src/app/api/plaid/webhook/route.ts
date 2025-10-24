import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/utils/encryption'
import { plaidClient } from '@/lib/plaid/client'
import { handlePlaidWebhook, createErrorResponse } from '@/lib/plaid/error-handling'
import { TransactionsSyncRequest } from 'plaid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate webhook
    if (!body.webhook_type || !body.webhook_code || !body.item_id) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Log webhook for debugging
    console.log('Plaid webhook received:', {
      webhook_type: body.webhook_type,
      webhook_code: body.webhook_code,
      item_id: body.item_id,
    })

    // Handle different webhook types
    switch (body.webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionWebhook(body)
        break
      
      case 'ITEM':
        await handleItemWebhook(body)
        break
      
      case 'ACCOUNTS':
        await handleAccountWebhook(body)
        break
      
      default:
        console.log('Unhandled webhook type:', body.webhook_type)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleTransactionWebhook(webhookData: any) {
  const { webhook_code, item_id, new_transactions, removed_transactions } = webhookData

  switch (webhook_code) {
    case 'INITIAL_UPDATE':
    case 'HISTORICAL_UPDATE':
    case 'DEFAULT_UPDATE':
      await syncTransactionsForItem(item_id, new_transactions)
      break
    
    case 'TRANSACTIONS_REMOVED':
      await removeTransactionsForItem(item_id, removed_transactions)
      break
    
    default:
      console.log('Unhandled transaction webhook code:', webhook_code)
  }
}

async function handleItemWebhook(webhookData: any) {
  const { webhook_code, item_id } = webhookData

  switch (webhook_code) {
    case 'ERROR':
      console.error('Item error for item_id:', item_id)
      // You might want to mark the account as needing reconnection
      break
    
    case 'NEW_ACCOUNTS_AVAILABLE':
      console.log('New accounts available for item_id:', item_id)
      // You might want to fetch and store new accounts
      break
    
    default:
      console.log('Unhandled item webhook code:', webhook_code)
  }
}

async function handleAccountWebhook(webhookData: any) {
  const { webhook_code, item_id } = webhookData

  switch (webhook_code) {
    case 'ERROR':
      console.error('Account error for item_id:', item_id)
      break
    
    default:
      console.log('Unhandled account webhook code:', webhook_code)
  }
}

async function syncTransactionsForItem(itemId: string, newTransactions: number) {
  try {
    // Find the account by item ID
    const account = await db.account.findFirst({
      where: { plaidItemId: itemId },
    })

    if (!account) {
      console.error('Account not found for item_id:', itemId)
      return
    }

    // Decrypt access token
    const accessToken = decrypt(account.plaidAccessToken)

    // Use transactions/sync to get new transactions
    const syncRequest: TransactionsSyncRequest = {
      access_token: accessToken,
      cursor: '', // You should store and use the actual cursor
      count: 500,
    }

    const plaidResponse = await plaidClient.transactionsSync(syncRequest)
    const addedTransactions = plaidResponse.data.added
    const modifiedTransactions = plaidResponse.data.modified
    const removedTransactions = plaidResponse.data.removed

    // Process added transactions
    for (const plaidTransaction of addedTransactions) {
      await db.transaction.upsert({
        where: {
          plaidTransactionId: plaidTransaction.transaction_id,
        },
        update: {
          amount: plaidTransaction.amount,
          date: new Date(plaidTransaction.date),
          name: plaidTransaction.name,
          category: plaidTransaction.category?.[0] || null,
          pending: plaidTransaction.pending,
          merchantName: plaidTransaction.merchant_name || null,
          location: plaidTransaction.location || null,
          updatedAt: new Date(),
        },
        create: {
          accountId: account.id,
          amount: plaidTransaction.amount,
          date: new Date(plaidTransaction.date),
          name: plaidTransaction.name,
          category: plaidTransaction.category?.[0] || null,
          pending: plaidTransaction.pending,
          plaidTransactionId: plaidTransaction.transaction_id,
          merchantName: plaidTransaction.merchant_name || null,
          location: plaidTransaction.location || null,
        },
      })
    }

    // Process modified transactions
    for (const plaidTransaction of modifiedTransactions) {
      await db.transaction.updateMany({
        where: {
          plaidTransactionId: plaidTransaction.transaction_id,
        },
        data: {
          amount: plaidTransaction.amount,
          date: new Date(plaidTransaction.date),
          name: plaidTransaction.name,
          category: plaidTransaction.category?.[0] || null,
          pending: plaidTransaction.pending,
          merchantName: plaidTransaction.merchant_name || null,
          location: plaidTransaction.location || null,
          updatedAt: new Date(),
        },
      })
    }

    // Process removed transactions
    for (const removedTransaction of removedTransactions) {
      await db.transaction.deleteMany({
        where: {
          plaidTransactionId: removedTransaction.transaction_id,
        },
      })
    }

    // Update account's last sync time
    await db.account.update({
      where: { id: account.id },
      data: { 
        lastSync: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log(`Synced ${addedTransactions.length} new transactions for item ${itemId}`)

  } catch (error) {
    console.error('Error syncing transactions for item:', itemId, error)
  }
}

async function removeTransactionsForItem(itemId: string, removedTransactions: any[]) {
  try {
    // Find the account by item ID
    const account = await db.account.findFirst({
      where: { plaidItemId: itemId },
    })

    if (!account) {
      console.error('Account not found for item_id:', itemId)
      return
    }

    // Remove transactions
    for (const removedTransaction of removedTransactions) {
      await db.transaction.deleteMany({
        where: {
          accountId: account.id,
          plaidTransactionId: removedTransaction.transaction_id,
        },
      })
    }

    console.log(`Removed ${removedTransactions.length} transactions for item ${itemId}`)

  } catch (error) {
    console.error('Error removing transactions for item:', itemId, error)
  }
}

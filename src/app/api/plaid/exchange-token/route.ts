import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { plaidClient } from '@/lib/plaid/client'
import { encrypt } from '@/lib/utils/encryption'
import { db } from '@/lib/db'
import { ItemPublicTokenExchangeRequest, AccountsGetRequest } from 'plaid'
import { extractPlaidCategory } from '@/lib/plaid/utils'

export async function POST(request: NextRequest) {
  try {
    console.log('=== PLAID EXCHANGE TOKEN START ===')
    
    // Verify user authentication
    const { userId } = auth()
    const user = await currentUser()
    
    console.log('User ID from auth:', userId)
    console.log('User from currentUser:', user ? 'Present' : 'Missing')
    
    if (!userId) {
      console.error('Error: No user ID from auth')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { public_token } = body
    
    console.log('Received public_token:', public_token ? 'Present' : 'Missing')

    if (!public_token) {
      console.error('Error: Public token is required')
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      )
    }

    // Ensure user exists in database
    try {
      console.log('Upserting user in database...')
      await db.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: user?.emailAddresses?.[0]?.emailAddress || 'unknown@example.com',
        },
      })
      console.log('User upserted successfully')
    } catch (error) {
      console.error('Error upserting user:', error)
      throw error
    }

    // Exchange public token for access token
    console.log('Exchanging public token with Plaid...')
    const exchangeRequest: ItemPublicTokenExchangeRequest = {
      public_token,
    }

    let exchangeResponse
    try {
      exchangeResponse = await plaidClient.itemPublicTokenExchange(exchangeRequest)
      console.log('Plaid exchange successful, item_id:', exchangeResponse.data.item_id)
    } catch (error) {
      console.error('Plaid exchange error:', error)
      throw error
    }

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id
    console.log('Access token length:', accessToken.length)
    console.log('Item ID:', itemId)

    // Encrypt the access token before storing
    console.log('Encrypting access token...')
    let encryptedAccessToken
    try {
      encryptedAccessToken = encrypt(accessToken)
      console.log('Access token encrypted successfully')
    } catch (error) {
      console.error('Error encrypting access token:', error)
      throw error
    }

    // Get account information from Plaid
    console.log('Fetching accounts from Plaid...')
    const accountsRequest: AccountsGetRequest = {
      access_token: accessToken,
    }

    let accountsResponse
    try {
      accountsResponse = await plaidClient.accountsGet(accountsRequest)
      console.log('Plaid accounts fetch successful, found', accountsResponse.data.accounts.length, 'accounts')
    } catch (error) {
      console.error('Plaid accounts fetch error:', error)
      throw error
    }

    const accounts = accountsResponse.data.accounts
    console.log('Account details:', accounts.map(acc => ({ 
      id: acc.account_id, 
      name: acc.name, 
      type: acc.type 
    })))

    // Store account information in database
    console.log('Checking for existing accounts with itemId:', itemId)
    let existingAccounts
    try {
      existingAccounts = await db.account.findMany({
        where: {
          plaidItemId: itemId,
        },
      })
      console.log('Found', existingAccounts.length, 'existing accounts for this item')
    } catch (error) {
      console.error('Error fetching existing accounts:', error)
      throw error
    }

    console.log('Processing', accounts.length, 'accounts...')
    const accountPromises = accounts.map(async (account, index) => {
      try {
        console.log(`Processing account ${index + 1}/${accounts.length}:`, {
          id: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype
        })
        
        // Check if this specific account already exists
        const existingAccount = existingAccounts.find(acc => 
          acc.accountName === account.name
        )

        if (existingAccount) {
          console.log(`Updating existing account: ${existingAccount.id}`)
          // Update existing account
          return db.account.update({
            where: { id: existingAccount.id },
            data: {
              plaidAccessToken: encryptedAccessToken,
              institutionName: accountsResponse.data.item.institution_id || 'Unknown',
              accountType: account.type,
              accountName: account.name,
              // accountSubtype: account.subtype, // Temporarily disabled due to TypeScript cache
              updatedAt: new Date(),
            },
          })
        } else {
          console.log(`Creating new account for: ${account.name} (${account.type})`)
          // Create new account
          return db.account.create({
            data: {
              userId,
              plaidAccessToken: encryptedAccessToken,
              plaidItemId: itemId,
              institutionName: accountsResponse.data.item.institution_id || 'Unknown',
              accountType: account.type,
              accountName: account.name,
              // accountSubtype: account.subtype, // Temporarily disabled due to TypeScript cache
            },
          })
        }
      } catch (error) {
        console.error(`Error processing account ${account.account_id}:`, error)
        console.error('Account details:', {
          id: account.account_id,
          name: account.name,
          type: account.type,
          userId,
          itemId
        })
        // Return null for failed accounts, we'll filter them out
        return null
      }
    })

    console.log('Executing account operations...')
    const accountResults = await Promise.all(accountPromises)
    console.log('Account operations completed')
    
    const successfulAccounts = accountResults.filter(account => account !== null)
    console.log('Successful accounts:', successfulAccounts.length, 'out of', accounts.length)
    
    if (successfulAccounts.length === 0) {
      console.error('No accounts were created or updated successfully')
      throw new Error('Failed to create or update any accounts')
    }

    // Automatically fetch transactions for the last 90 days
    let totalTransactionsSynced = 0
    try {
      console.log('Auto-syncing transactions after account connection...')
      
      // Get transactions from Plaid (last 90 days)
      const endDate = new Date()
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      
      const transactionsRequest = {
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      }
      
      const plaidTransactionsResponse = await plaidClient.transactionsGet(transactionsRequest)
      const plaidTransactions = plaidTransactionsResponse.data.transactions
      
      console.log(`Found ${plaidTransactions.length} transactions to sync`)
      
      // Store transactions in database (batch processing)
      const transactionBatch = []
      
      for (const plaidTransaction of plaidTransactions) {
        // Find the corresponding account
        const account = accounts.find(acc => acc.account_id === plaidTransaction.account_id)
        if (!account) continue
        
        // Find our database account record
        const dbAccount = successfulAccounts.find(acc => acc.accountType === account.type)
        if (!dbAccount) continue
        
        // Check if transaction already exists
        const existingTransaction = await db.transaction.findFirst({
          where: {
            accountId: dbAccount.id,
            plaidTransactionId: plaidTransaction.transaction_id,
          },
        })
        
        if (!existingTransaction) {
          transactionBatch.push({
            accountId: dbAccount.id,
            amount: plaidTransaction.amount,
            date: new Date(plaidTransaction.date),
            name: plaidTransaction.name,
            category: extractPlaidCategory(plaidTransaction),
            pending: plaidTransaction.pending,
            plaidTransactionId: plaidTransaction.transaction_id,
            merchantName: plaidTransaction.merchant_name || null,
            location: plaidTransaction.location || null,
          })
        }
      }
      
      // Batch insert transactions
      if (transactionBatch.length > 0) {
        await db.transaction.createMany({
          data: transactionBatch,
          skipDuplicates: true,
        })
        totalTransactionsSynced = transactionBatch.length
      }
      
      console.log(`Successfully synced ${totalTransactionsSynced} new transactions`)
      
    } catch (transactionError) {
      console.error('Error auto-syncing transactions:', transactionError)
      // Don't fail the entire request if transaction sync fails
    }

    console.log('=== PLAID EXCHANGE TOKEN SUCCESS ===')
    console.log('Final result:', {
      item_id: itemId,
      accounts_count: successfulAccounts.length,
      transactions_synced: totalTransactionsSynced
    })
    
    return NextResponse.json({
      success: true,
      message: 'Bank account connected successfully',
      item_id: itemId,
      accounts_count: successfulAccounts.length,
      transactions_synced: totalTransactionsSynced,
    })

  } catch (error: any) {
    console.error('=== PLAID EXCHANGE TOKEN ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)
    
    // Handle Plaid-specific errors
    if (error.response?.data) {
      console.error('Plaid error details:', error.response.data)
      return NextResponse.json(
        { 
          error: 'Failed to connect bank account',
          details: error.response.data.error_message,
          error_code: error.response.data.error_code
        },
        { status: 400 }
      )
    }

    // Handle Prisma errors
    if (error.code && error.code.startsWith('P')) {
      console.error('Prisma error:', error)
      console.error('Prisma error details:', error.meta)
      return NextResponse.json(
        { 
          error: 'Database error occurred',
          details: `Database error: ${error.code} - ${error.message}`
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
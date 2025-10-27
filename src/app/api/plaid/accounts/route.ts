import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { plaidClient } from '@/lib/plaid/client'
import { decrypt } from '@/lib/utils/encryption'
import { db } from '@/lib/db'
import { AccountsGetRequest } from 'plaid'

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

    // Get user's connected accounts from database (optimized query)
    const userAccounts = await db.account.findMany({
      where: { userId },
      select: {
        id: true,
        plaidAccessToken: true,
        plaidItemId: true,
        institutionName: true,
        accountType: true,
        accountName: true,
        accountSubtype: true,
        lastSync: true,
        createdAt: true,
        updatedAt: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 5, // Get latest 5 transactions per account
          select: {
            id: true,
            amount: true,
            date: true,
            name: true,
            category: true,
            pending: true,
          },
        },
      },
    })

    if (userAccounts.length === 0) {
      return NextResponse.json({
        accounts: [],
        message: 'No accounts connected yet',
      })
    }

    // Fetch current account details from Plaid
    const accountsWithDetails = await Promise.all(
      userAccounts.map(async (account) => {
        try {
          // Decrypt access token
          const accessToken = decrypt(account.plaidAccessToken)

          // Get account details from Plaid
          const accountsRequest: AccountsGetRequest = {
            access_token: accessToken,
          }

          const plaidResponse = await plaidClient.accountsGet(accountsRequest)
          const plaidAccounts = plaidResponse.data.accounts

          // Find matching account in Plaid response
          const plaidAccount = plaidAccounts.find(acc => 
            acc.type === account.accountType
          )

          if (!plaidAccount) {
            return {
              id: account.id,
              name: account.institutionName,
              type: account.accountType,
              balance: 0,
              currency: 'USD',
              error: 'Account not found in Plaid',
              transactions: account.transactions,
            }
          }

          return {
            id: account.id,
            name: plaidAccount.name,
            type: plaidAccount.type,
            subtype: plaidAccount.subtype,
            balance: plaidAccount.balances.current || 0,
            available_balance: plaidAccount.balances.available || 0,
            currency: plaidAccount.balances.iso_currency_code || 'USD',
            institution: account.institutionName,
            last_sync: account.updatedAt,
            transactions: account.transactions,
          }
        } catch (error: any) {
          console.error(`Error fetching account ${account.id}:`, error)
          
          // Handle ITEM_LOGIN_REQUIRED error
          if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
            return {
              id: account.id,
              name: account.institutionName,
              type: account.accountType,
              balance: 0,
              currency: 'USD',
              error: 'Reconnection required',
              needs_reauth: true,
              transactions: account.transactions,
            }
          }

          return {
            id: account.id,
            name: account.institutionName,
            type: account.accountType,
            balance: 0,
            currency: 'USD',
            error: 'Unable to fetch current balance',
            transactions: account.transactions,
          }
        }
      })
    )

    // Calculate total balance
    const totalBalance = accountsWithDetails.reduce((sum, account) => {
      return sum + (account.balance || 0)
    }, 0)

    return NextResponse.json({
      accounts: accountsWithDetails,
      total_balance: totalBalance,
      accounts_count: accountsWithDetails.length,
    })

  } catch (error: any) {
    console.error('Error fetching accounts:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

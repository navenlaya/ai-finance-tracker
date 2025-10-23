import { PlaidApi, Configuration, PlaidEnvironments } from 'plaid'
import { PlaidLinkTokenResponse, PlaidExchangeTokenResponse, PlaidAccount, PlaidTransaction } from '@/types'

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(configuration)

export async function createLinkToken(userId: string): Promise<PlaidLinkTokenResponse> {
  try {
    const request = {
      user: {
        client_user_id: userId,
      },
      client_name: 'AI Finance Tracker',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    }

    const response = await plaidClient.linkTokenCreate(request)
    return response.data
  } catch (error) {
    console.error('Error creating link token:', error)
    throw new Error('Failed to create link token')
  }
}

export async function exchangePublicToken(publicToken: string): Promise<PlaidExchangeTokenResponse> {
  try {
    const request = {
      public_token: publicToken,
    }

    const response = await plaidClient.itemPublicTokenExchange(request)
    return response.data
  } catch (error) {
    console.error('Error exchanging public token:', error)
    throw new Error('Failed to exchange public token')
  }
}

export async function getAccounts(accessToken: string): Promise<PlaidAccount[]> {
  try {
    const request = {
      access_token: accessToken,
    }

    const response = await plaidClient.accountsGet(request)
    return response.data.accounts
  } catch (error) {
    console.error('Error getting accounts:', error)
    throw new Error('Failed to get accounts')
  }
}

export async function getTransactions(accessToken: string, startDate: string, endDate: string): Promise<PlaidTransaction[]> {
  try {
    const request = {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    }

    const response = await plaidClient.transactionsGet(request)
    return response.data.transactions
  } catch (error) {
    console.error('Error getting transactions:', error)
    throw new Error('Failed to get transactions')
  }
}

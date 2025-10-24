import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

// Initialize Plaid client with sandbox configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

// Create and export the Plaid client instance
export const plaidClient = new PlaidApi(configuration)

// Export Plaid environment for reference
export const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

// Type definitions for better TypeScript support
export interface PlaidLinkTokenRequest {
  user: {
    client_user_id: string
  }
  client_name: string
  products: string[]
  country_codes: string[]
  language: string
}

export interface PlaidExchangeTokenRequest {
  public_token: string
}

export interface PlaidAccount {
  account_id: string
  name: string
  type: string
  subtype: string
  balances: {
    available: number | null
    current: number | null
    iso_currency_code: string | null
  }
}

export interface PlaidTransaction {
  transaction_id: string
  account_id: string
  amount: number
  date: string
  name: string
  category: string[]
  pending: boolean
  merchant_name?: string
  location?: {
    address?: string
    city?: string
    region?: string
    country?: string
  }
}

// Error handling types
export interface PlaidError {
  error_type: string
  error_code: string
  error_message: string
  display_message?: string
  request_id?: string
}

// Helper function to handle Plaid errors
export function handlePlaidError(error: any): PlaidError {
  if (error.response?.data) {
    return error.response.data
  }
  
  return {
    error_type: 'UNKNOWN_ERROR',
    error_code: 'UNKNOWN_ERROR',
    error_message: error.message || 'An unknown error occurred',
  }
}

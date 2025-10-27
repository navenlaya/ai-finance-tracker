import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { plaidClient } from '@/lib/plaid/client'
import { Products, CountryCode } from 'plaid'

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create link token request
    const linkTokenRequest = {
      user: {
        client_user_id: userId,
      },
      client_name: 'AI Finance Tracker',
      products: ['transactions' as Products.Transactions, 'auth' as Products.Auth],
      country_codes: ['US' as CountryCode.Us],
      language: 'en',
      webhook: process.env.PLAID_WEBHOOK_URL || undefined,
    }

    // Generate link token
    const response = await plaidClient.linkTokenCreate(linkTokenRequest)
    
    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    })

  } catch (error: any) {
    console.error('Error creating link token:', error)
    
    // Handle Plaid-specific errors
    if (error.response?.data) {
      return NextResponse.json(
        { 
          error: 'Failed to create link token',
          details: error.response.data.error_message 
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
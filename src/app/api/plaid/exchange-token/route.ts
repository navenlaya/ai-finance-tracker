import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { exchangePublicToken, getAccounts } from '@/lib/api/plaid'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { publicToken } = await request.json()
    
    if (!publicToken) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      )
    }

    // Exchange public token for access token
    const tokenResponse = await exchangePublicToken(publicToken)
    
    // Get accounts for this item
    const accounts = await getAccounts(tokenResponse.access_token)
    
    // Create or update user in database
    const user = await db.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: '', // Will be updated from Clerk webhook
      },
    })

    // Store account information
    const encryptionKey = process.env.ENCRYPTION_KEY!
    const encryptedAccessToken = encrypt(tokenResponse.access_token, encryptionKey)

    // Create account record
    const account = await db.account.create({
      data: {
        userId: user.id,
        plaidAccessToken: encryptedAccessToken,
        plaidItemId: tokenResponse.item_id,
        institutionName: 'Connected Bank', // This should come from Plaid
        accountType: 'checking',
      },
    })

    return NextResponse.json({
      success: true,
      accountId: account.id,
      itemId: tokenResponse.item_id,
    })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}

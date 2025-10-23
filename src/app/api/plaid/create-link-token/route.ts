import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createLinkToken } from '@/lib/api/plaid'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const linkToken = await createLinkToken(userId)
    
    return NextResponse.json(linkToken)
  } catch (error) {
    console.error('Error creating link token:', error)
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    )
  }
}

'use client'

import { useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'

interface PlaidLinkButtonProps {
  linkToken: string | null
  onSuccess?: () => void
}

export function PlaidLinkButton({ linkToken, onSuccess }: PlaidLinkButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const onPlaidSuccess = async (publicToken: string, metadata: any) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to exchange token')
      }

      const result = await response.json()
      
      if (result.success) {
        onSuccess?.()
      } else {
        throw new Error('Token exchange failed')
      }
    } catch (error) {
      console.error('Error exchanging token:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsLoading(false)
    }
  }

  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err: any, metadata: any) => {
      if (err) {
        console.error('Plaid Link error:', err)
      }
      setIsLoading(false)
    },
  }

  const { open, ready } = usePlaidLink(config)

  const handleClick = async () => {
    if (!linkToken) {
      // Create link token first
      try {
        setIsLoading(true)
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
        })
        
        if (!response.ok) {
          throw new Error('Failed to create link token')
        }
        
        const data = await response.json()
        // You would need to update the linkToken state here
        // This is a simplified version
      } catch (error) {
        console.error('Error creating link token:', error)
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (ready) {
      open()
    }
  }

  return (
    <Button 
      onClick={handleClick} 
      disabled={isLoading}
      className="flex items-center space-x-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      <span>
        {isLoading ? 'Connecting...' : 'Connect Bank Account'}
      </span>
    </Button>
  )
}

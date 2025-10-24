'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface PlaidLinkProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  onDataRefresh?: () => void
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children?: React.ReactNode
  redirectToDashboard?: boolean
}

// Global state to prevent multiple Plaid Link instances
let globalLinkToken: string | null = null
let globalLinkTokenPromise: Promise<string> | null = null
let globalPlaidInstance: any = null
let isPlaidInitialized = false
let activePlaidComponent: any = null
let plaidLinkCount = 0

export default function PlaidLink({ 
  onSuccess, 
  onError, 
  onDataRefresh,
  className,
  variant = 'default',
  size = 'default',
  children,
  redirectToDashboard = true
}: PlaidLinkProps) {
  const router = useRouter()
  const [linkToken, setLinkToken] = useState<string | null>(globalLinkToken)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStep, setConnectionStep] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  // Fetch link token when component mounts
  const fetchLinkToken = useCallback(async () => {
    // If we already have a token, use it
    if (globalLinkToken) {
      setLinkToken(globalLinkToken)
      return
    }

    // If there's already a request in progress, wait for it
    if (globalLinkTokenPromise) {
      try {
        const token = await globalLinkTokenPromise
        setLinkToken(token)
        return
      } catch (error) {
        // If the global request failed, we'll make our own
      }
    }

    try {
      setIsLoading(true)
      
      // Create a new promise for this request
      globalLinkTokenPromise = fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to create link token')
        }
        const data = await response.json()
        globalLinkToken = data.link_token
        return data.link_token
      })

      const token = await globalLinkTokenPromise
      setLinkToken(token)
    } catch (error) {
      console.error('Error fetching link token:', error)
      onError?.('Failed to initialize bank connection. Please try again.')
    } finally {
      setIsLoading(false)
      globalLinkTokenPromise = null
    }
  }, [onError])

  // Handle successful Plaid Link
  const onPlaidSuccess = useCallback(async (publicToken: string) => {
    try {
      setIsConnecting(true)
      setError(null)
      setConnectionStep('Connecting your account...')
      
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token: publicToken }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Exchange token error:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to connect bank account')
      }

      setConnectionStep('Syncing transactions...')
      const data = await response.json()
      
      // Show success message with transaction count
      const transactionCount = data.transactions_synced || 0
      const message = `✅ Connected! Found ${transactionCount} transactions from the last 90 days.`
      setSuccessMessage(message)
      console.log('Bank account connected successfully:', data)
      
      // Trigger data refresh in parent component
      console.log('Triggering data refresh...')
      onDataRefresh?.()
      
      // Call success callback
      onSuccess?.()
      
      // Add a small delay before redirect to allow database operations to complete
      if (redirectToDashboard) {
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000) // 3 second delay to allow database operations to complete
      }
      
    } catch (error) {
      console.error('Error exchanging token:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to connect bank account')
    } finally {
      setIsConnecting(false)
      setConnectionStep('')
    }
  }, [onSuccess, onError, router, redirectToDashboard])

  // Handle Plaid Link errors
  const onPlaidError = useCallback((error: any) => {
    console.error('Plaid Link error:', error)
    onError?.('Bank connection was cancelled or failed. Please try again.')
  }, [onError])

  // Configure Plaid Link
  const config = {
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err: any, metadata: any) => {
      if (err) {
        onPlaidError(err)
      }
    },
    onEvent: (eventName: string, metadata: any) => {
      console.log('Plaid Link event:', eventName, metadata)
    },
  }

  const { open, ready } = usePlaidLink(config)

  // Prevent multiple Plaid Link instances
  useEffect(() => {
    plaidLinkCount++
    console.log(`PlaidLink component mounted. Total instances: ${plaidLinkCount}`)
    
    if (plaidLinkCount > 1) {
      console.warn(`Multiple Plaid Link instances detected (${plaidLinkCount}). This may cause issues.`)
    }
    
    if (!globalPlaidInstance) {
      globalPlaidInstance = open
    }
    
    return () => {
      plaidLinkCount--
      console.log(`PlaidLink component unmounted. Remaining instances: ${plaidLinkCount}`)
    }
  }, [open])

  // Handle button click
  const handleClick = useCallback(() => {
    if (!linkToken) {
      fetchLinkToken()
      return
    }
    
    if (ready) {
      open()
    }
  }, [linkToken, ready, open, fetchLinkToken])

  // Auto-fetch link token when component mounts (only once globally)
  useEffect(() => {
    // Only initialize Plaid Link once globally
    if (!isPlaidInitialized) {
      isPlaidInitialized = true
      fetchLinkToken()
    }

    // Cleanup when component unmounts
    return () => {
      // Reset global state when all components are unmounted
      if (plaidLinkCount === 0) {
        globalLinkToken = null
        globalLinkTokenPromise = null
        globalPlaidInstance = null
        isPlaidInitialized = false
        activePlaidComponent = null
      }
    }
  }, [fetchLinkToken])

  return (
    <div className={className}>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-green-800">
            <CheckCircle className="mr-2 h-5 w-5" />
            {successMessage}
          </div>
        </div>
      )}
      
      <Button
        onClick={handleClick}
        disabled={isLoading || isConnecting || (!linkToken && !isLoading)}
        variant={variant}
        size={size}
        className="relative"
      >
        {isLoading && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing...
          </>
        )}
        
        {isConnecting && (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {connectionStep || 'Connecting...'}
          </>
        )}
        
        {!isLoading && !isConnecting && (
          <>
            <Shield className="mr-2 h-4 w-4" />
            {children || 'Connect Bank Account'}
          </>
        )}
      </Button>
    </div>
  )
}

// Additional component for displaying connection status
export function PlaidConnectionStatus({ 
  isConnected, 
  accountCount = 0,
  lastSync,
  onSuccess,
  onDataRefresh
}: { 
  isConnected: boolean
  accountCount?: number
  lastSync?: Date
  onSuccess?: () => void
  onDataRefresh?: () => void
}) {
  if (!isConnected) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-800 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            No Bank Accounts Connected
          </CardTitle>
          <CardDescription className="text-orange-700">
            Connect your bank account to start tracking your finances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaidLink 
            onSuccess={onSuccess}
            onDataRefresh={onDataRefresh}
            redirectToDashboard={false}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-green-800 flex items-center">
          <CheckCircle className="mr-2 h-5 w-5" />
          Bank Account Connected
        </CardTitle>
        <CardDescription className="text-green-700">
          {accountCount} account{accountCount !== 1 ? 's' : ''} connected
          {lastSync && (
            <span className="block text-sm text-green-600 mt-1">
              Last synced: {lastSync.toLocaleDateString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <PlaidLink 
            variant="outline" 
            size="sm"
            onSuccess={onSuccess}
            onDataRefresh={onDataRefresh}
            redirectToDashboard={false}
          >
            Connect Another Account
          </PlaidLink>
          <Button variant="outline" size="sm">
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

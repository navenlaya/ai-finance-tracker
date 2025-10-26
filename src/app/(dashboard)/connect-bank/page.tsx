'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PlaidLink from '@/components/plaid/PlaidLink'
import { 
  Shield, 
  Lock, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Building2,
  CreditCard,
  TrendingUp,
  Loader2
} from 'lucide-react'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  institution: string
  error?: string
  needs_reauth?: boolean
}

export default function ConnectBankPage() {
  const { user } = useUser()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch user's connected accounts
  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/plaid/accounts')
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setError('Failed to load connected accounts')
    } finally {
      setIsLoading(false)
    }
  }

  // Sync transactions for all accounts
  const syncTransactions = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/plaid/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to sync transactions')
      }

      const data = await response.json()
      setSuccessMessage(`Synced ${data.new_transactions} new transactions`)
      
      // Refresh accounts to show updated data
      await fetchAccounts()
    } catch (error) {
      console.error('Error syncing transactions:', error)
      setError('Failed to sync transactions')
    } finally {
      setIsSyncing(false)
    }
  }

  // Handle successful bank connection
  const handleConnectionSuccess = () => {
    console.log('Connection success callback triggered')
    setSuccessMessage('Bank account connected successfully!')
    // Trigger immediate data refresh
    fetchAccounts()
  }

  // Handle data refresh from PlaidLink (with debounce)
  const handleDataRefresh = useCallback(() => {
    console.log('Data refresh triggered from PlaidLink')
    // Debounce rapid calls
    setTimeout(() => {
      setRefreshKey(prev => prev + 1) // Force re-render
      fetchAccounts() // Fetch fresh data
    }, 1000) // 1 second delay to prevent rapid successive calls
  }, [])

  // Handle connection errors
  const handleConnectionError = (error: string) => {
    setError(error)
  }

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts()
  }, [])

  // Refetch accounts when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      console.log('Refresh key changed, refetching accounts...')
      fetchAccounts()
    }
  }, [refreshKey])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Connect Bank Account
          </h1>
          <p className="text-gray-600 mt-2">
            Securely connect your bank accounts to track your finances
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-green-800">
              <CheckCircle className="mr-2 h-5 w-5" />
              {successMessage}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="mr-2 h-5 w-5" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Your Data is Secure
          </CardTitle>
          <CardDescription>
            We use bank-level security to protect your financial information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-green-600" />
              <span className="text-sm">256-bit encryption</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm">Read-only access</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm">SOC 2 compliant</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect Bank Account */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Bank Account</CardTitle>
          <CardDescription>
            Connect your bank account using Plaid to automatically import transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Connect?</h3>
            <p className="text-gray-600 mb-6">
              Click the button below to securely connect your bank account. 
              You'll be redirected to your bank's secure login page.
            </p>
            
            <PlaidLink
              onSuccess={handleConnectionSuccess}
              onError={handleConnectionError}
              onDataRefresh={handleDataRefresh}
              className="inline-block"
              redirectToDashboard={false}
            >
              Connect Bank Account
            </PlaidLink>
          </div>

          {/* Test Credentials Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Testing with Plaid Sandbox</h4>
            <p className="text-blue-800 text-sm mb-2">
              Use these test credentials when prompted:
            </p>
            <div className="bg-white rounded p-3 text-sm font-mono">
              <div>Username: <span className="font-bold">user_good</span></div>
              <div>Password: <span className="font-bold">pass_good</span></div>
              <div>PIN/MFA: <span className="font-bold">1234</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              Loading connected accounts...
            </div>
          </CardContent>
        </Card>
      ) : accounts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connected Accounts</span>
              <Button
                onClick={syncTransactions}
                disabled={isSyncing}
                size="sm"
                variant="outline"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Sync Transactions
                  </>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              Your connected bank accounts and their current balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-semibold">{account.name}</h4>
                      <p className="text-sm text-gray-600">
                        {account.institution} • {account.type}
                      </p>
                      {account.error && (
                        <p className="text-sm text-red-600">
                          {account.error}
                          {account.needs_reauth && (
                            <span className="ml-2 font-semibold">
                              (Reconnection required)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${account.balance.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{account.currency}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No bank accounts connected yet. Connect your first account above to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

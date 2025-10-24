'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PlaidLink, { PlaidConnectionStatus } from '@/components/plaid/PlaidLink'
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Brain, 
  Building2,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { 
  formatCurrency, 
  calculateAccountTotal, 
  calculateMonthlyIncome, 
  calculateMonthlyExpenses,
  getCategoryIcon,
  formatTransactionAmount
} from '@/lib/plaid/utils'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  institution: string
  error?: string
  needs_reauth?: boolean
  transactions: Array<{
    id: string
    amount: number
    date: Date
    name: string
    category: string | null
    pending: boolean
  }>
}

interface DashboardData {
  accounts: Account[]
  total_balance: number
  accounts_count: number
}

interface DashboardMetrics {
  monthlyIncome: number
  monthlyExpenses: number
  netIncome: number
  savingsRate: number
  transactionCount: number
}

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const [accountsResponse, metricsResponse] = await Promise.all([
        fetch('/api/plaid/accounts'),
        fetch('/api/plaid/dashboard-metrics')
      ])
      
      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const accountsData = await accountsResponse.json()
      setDashboardData(accountsData)

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // Sync transactions
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

      // Refresh dashboard data after sync
      await fetchDashboardData()
    } catch (error) {
      console.error('Error syncing transactions:', error)
      setError('Failed to sync transactions')
    } finally {
      setIsSyncing(false)
    }
  }

  // Handle successful bank connection
  const handleConnectionSuccess = () => {
    console.log('Dashboard: Connection success callback triggered')
    fetchDashboardData() // Refresh the dashboard data
  }

  // Handle data refresh from PlaidLink (with debounce)
  const handleDataRefresh = useCallback(() => {
    console.log('Dashboard: Data refresh triggered from PlaidLink')
    // Debounce rapid calls
    setTimeout(() => {
      setRefreshKey(prev => prev + 1) // Force re-render
      fetchDashboardData() // Fetch fresh data
    }, 1000) // 1 second delay to prevent rapid successive calls
  }, [])

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Refetch data when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      console.log('Dashboard: Refresh key changed, refetching data...')
      fetchDashboardData()
    }
  }, [refreshKey])

  // Refresh data when component becomes visible (after redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Calculate financial metrics
  const totalBalance = dashboardData?.total_balance || 0
  const accounts = dashboardData?.accounts || []
  const allTransactions = accounts.flatMap(account => account.transactions)
  
  // Use fetched metrics if available, otherwise calculate from limited transactions
  const monthlyIncome = metrics?.monthlyIncome ?? calculateMonthlyIncome(allTransactions)
  const monthlyExpenses = metrics?.monthlyExpenses ?? calculateMonthlyExpenses(allTransactions)
  const netIncome = metrics?.netIncome ?? (monthlyIncome - monthlyExpenses)
  const savingsRate = metrics?.savingsRate ?? (monthlyIncome > 0 ? (netIncome / monthlyIncome) * 100 : 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your financial health.
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length > 0 && (
            <Button
              onClick={syncTransactions}
              disabled={isSyncing}
              variant="outline"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync
                </>
              )}
            </Button>
          )}
          <Button onClick={() => router.push('/connect-bank')}>
            <Building2 className="mr-2 h-4 w-4" />
            {accounts.length > 0 ? 'Connect Another Bank' : 'Connect Bank Account'}
          </Button>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.length > 0 
                ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected`
                : 'No accounts connected yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatCurrency(monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {allTransactions.length > 0 
                ? 'This month'
                : 'No transactions yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {allTransactions.length > 0 
                ? 'This month'
                : 'No transactions yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netIncome >= 0 ? '+' : ''}{formatCurrency(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              {savingsRate > 0 
                ? `${savingsRate.toFixed(1)}% savings rate`
                : 'Income - Expenses'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {accounts.length > 0 
                ? 'Coming soon'
                : 'Connect accounts to get insights'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <PlaidConnectionStatus 
        isConnected={accounts.length > 0}
        accountCount={accounts.length}
        lastSync={accounts.length > 0 ? new Date() : undefined}
        onSuccess={handleConnectionSuccess}
        onDataRefresh={handleDataRefresh}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allTransactions.length > 0 ? (
              <div className="space-y-3">
                {allTransactions.slice(0, 5).map((transaction) => {
                  const IconComponent = getCategoryIcon(transaction.category)
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{transaction.name}</p>
                          <p className="text-sm text-gray-600">
                            {transaction.category || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const amountInfo = formatTransactionAmount(transaction.amount)
                          return (
                            <>
                              <p className={`font-semibold flex items-center justify-end gap-1 ${amountInfo.color}`}>
                                <span>{amountInfo.icon}</span>
                                {amountInfo.display}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.date).toLocaleDateString()}
                              </p>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}
                {allTransactions.length > 5 && (
                  <Button variant="outline" className="w-full mt-3">
                    View All Transactions
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No transactions yet. Connect your bank account to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              Personalized financial recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {accounts.length > 0 
                  ? 'AI insights are coming soon! We\'re working on personalized recommendations based on your spending patterns.'
                  : 'Connect your accounts to receive AI-powered insights about your spending patterns.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with these common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/connect-bank')}
            >
              <CreditCard className="h-6 w-6 mb-2" />
              {accounts.length > 0 ? 'Connect Another Bank' : 'Connect Bank Account'}
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              disabled={accounts.length === 0}
            >
              <Brain className="h-6 w-6 mb-2" />
              Generate Insights
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              disabled={accounts.length === 0}
            >
              <TrendingUp className="h-6 w-6 mb-2" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

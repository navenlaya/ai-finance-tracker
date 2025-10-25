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
  AlertCircle,
  Sparkles,
  ArrowRight,
  Calendar,
  BarChart3
} from 'lucide-react'
import { 
  formatCurrency, 
  calculateAccountTotal, 
  calculateMonthlyIncome, 
  calculateMonthlyExpenses,
  getCategoryIcon,
  formatTransactionAmount
} from '@/lib/plaid/utils'
import { Transaction } from '@prisma/client'

// Import new dashboard components
import { SpendingByCategoryChart } from '@/components/dashboard/SpendingByCategoryChart'
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart'
import { MonthlyComparisonChart } from '@/components/dashboard/MonthlyComparisonChart'
import { IncomeVsExpensesCard } from '@/components/dashboard/IncomeVsExpensesCard'
import { TotalSpendingCard } from '@/components/dashboard/TotalSpendingCard'
import { TopCategoryCard } from '@/components/dashboard/TopCategoryCard'
import { LargestTransactionCard } from '@/components/dashboard/LargestTransactionCard'
import { AverageDailySpendCard } from '@/components/dashboard/AverageDailySpendCard'
import { TransactionList } from '@/components/transactions/TransactionList'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  institution: string
  error?: string
  needs_reauth?: boolean
  transactions: Transaction[]
}

interface DashboardData {
  accounts: Account[]
  total_balance: number
  accounts_count: number
}

interface Insight {
  id: string
  title: string
  description: string
  category: 'spending' | 'budget' | 'savings' | 'income' | 'general' | 'cost reduction'
  priority: 'high' | 'medium' | 'low'
  potentialSavings?: number
  confidence?: number
  createdAt: string
}

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const [accountsResponse, transactionsResponse, insightsResponse] = await Promise.all([
        fetch('/api/plaid/accounts'),
        fetch('/api/transactions'),
        fetch('/api/insights?limit=3')
      ])
      
      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const accountsData = await accountsResponse.json()
      setDashboardData(accountsData)

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setAllTransactions(transactionsData.transactions || [])
      }

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        setInsights(insightsData.insights || [])
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

  // Generate AI insights
  const generateInsights = async () => {
    try {
      setIsGeneratingInsights(true)
      const response = await fetch('/api/insights/generate', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate insights')
      }

      const data = await response.json()
      setInsights(data.insights.map((insight: any) => ({
        ...insight,
        ...insight.parsedContent
      })))

      // Show warning if insights weren't saved
      if (data.warning) {
        setError(data.warning)
      }

      console.log(`Generated ${data.insights.length} insights`)
    } catch (error) {
      console.error('Error generating insights:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate insights')
    } finally {
      setIsGeneratingInsights(false)
    }
  }

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
  
  // Convert transactions to the format expected by utility functions
  const formattedTransactions = allTransactions.map(t => ({
    id: t.id,
    amount: t.amount,
    date: t.date,
    name: t.name,
    category: t.category,
    pending: t.pending
  }))
  
  // Calculate metrics from all transactions
  const monthlyIncome = calculateMonthlyIncome(formattedTransactions)
  const monthlyExpenses = calculateMonthlyExpenses(formattedTransactions)
  const netIncome = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (netIncome / monthlyIncome) * 100 : 0

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
      {/* SECTION 1: Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your financial health.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last synced: {new Date().toLocaleDateString()}</span>
          </div>
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
                  Sync Transactions
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

      {/* SECTION 2: Summary Cards (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <IncomeVsExpensesCard transactions={allTransactions} />
        <TotalSpendingCard transactions={allTransactions} />
        <TopCategoryCard transactions={allTransactions} />
        <AverageDailySpendCard transactions={allTransactions} />
      </div>

      {/* Connection Status */}
      <PlaidConnectionStatus 
        isConnected={accounts.length > 0}
        accountCount={accounts.length}
        lastSync={accounts.length > 0 ? new Date() : undefined}
        onSuccess={handleConnectionSuccess}
        onDataRefresh={handleDataRefresh}
      />

      {/* SECTION 3: AI Insights (Prominent) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Personalized financial recommendations based on your spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        insight.priority === 'high' ? 'bg-red-100 text-red-600' :
                        insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <Brain className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {insight.description}
                        </p>
                        {insight.potentialSavings && (
                          <div className="mt-2 text-sm font-medium text-green-600">
                            Save ${insight.potentialSavings.toFixed(0)}/month
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/insights')}
                >
                  View All Insights
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get AI-Powered Insights</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {accounts.length > 0 
                  ? 'Analyze your spending patterns and get personalized recommendations to improve your financial health.'
                  : 'Connect your accounts to receive AI-powered insights about your spending patterns.'
                }
              </p>
              {accounts.length > 0 ? (
                <Button
                  onClick={generateInsights}
                  disabled={isGeneratingInsights}
                  size="lg"
                >
                  {isGeneratingInsights ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Insights...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Insights
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/connect-bank')}
                  size="lg"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Connect Bank Account
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: Charts (2-column grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Spending Trend Chart */}
        <SpendingTrendChart transactions={allTransactions} />
        
        {/* Right column - Category and Comparison Charts */}
        <div className="space-y-6">
          <SpendingByCategoryChart transactions={allTransactions} />
          <MonthlyComparisonChart transactions={allTransactions} />
        </div>
      </div>

      {/* SECTION 5: Recent Transactions */}
      <TransactionList 
        transactions={allTransactions.slice(0, 10)} 
        isLoading={false}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with these common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              onClick={generateInsights}
              disabled={accounts.length === 0 || isGeneratingInsights}
            >
              {isGeneratingInsights ? (
                <Loader2 className="h-6 w-6 mb-2 animate-spin" />
              ) : (
                <Brain className="h-6 w-6 mb-2" />
              )}
              {isGeneratingInsights ? 'Generating...' : 'Generate Insights'}
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/transactions')}
              disabled={accounts.length === 0}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              View All Transactions
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => router.push('/insights')}
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
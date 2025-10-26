'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { ConnectedAccountsCard } from '@/components/dashboard/ConnectedAccountsCard'
import { 
  TrendingUp, 
  CreditCard, 
  Brain, 
  Building2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Wallet,
  Target
} from 'lucide-react'
import { 
  calculateMonthlyIncome, 
  calculateMonthlyExpenses
} from '@/lib/plaid/utils'
import { Transaction } from '@prisma/client'

// Import new dashboard components
import { SpendingByCategoryChart } from '@/components/dashboard/SpendingByCategoryChart'
import { SpendingTrendChart } from '@/components/dashboard/SpendingTrendChart'
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

  // Calculate metrics for StatCard
  const totalBalance = dashboardData?.total_balance || 0
  const monthlyIncome = calculateMonthlyIncome(formattedTransactions)
  const monthlyExpenses = calculateMonthlyExpenses(formattedTransactions)
  const savingsGoal = 10000
  const savingsProgress = (totalBalance / savingsGoal) * 100

  return (
    <div className="space-y-8">
      {/* Section A: Welcome Header */}
      <WelcomeHeader>
        {accounts.length > 0 && (
          <Button
            onClick={syncTransactions}
            disabled={isSyncing}
            variant="outline"
            size="sm"
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
        <Button onClick={() => router.push('/connect-bank')} size="sm">
          <Building2 className="mr-2 h-4 w-4" />
          {accounts.length > 0 ? 'Add Account' : 'Connect Bank'}
        </Button>
      </WelcomeHeader>

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
      {/* Section B: KPI Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={totalBalance}
          icon={Wallet}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Monthly Income"
          value={monthlyIncome}
          icon={TrendingUp}
          iconColor="text-green-500"
          trend={{
            value: 12,
            isPositive: true,
            label: "from last month"
          }}
        />
        <StatCard
          title="Monthly Spending"
          value={monthlyExpenses}
          icon={CreditCard}
          iconColor="text-red-500"
          trend={{
            value: -5,
            isPositive: false,
            label: "from last month"
          }}
        />
        <StatCard
          title="Savings Goal Progress"
          value={totalBalance}
          icon={Target}
          iconColor="text-purple-500"
          trend={{
            value: Math.round(savingsProgress),
            isPositive: true,
            label: "% of $10,000 goal"
          }}
        />
      </div>

      {/* SECTION 3: Charts Row (2 Cards - Equal Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingTrendChart transactions={allTransactions} />
        <SpendingByCategoryChart transactions={allTransactions} />
      </div>

      {/* SECTION 4: Details Row (2 Columns - Equal Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card - Recent Transactions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/transactions')}
              >
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionList 
              transactions={allTransactions.slice(0, 8)} 
              isLoading={false}
            />
          </CardContent>
        </Card>

        {/* Right Column - Two Stacked Cards */}
        <div className="space-y-6">
          {/* TOP: AI Insights Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <CardTitle>AI Insights</CardTitle>
                </div>
                {insights.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/insights')}
                  >
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {insights.length > 0 ? (
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          insight.priority === 'high' ? 'bg-red-100 text-red-600' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <Brain className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">{insight.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              insight.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {insight.priority === 'high' ? 'warning' : 'tip'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {insight.description}
                          </p>
                          {insight.potentialSavings && (
                            <div className="mt-2 text-xs font-medium text-green-600">
                              Save ${insight.potentialSavings.toFixed(0)}/month
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">No insights yet</h4>
                  <p className="text-xs text-gray-600 mb-4">
                    Generate insights to get personalized recommendations
                  </p>
                  {accounts.length > 0 && (
                    <Button
                      onClick={generateInsights}
                      disabled={isGeneratingInsights}
                      size="sm"
                    >
                      {isGeneratingInsights ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-3 w-3" />
                          Generate Insights
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* BOTTOM: Connected Accounts Card */}
          <ConnectedAccountsCard 
            accounts={accounts}
            onAddAccount={handleConnectionSuccess}
          />
        </div>
      </div>

    </div>
  )
}
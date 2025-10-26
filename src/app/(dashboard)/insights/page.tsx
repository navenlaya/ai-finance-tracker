'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, TrendingUp, DollarSign, AlertCircle, Sparkles, ArrowRight } from 'lucide-react'
import InsightsList from '@/components/insights/InsightsList'
import GenerateInsightsButton from '@/components/insights/GenerateInsightsButton'

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

interface Account {
  id: string
  accountName: string
  accountType: string
  institutionName: string
}

export default function InsightsPage() {
  const router = useRouter()
  const [insights, setInsights] = useState<Insight[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>()
  const [error, setError] = useState<string>()

  // Fetch accounts and insights on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(undefined)

      // Fetch accounts and insights in parallel
      const [accountsResponse, insightsResponse] = await Promise.all([
        fetch('/api/plaid/accounts'),
        fetch('/api/insights')
      ])

      if (!accountsResponse.ok) {
        throw new Error('Failed to fetch accounts')
      }

      if (!insightsResponse.ok) {
        throw new Error('Failed to fetch insights')
      }

      const accountsData = await accountsResponse.json()
      const insightsData = await insightsResponse.json()

      setAccounts(accountsData.accounts || [])
      setInsights(insightsData.insights || [])
      setLastUpdated(insightsData.lastUpdated)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateInsights = async () => {
    try {
      setIsGenerating(true)
      setError(undefined)

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
      setLastUpdated(data.generatedAt)

      // Show warning if insights weren't saved
      if (data.warning) {
        setError(data.warning)
      }

      // Show success message
      if (data.fromCache) {
        console.log('Used cached insights')
      } else {
        console.log(`Generated ${data.insights.length} new insights`)
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate insights')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRefreshInsights = async () => {
    try {
      setIsGenerating(true)
      setError(undefined)

      const response = await fetch('/api/insights/refresh', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refresh insights')
      }

      const data = await response.json()
      setInsights(data.insights.map((insight: any) => ({
        ...insight,
        ...insight.parsedContent
      })))
      setLastUpdated(data.generatedAt)

      console.log(`Refreshed ${data.insights.length} insights`)
    } catch (error) {
      console.error('Error refreshing insights:', error)
      setError(error instanceof Error ? error.message : 'Failed to refresh insights')
    } finally {
      setIsGenerating(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
                  <div className="space-y-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show connect bank account message if no accounts
  if (accounts.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect a bank account to generate insights
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            AI-powered insights help you understand your spending patterns, find savings opportunities, and optimize your budget.
          </p>
          <button
            onClick={() => router.push('/connect-bank')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <CreditCard className="w-5 h-5" />
            <span>Connect Bank Account</span>
          </button>
        </div>
      </div>
    )
  }

  // Show explanation and generate button if no insights
  if (insights.length === 0) {
    return (
      <div className="space-y-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                AI-Powered Financial Insights
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get personalized analysis of your spending patterns, budget recommendations, and savings opportunities powered by AI.
              </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Spending Analysis</h3>
                <p className="text-sm text-gray-600">
                  Identify patterns, trends, and unusual expenses in your transaction history.
                </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Savings Opportunities</h3>
              <p className="text-sm text-gray-600">
                Discover recurring expenses and find ways to save money on subscriptions and habits.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Budget Recommendations</h3>
              <p className="text-sm text-gray-600">
                Get realistic budget suggestions based on your actual spending patterns.
              </p>
            </div>
          </div>

          {/* Sample Insight Preview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Sample Insight Preview</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">High Dining Out Spending</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    You spent $432 on dining out in October (38% of discretionary spending). 
                    Cooking at home 3 times/week could save ~$180/month.
                  </p>
                  <div className="mt-2 text-xs text-blue-700 font-medium">
                    Potential Savings: $180/month
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <GenerateInsightsButton
              onGenerate={handleGenerateInsights}
              disabled={isGenerating}
              className="inline-block"
            />
            <p className="text-sm text-gray-500 mt-4">
              Based on {accounts.length} connected account{accounts.length > 1 ? 's' : ''} • 
              Analysis includes transactions from the last 90 days
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show insights list
  return (
    <div className="space-y-8">
      <InsightsList
        insights={insights}
        onRefresh={handleRefreshInsights}
        isLoading={isGenerating}
        lastUpdated={lastUpdated}
      />
      
      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-gray-500">
        <p>
          Based on {accounts.length} connected account{accounts.length > 1 ? 's' : ''} • 
          Analysis includes transactions from the last 90 days
        </p>
        <p className="mt-1">
          Insights are generated using AI and should be used as guidance, not financial advice.
        </p>
      </div>
    </div>
  )
}

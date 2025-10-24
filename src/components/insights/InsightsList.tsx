'use client'

import { useState } from 'react'
import { RefreshCw, Clock, TrendingUp, Wallet, DollarSign, AlertCircle, Info } from 'lucide-react'
import InsightCard from './InsightCard'

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

interface InsightsListProps {
  insights: Insight[]
  onRefresh: () => void
  isLoading: boolean
  lastUpdated?: string
}

export default function InsightsList({ insights, onRefresh, isLoading, lastUpdated }: InsightsListProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const categories = [
    { key: 'all', label: 'All Insights', icon: TrendingUp },
    { key: 'spending', label: 'Spending Analysis', icon: TrendingUp },
    { key: 'budget', label: 'Budget Recommendations', icon: Wallet },
    { key: 'savings', label: 'Savings Opportunities', icon: DollarSign },
    { key: 'cost reduction', label: 'Cost Reduction', icon: AlertCircle },
    { key: 'general', label: 'General', icon: Info }
  ]

  // Filter insights by active category
  const filteredInsights = activeCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === activeCategory)

  // Group insights by category for display
  const groupedInsights = insights.reduce((groups, insight) => {
    const category = insight.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(insight)
    return groups
  }, {} as Record<string, Insight[]>)

  const handleDeleteInsight = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id))
    
    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete insight')
      }
      
      // Refresh the insights list
      onRefresh()
    } catch (error) {
      console.error('Error deleting insight:', error)
      // You might want to show a toast notification here
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return null
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Updated just now'
    if (diffInHours < 24) return `Updated ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `Updated ${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  )

  // Empty state
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No insights yet
      </h3>
      <p className="text-gray-500 mb-6">
        Generate insights to get AI-powered analysis of your spending patterns.
      </p>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
      >
        {isLoading ? 'Generating...' : 'Generate Insights'}
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
        
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Generating...' : 'Refresh Insights'}</span>
        </button>
      </div>

      {/* Category Tabs */}
      {insights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon
            const count = category.key === 'all' 
              ? insights.length 
              : groupedInsights[category.key]?.length || 0
            
            if (count === 0 && category.key !== 'all') return null
            
            return (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeCategory === category.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : insights.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDelete={handleDeleteInsight}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {insights.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{insights.length}</div>
              <div className="text-sm text-gray-500">Total Insights</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {insights.filter(i => i.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-500">High Priority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${insights.reduce((sum, i) => sum + (i.potentialSavings || 0), 0).toFixed(0)}
              </div>
              <div className="text-sm text-gray-500">Potential Monthly Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(groupedInsights).length}
              </div>
              <div className="text-sm text-gray-500">Categories</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

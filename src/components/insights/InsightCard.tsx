'use client'

import { useState } from 'react'
import { Trash2, TrendingUp, Wallet, DollarSign, AlertCircle, Info } from 'lucide-react'

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

interface InsightCardProps {
  insight: Insight
  onDelete?: (id: string) => void
}

export default function InsightCard({ insight, onDelete }: InsightCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(insight.id)
    } catch (error) {
      console.error('Error deleting insight:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spending':
        return <TrendingUp className="w-5 h-5" />
      case 'budget':
        return <Wallet className="w-5 h-5" />
      case 'savings':
      case 'cost reduction':
        return <DollarSign className="w-5 h-5" />
      case 'income':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  // Get priority colors
  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          border: 'border-red-200',
          badge: 'bg-red-100 text-red-800',
          icon: 'text-red-600'
        }
      case 'medium':
        return {
          border: 'border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: 'text-yellow-600'
        }
      case 'low':
        return {
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-800',
          icon: 'text-green-600'
        }
      default:
        return {
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-800',
          icon: 'text-gray-600'
        }
    }
  }

  const colors = getPriorityColors(insight.priority)

  return (
    <div className={`bg-white rounded-lg border-2 ${colors.border} p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${colors.badge}`}>
            <div className={colors.icon}>
              {getCategoryIcon(insight.category)}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {insight.title}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                {insight.priority} priority
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {insight.category}
              </span>
            </div>
          </div>
        </div>
        
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50"
            title="Delete insight"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 leading-relaxed mb-4">
        {insight.description}
      </p>

      {/* Potential Savings */}
      {insight.potentialSavings && insight.potentialSavings > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Potential Savings
            </span>
          </div>
          <p className="text-lg font-bold text-green-700 mt-1">
            ${insight.potentialSavings.toFixed(0)}/month
          </p>
          <p className="text-xs text-green-600 mt-1">
            ${(insight.potentialSavings * 12).toFixed(0)}/year
          </p>
        </div>
      )}

      {/* Confidence Score */}
      {insight.confidence && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
          <span>
            {new Date(insight.createdAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  )
}

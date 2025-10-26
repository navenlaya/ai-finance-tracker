import React from 'react'
import { Transaction } from '@prisma/client'
import { calculateAverageDailySpending, getCurrentMonthTransactions, formatCurrency } from '@/lib/utils/transactions'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'

interface AverageDailySpendCardProps {
  transactions: Transaction[]
  className?: string
}

export function AverageDailySpendCard({ transactions, className = '' }: AverageDailySpendCardProps) {
  const averageDailySpending = calculateAverageDailySpending(transactions, 30)
  const currentMonthTransactions = getCurrentMonthTransactions(transactions)
  
  // Calculate actual daily average for current month
  const currentMonthDays = new Date().getDate()
  const currentMonthSpending = currentMonthTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
  const actualDailyAverage = currentMonthDays > 0 ? currentMonthSpending / currentMonthDays : 0
  
  // Projected monthly spending based on 30-day average
  const projectedMonthlySpending = averageDailySpending * 30
  
  const isOnTrack = actualDailyAverage <= averageDailySpending
  const TrendIcon = isOnTrack ? TrendingDown : TrendingUp
  const trendColor = isOnTrack ? 'text-green-600' : 'text-red-600'
  const trendBgColor = isOnTrack ? 'bg-green-50' : 'bg-red-50'
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Daily Average</h3>
        <Calendar className="w-6 h-6 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {/* Average Daily Spending */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Last 30 days average</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(averageDailySpending)}</p>
        </div>
        
        {/* Trend Indicator */}
        <div className={`${trendBgColor} rounded-lg p-3`}>
          <div className="flex items-center gap-2">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm font-medium ${trendColor}`}>
              {isOnTrack ? 'On track' : 'Above average'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Current month: {formatCurrency(actualDailyAverage)}/day
          </p>
        </div>
        
        {/* Projected Monthly */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Projected monthly</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(projectedMonthlySpending)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Based on 30-day average
          </p>
        </div>
        
        {/* Days Tracked */}
        <div className="text-sm text-gray-500">
          <p>Tracking {currentMonthDays} days this month</p>
        </div>
      </div>
    </div>
  )
}

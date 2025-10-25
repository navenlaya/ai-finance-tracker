import React from 'react'
import { Transaction } from '@prisma/client'
import { getCurrentMonthTransactions, getPreviousMonthTransactions, formatCurrency } from '@/lib/utils/transactions'
import { CreditCard, TrendingUp, TrendingDown } from 'lucide-react'

interface TotalSpendingCardProps {
  transactions: Transaction[]
  className?: string
}

export function TotalSpendingCard({ transactions, className = '' }: TotalSpendingCardProps) {
  const currentMonthTransactions = getCurrentMonthTransactions(transactions)
  const previousMonthTransactions = getPreviousMonthTransactions(transactions)
  
  const currentMonthSpending = currentMonthTransactions
    .filter(t => t.amount > 0) // Only expenses
    .reduce((sum, t) => sum + t.amount, 0)
  
  const previousMonthSpending = previousMonthTransactions
    .filter(t => t.amount > 0) // Only expenses
    .reduce((sum, t) => sum + t.amount, 0)
  
  const change = currentMonthSpending - previousMonthSpending
  const changePercentage = previousMonthSpending > 0 ? (change / previousMonthSpending) * 100 : 0
  
  const isIncrease = change > 0
  const ChangeIcon = isIncrease ? TrendingUp : TrendingDown
  const changeColor = isIncrease ? 'text-red-600' : 'text-green-600'
  const changeBgColor = isIncrease ? 'bg-red-50' : 'bg-green-50'
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Total Spending</h3>
        <CreditCard className="w-6 h-6 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {/* Current Month Spending */}
        <div>
          <p className="text-sm text-gray-600 mb-1">This Month</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(currentMonthSpending)}</p>
        </div>
        
        {/* Change from Previous Month */}
        <div className={`${changeBgColor} rounded-lg p-3`}>
          <div className="flex items-center gap-2">
            <ChangeIcon className={`w-4 h-4 ${changeColor}`} />
            <span className={`text-sm font-medium ${changeColor}`}>
              {isIncrease ? '+' : ''}{changePercentage.toFixed(1)}% vs last month
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isIncrease ? 'Increased' : 'Decreased'} by {formatCurrency(Math.abs(change))}
          </p>
        </div>
        
        {/* Previous Month for Reference */}
        <div className="text-sm text-gray-500">
          <p>Last month: {formatCurrency(previousMonthSpending)}</p>
        </div>
      </div>
    </div>
  )
}

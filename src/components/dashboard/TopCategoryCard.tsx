import React from 'react'
import { Transaction } from '@prisma/client'
import { getCurrentMonthTransactions, calculateCategoryTotals, getCategoryIcon, formatCurrency } from '@/lib/utils/transactions'

interface TopCategoryCardProps {
  transactions: Transaction[]
  className?: string
}

export function TopCategoryCard({ transactions, className = '' }: TopCategoryCardProps) {
  // Filter to only expense transactions (positive amounts in Plaid format)
  // Plaid format: positive amount = money out (expense), negative = money in (income)
  const expenseTransactions = transactions.filter(t => t.amount > 0)
  
  const currentMonthTransactions = getCurrentMonthTransactions(expenseTransactions)
  const categoryTotals = calculateCategoryTotals(currentMonthTransactions)
  
  if (Object.keys(categoryTotals).length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Category</h3>
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm">No spending data</p>
        </div>
      </div>
    )
  }
  
  // Find the top category
  const topCategory = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)[0]
  
  const [categoryName, amount] = topCategory
  const totalSpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
  const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0
  
  const CategoryIcon = getCategoryIcon(categoryName)
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Category</h3>
        <CategoryIcon className="w-6 h-6 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {/* Category Name */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Highest Spending</p>
          <p className="text-xl font-semibold text-gray-900">{categoryName}</p>
        </div>
        
        {/* Amount */}
        <div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</p>
        </div>
        
        {/* Percentage */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">% of total spending</span>
            <span className="text-lg font-bold text-blue-600">{percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
        
        {/* View Details Link */}
        <div className="pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View details →
          </button>
        </div>
      </div>
    </div>
  )
}

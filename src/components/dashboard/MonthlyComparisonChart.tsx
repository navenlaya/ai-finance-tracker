import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Transaction } from '@prisma/client'
import { getCurrentMonthTransactions, getPreviousMonthTransactions, calculateCategoryTotals, formatCurrency } from '@/lib/utils/transactions'
import { getMonthAbbreviation } from '@/lib/utils/dates'

interface MonthlyComparisonChartProps {
  transactions: Transaction[]
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const currentMonth = payload.find((p: any) => p.dataKey === 'currentMonth')
    const previousMonth = payload.find((p: any) => p.dataKey === 'previousMonth')
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            This Month: <span className="font-medium">{formatCurrency(currentMonth?.value || 0)}</span>
          </p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
            Last Month: <span className="font-medium">{formatCurrency(previousMonth?.value || 0)}</span>
          </p>
          {currentMonth?.value && previousMonth?.value && (
            <p className="text-sm">
              Change: <span className={`font-medium ${
                currentMonth.value > previousMonth.value ? 'text-red-600' : 'text-green-600'
              }`}>
                {currentMonth.value > previousMonth.value ? '+' : ''}
                {(((currentMonth.value - previousMonth.value) / previousMonth.value) * 100).toFixed(1)}%
              </span>
            </p>
          )}
        </div>
      </div>
    )
  }
  return null
}

export function MonthlyComparisonChart({ transactions, className = '' }: MonthlyComparisonChartProps) {
  const currentMonthTransactions = getCurrentMonthTransactions(transactions)
  const previousMonthTransactions = getPreviousMonthTransactions(transactions)
  
  const currentMonthTotals = calculateCategoryTotals(currentMonthTransactions)
  const previousMonthTotals = calculateCategoryTotals(previousMonthTransactions)
  
  // Get all unique categories
  const allCategories = new Set([
    ...Object.keys(currentMonthTotals),
    ...Object.keys(previousMonthTotals)
  ])
  
  // Create chart data for top 8 categories by current month spending
  const chartData = Array.from(allCategories)
    .map(category => ({
      category,
      currentMonth: currentMonthTotals[category] || 0,
      previousMonth: previousMonthTotals[category] || 0
    }))
    .sort((a, b) => b.currentMonth - a.currentMonth)
    .slice(0, 8)
  
  if (chartData.length === 0 || chartData.every(item => item.currentMonth === 0 && item.previousMonth === 0)) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No data to compare</p>
          <p className="text-sm text-center">Need at least 2 months of data to show comparison</p>
        </div>
      </div>
    )
  }

  const currentMonthName = getMonthAbbreviation(new Date().getMonth())
  const previousMonthName = getMonthAbbreviation(new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1)

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Comparison</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="category" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="currentMonth" 
              name={currentMonthName}
              fill="#3B82F6" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="previousMonth" 
              name={previousMonthName}
              fill="#9CA3AF" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">{currentMonthName}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <span className="text-sm text-gray-600">{previousMonthName}</span>
        </div>
      </div>
    </div>
  )
}

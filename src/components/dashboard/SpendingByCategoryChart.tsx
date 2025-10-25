import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Transaction } from '@prisma/client'
import { getCategoryData, formatCurrency, getCategoryIcon } from '@/lib/utils/transactions'

interface SpendingByCategoryChartProps {
  transactions: Transaction[]
  className?: string
}

const COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          Amount: <span className="font-medium">{formatCurrency(data.value)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Percentage: <span className="font-medium">{data.payload.percentage.toFixed(1)}%</span>
        </p>
      </div>
    )
  }
  return null
}

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => {
        const Icon = getCategoryIcon(entry.value)
        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">{entry.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export function SpendingByCategoryChart({ transactions, className = '' }: SpendingByCategoryChartProps) {
  const categoryData = getCategoryData(transactions, 8)
  
  if (categoryData.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No spending data yet</p>
          <p className="text-sm text-center">Connect your accounts to see spending breakdown by category</p>
        </div>
      </div>
    )
  }

  const chartData = categoryData.map((item, index) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend payload={chartData.map((item, index) => ({
        value: item.name,
        color: item.color,
        payload: item
      }))} />
    </div>
  )
}

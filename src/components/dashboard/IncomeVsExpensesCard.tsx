import React from 'react'
import { Transaction } from '@prisma/client'
import { calculateIncomeVsExpenses, formatCurrency } from '@/lib/utils/transactions'
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'

interface IncomeVsExpensesCardProps {
  transactions: Transaction[]
  className?: string
}

export function IncomeVsExpensesCard({ transactions, className = '' }: IncomeVsExpensesCardProps) {
  const { income, expenses, net, savingsRate } = calculateIncomeVsExpenses(transactions)
  
  const isPositive = net >= 0
  const NetIcon = isPositive ? TrendingUp : TrendingDown
  const netColor = isPositive ? 'text-green-600' : 'text-red-600'
  const netBgColor = isPositive ? 'bg-green-50' : 'bg-red-50'
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
        <DollarSign className="w-6 h-6 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {/* Income */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(income)}</p>
            </div>
          </div>
        </div>
        
        {/* Expenses */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</p>
            </div>
          </div>
        </div>
        
        {/* Net */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${netBgColor} rounded-full flex items-center justify-center`}>
                <NetIcon className={`w-5 h-5 ${netColor}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net</p>
                <p className={`text-2xl font-bold ${netColor}`}>{formatCurrency(net)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Savings Rate */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Savings Rate</span>
            </div>
            <span className={`text-sm font-bold ${savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                savingsRate >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(Math.abs(savingsRate), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

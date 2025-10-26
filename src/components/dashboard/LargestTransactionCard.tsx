import React from 'react'
import { Transaction } from '@prisma/client'
import { getLargestTransaction, formatCurrency } from '@/lib/utils/transactions'
import { getCategoryIcon } from '@/lib/utils/transactions'
import { formatTransactionDate } from '@/lib/utils/dates'
import { Receipt } from 'lucide-react'

interface LargestTransactionCardProps {
  transactions: Transaction[]
  className?: string
}

export function LargestTransactionCard({ transactions, className = '' }: LargestTransactionCardProps) {
  const largestTransaction = getLargestTransaction(transactions)
  
  if (!largestTransaction) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Largest Transaction</h3>
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-sm">No transactions</p>
        </div>
      </div>
    )
  }
  
  const CategoryIcon = getCategoryIcon(largestTransaction.category || 'Other')
  const isExpense = largestTransaction.amount > 0
  const amountColor = isExpense ? 'text-red-600' : 'text-green-600'
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Largest Transaction</h3>
        <Receipt className="w-6 h-6 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {/* Merchant Name */}
        <div>
          <p className="text-sm text-gray-600 mb-1">Merchant</p>
          <p className="text-lg font-semibold text-gray-900 truncate">
            {largestTransaction.merchantName || largestTransaction.name || 'Unknown'}
          </p>
        </div>
        
        {/* Amount */}
        <div>
          <p className="text-3xl font-bold">{formatCurrency(Math.abs(largestTransaction.amount))}</p>
          <p className={`text-sm font-medium ${amountColor}`}>
            {isExpense ? 'Expense' : 'Income'}
          </p>
        </div>
        
        {/* Category and Date */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CategoryIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {largestTransaction.category || 'Other'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {formatTransactionDate(largestTransaction.date)}
            </p>
          </div>
        </div>
        
        {/* View Similar Link */}
        <div className="pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View similar →
          </button>
        </div>
      </div>
    </div>
  )
}

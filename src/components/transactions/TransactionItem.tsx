import React from 'react'
import { Transaction } from '@prisma/client'
import { getCategoryIcon, formatCurrency } from '@/lib/utils/transactions'
import { formatTransactionDate } from '@/lib/utils/dates'

interface TransactionItemProps {
  transaction: Transaction
  onClick?: () => void
  className?: string
}

export function TransactionItem({ transaction, onClick, className = '' }: TransactionItemProps) {
  const CategoryIcon = getCategoryIcon(transaction.category || 'Other')
  const isExpense = transaction.amount > 0
  const amountColor = isExpense ? 'text-red-600' : 'text-green-600'
  const amountBgColor = isExpense ? 'bg-red-50' : 'bg-green-50'
  
  return (
    <div 
      className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${amountBgColor} rounded-full flex items-center justify-center`}>
          <CategoryIcon className={`w-5 h-5 ${amountColor}`} />
        </div>
        <div>
          <p className="font-medium text-gray-900 truncate max-w-48">
            {transaction.merchantName || transaction.name || 'Unknown'}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{transaction.category || 'Other'}</span>
            <span>•</span>
            <span>{formatTransactionDate(transaction.date)}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className={`font-semibold ${amountColor}`}>
          {isExpense ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
        </p>
        <p className="text-xs text-gray-500">
          {isExpense ? 'Expense' : 'Income'}
        </p>
      </div>
    </div>
  )
}

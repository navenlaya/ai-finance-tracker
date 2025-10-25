import React from 'react'
import { Transaction } from '@prisma/client'
import { TransactionItem } from './TransactionItem'
import { formatCurrency } from '@/lib/utils/transactions'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
  className?: string
}

export function TransactionList({ transactions, isLoading = false, className = '' }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm text-center">Connect your accounts to see transaction history</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate total for display
  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <div className="text-sm text-gray-600">
            Total: <span className="font-medium">{formatCurrency(Math.abs(totalAmount))}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {transactions.slice(0, 10).map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
        
        {transactions.length > 10 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all {transactions.length} transactions →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

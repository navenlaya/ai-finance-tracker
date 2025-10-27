'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Transaction } from '@prisma/client'
import { TransactionFilters, TransactionFilters as TransactionFiltersComponent } from '@/components/transactions/TransactionFilters'
import TransactionList from '@/components/transactions/TransactionList'
import { formatCurrency, calculateIncomeVsExpenses } from '@/lib/utils/transactions'
import { Download, Search } from 'lucide-react'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    category: [],
    dateRange: { start: null, end: null },
    amountRange: { min: null, max: null },
    type: 'all'
  })
  
  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/transactions')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch transactions')
        }
        const data = await response.json()
        console.log('Transactions API response:', data)
        setTransactions(data.transactions || [])
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTransactions()
  }, [])
  
  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const merchantName = (transaction.merchantName || '').toLowerCase()
        if (!merchantName.includes(searchTerm)) {
          return false
        }
      }
      
      // Category filter
      if (filters.category.length > 0) {
        const category = transaction.category || 'Other'
        if (!filters.category.includes(category)) {
          return false
        }
      }
      
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const transactionDate = new Date(transaction.date)
        if (filters.dateRange.start && transactionDate < filters.dateRange.start) {
          return false
        }
        if (filters.dateRange.end && transactionDate > filters.dateRange.end) {
          return false
        }
      }
      
      // Amount range filter
      if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
        const amount = Math.abs(transaction.amount)
        if (filters.amountRange.min !== null && amount < filters.amountRange.min) {
          return false
        }
        if (filters.amountRange.max !== null && amount > filters.amountRange.max) {
          return false
        }
      }
      
      // Type filter
      if (filters.type !== 'all') {
        if (filters.type === 'income' && transaction.amount >= 0) {
          return false
        }
        if (filters.type === 'expense' && transaction.amount <= 0) {
          return false
        }
      }
      
      return true
    })
  }, [transactions, filters])
  
  // Calculate stats for filtered transactions
  const stats = useMemo(() => {
    const { income, expenses, net } = calculateIncomeVsExpenses(filteredTransactions)
    return {
      totalTransactions: filteredTransactions.length,
      totalAmount: Math.abs(income + expenses),
      income,
      expenses,
      net
    }
  }, [filteredTransactions])
  
  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Amount', 'Type']
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        `"${t.merchantName || t.name || 'Unknown'}"`,
        `"${t.category || 'Other'}"`,
        Math.abs(t.amount),
        t.amount > 0 ? 'Expense' : 'Income'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Transactions</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-2">View and manage all your financial transactions</p>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <Search className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">$</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.income)}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">↑</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.expenses)}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">↓</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <TransactionFiltersComponent
          onFilterChange={setFilters}
          transactions={transactions}
          className="mb-8"
        />
        
        {/* Export Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        
        {/* Transaction List */}
        <TransactionList
          transactions={filteredTransactions}
          isLoading={isLoading}
        />
        
        {/* Pagination Info */}
        {filteredTransactions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        )}
    </div>
  )
}

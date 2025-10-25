import React, { useState } from 'react'
import { Transaction } from '@prisma/client'
import { getCategoryIcon } from '@/lib/utils/transactions'
import { formatDateForAPI } from '@/lib/utils/dates'
import { Search, Filter, X, Calendar, DollarSign } from 'lucide-react'

export interface TransactionFilters {
  search: string
  category: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  amountRange: {
    min: number | null
    max: number | null
  }
  type: 'all' | 'income' | 'expense'
}

interface TransactionFiltersProps {
  onFilterChange: (filters: TransactionFilters) => void
  transactions: Transaction[]
  className?: string
}

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Income',
  'Other'
]

export function TransactionFilters({ onFilterChange, transactions, className = '' }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    category: [],
    dateRange: { start: null, end: null },
    amountRange: { min: null, max: null },
    type: 'all'
  })
  
  const [isOpen, setIsOpen] = useState(false)
  
  const updateFilters = (newFilters: Partial<TransactionFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }
  
  const clearFilters = () => {
    const clearedFilters: TransactionFilters = {
      search: '',
      category: [],
      dateRange: { start: null, end: null },
      amountRange: { min: null, max: null },
      type: 'all'
    }
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }
  
  const activeFilterCount = [
    filters.search,
    filters.category.length,
    filters.dateRange.start,
    filters.dateRange.end,
    filters.amountRange.min,
    filters.amountRange.max,
    filters.type !== 'all'
  ].filter(Boolean).length
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Transactions</h3>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFilterCount} active
            </span>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by merchant name..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Collapsible Filters */}
      {isOpen && (
        <div className="space-y-4 border-t pt-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateFilters({ type: type.value as any })}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filters.type === type.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const Icon = getCategoryIcon(category)
                const isSelected = filters.category.includes(category)
                
                return (
                  <button
                    key={category}
                    onClick={() => {
                      const newCategories = isSelected
                        ? filters.category.filter(c => c !== category)
                        : [...filters.category, category]
                      updateFilters({ category: newCategories })
                    }}
                    className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={filters.dateRange.start ? formatDateForAPI(filters.dateRange.start) : ''}
                  onChange={(e) => updateFilters({
                    dateRange: { ...filters.dateRange, start: e.target.value ? new Date(e.target.value) : null }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={filters.dateRange.end ? formatDateForAPI(filters.dateRange.end) : ''}
                  onChange={(e) => updateFilters({
                    dateRange: { ...filters.dateRange, end: e.target.value ? new Date(e.target.value) : null }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.amountRange.min || ''}
                  onChange={(e) => updateFilters({
                    amountRange: { ...filters.amountRange, min: e.target.value ? Number(e.target.value) : null }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.amountRange.max || ''}
                  onChange={(e) => updateFilters({
                    amountRange: { ...filters.amountRange, max: e.target.value ? Number(e.target.value) : null }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="pt-4 border-t">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

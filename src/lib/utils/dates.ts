import { Transaction } from '@prisma/client'
import { format, subDays, subMonths, startOfMonth, endOfMonth, isSameMonth, isSameYear } from 'date-fns'

export type DateRange = '7d' | '30d' | '90d' | '1y'

export interface DateRangeData {
  startDate: Date
  endDate: Date
  label: string
}

/**
 * Get date range based on predefined range
 */
export function getDateRange(range: DateRange): DateRangeData {
  const now = new Date()
  let startDate: Date
  let label: string
  
  switch (range) {
    case '7d':
      startDate = subDays(now, 7)
      label = 'Last 7 days'
      break
    case '30d':
      startDate = subDays(now, 30)
      label = 'Last 30 days'
      break
    case '90d':
      startDate = subDays(now, 90)
      label = 'Last 90 days'
      break
    case '1y':
      startDate = subDays(now, 365)
      label = 'Last year'
      break
  }
  
  return {
    startDate,
    endDate: now,
    label
  }
}

/**
 * Format transaction date for display
 */
export function formatTransactionDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const isValidDate = !isNaN(dateObj.getTime())
  return isValidDate ? format(dateObj, 'MMM dd, yyyy') : 'Invalid Date'
}

/**
 * Format date for relative display (e.g., "3 days ago")
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const isValidDate = !isNaN(dateObj.getTime())
  
  if (!isValidDate) return 'Invalid Date'
  
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

/**
 * Group transactions by month
 */
export function groupTransactionsByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date)
    const key = format(date, 'yyyy-MM')
    
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(transaction)
    return acc
  }, {} as Record<string, Transaction[]>)
}

/**
 * Get current month transactions
 */
export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date()
  return transactions.filter(t => {
    const date = new Date(t.date)
    return isSameMonth(date, now) && isSameYear(date, now)
  })
}

/**
 * Get previous month transactions
 */
export function getPreviousMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date()
  const previousMonth = subMonths(now, 1)
  
  return transactions.filter(t => {
    const date = new Date(t.date)
    return isSameMonth(date, previousMonth) && isSameYear(date, previousMonth)
  })
}

/**
 * Get transactions for a specific month
 */
export function getTransactionsForMonth(transactions: Transaction[], year: number, month: number): Transaction[] {
  return transactions.filter(t => {
    const date = new Date(t.date)
    return date.getFullYear() === year && date.getMonth() === month
  })
}

/**
 * Get start and end of month
 */
export function getMonthBounds(date: Date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date)
  }
}

/**
 * Format month label (e.g., "October 2024")
 */
export function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month, 1)
  return format(date, 'MMMM yyyy')
}

/**
 * Get month name (e.g., "October")
 */
export function getMonthName(month: number): string {
  const date = new Date(2024, month, 1) // Use any year
  return format(date, 'MMMM')
}

/**
 * Get abbreviated month name (e.g., "Oct")
 */
export function getMonthAbbreviation(month: number): string {
  const date = new Date(2024, month, 1) // Use any year
  return format(date, 'MMM')
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return dateObj.toDateString() === today.toDateString()
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const yesterday = subDays(new Date(), 1)
  return dateObj.toDateString() === yesterday.toDateString()
}

/**
 * Get week start date (Sunday)
 */
export function getWeekStart(date: Date = new Date()): Date {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

/**
 * Get week end date (Saturday)
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const weekEnd = new Date(date)
  weekEnd.setDate(date.getDate() + (6 - date.getDay()))
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

/**
 * Format date for API queries (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Parse date from API response
 */
export function parseDateFromAPI(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Get date range for last N days
 */
export function getLastNDays(n: number): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = subDays(endDate, n)
  return { startDate, endDate }
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { startDate: Date; endDate: Date } {
  const now = new Date()
  const bounds = getMonthBounds(now)
  return { startDate: bounds.start, endDate: bounds.end }
}

/**
 * Get date range for previous month
 */
export function getPreviousMonthRange(): { startDate: Date; endDate: Date } {
  const previousMonth = subMonths(new Date(), 1)
  const bounds = getMonthBounds(previousMonth)
  return { startDate: bounds.start, endDate: bounds.end }
}

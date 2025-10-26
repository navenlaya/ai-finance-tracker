import { Transaction } from '@prisma/client'
import {
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Film,
  Receipt,
  Heart,
  Plane,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  CreditCard,
  Home,
  Gamepad2,
  BookOpen,
  Coffee,
  Zap,
  GraduationCap,
  Briefcase,
  Gift,
  DollarSign,
  PiggyBank,
  Shield,
  type LucideIcon
} from 'lucide-react'

export interface CategoryData {
  category: string
  amount: number
  transactions: Transaction[]
  percentage: number
}

export interface MonthlyComparison {
  currentMonth: number
  previousMonth: number
  change: number
  changePercentage: number
}

export interface IncomeVsExpenses {
  income: number
  expenses: number
  net: number
  savingsRate: number
}

export interface TopCategory {
  category: string
  amount: number
  percentage: number
  icon: LucideIcon
}

export interface DailySpending {
  date: string
  income: number
  expenses: number
  net: number
}

// Category icon mapping - based on Plaid's personal_finance_category primary codes
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Plaid primary categories (uppercase with underscores)
  'FOOD_AND_DRINK': UtensilsCrossed,
  'GENERAL_MERCHANDISE': ShoppingBag,
  'GENERAL_SERVICES': Receipt,
  'GOVERNMENT_AND_NON_PROFIT': Shield,
  'HOME_IMPROVEMENT': Home,
  'MEDICAL': Heart,
  'TRANSPORTATION': Car,
  'TRAVEL': Plane,
  'ENTERTAINMENT': Film,
  'INCOME': TrendingUp,
  'BANK_FEES': DollarSign,
  'LOAN_PAYMENTS': TrendingDown,
  'FINANCIAL': DollarSign,
  'GENERAL': MoreHorizontal,
  
  // Plaid legacy category array format
  'Food and Drink': UtensilsCrossed,
  'General Merchandise': ShoppingBag,
  'General Services': Receipt,
  'Government and Non-Profit': Shield,
  'Home Improvement': Home,
  'Medical': Heart,
  'Transportation': Car,
  'Travel': Plane,
  'Entertainment': Film,
  'Income': TrendingUp,
  'Bank Fees': DollarSign,
  'General': MoreHorizontal,
  
  // Common human-readable names (for compatibility)
  'Food': UtensilsCrossed,
  'Dining': UtensilsCrossed,
  'Restaurants': UtensilsCrossed,
  'Shopping': ShoppingBag,
  'Groceries': ShoppingBag,
  'Supermarket': ShoppingBag,
  'Bills': Receipt,
  'Utilities': Receipt,
  'Healthcare': Heart,
  'Games': Gamepad2,
  'Education': BookOpen,
  'Coffee': Coffee,
  'Housing': Home,
  'Rent': Home,
  'Mortgage': Home,
  'Business': Briefcase,
  'Gifts': Gift,
  'Financial': DollarSign,
  'Savings': PiggyBank,
  'Gas': Car,
  'Parking': Car,
}

/**
 * Group transactions by category
 */
export function groupTransactionsByCategory(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce((acc, transaction) => {
    const category = transaction.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(transaction)
    return acc
  }, {} as Record<string, Transaction[]>)
}

/**
 * Calculate total spending by category (expenses only)
 */
export function calculateCategoryTotals(transactions: Transaction[]): Record<string, number> {
  // Filter to only expenses (positive amounts in Plaid format)
  // Plaid format: positive amount = money out (expense), negative = money in (income)
  const expenseTransactions = transactions.filter(t => t.amount > 0)
  
  const grouped = groupTransactionsByCategory(expenseTransactions)
  return Object.entries(grouped).reduce((acc, [category, categoryTransactions]) => {
    acc[category] = categoryTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
    return acc
  }, {} as Record<string, number>)
}

/**
 * Get category data with percentages
 */
export function getCategoryData(transactions: Transaction[], limit: number = 8): CategoryData[] {
  const totals = calculateCategoryTotals(transactions)
  const totalSpending = Object.values(totals).reduce((sum, amount) => sum + amount, 0)
  
  if (totalSpending === 0) return []
  
  const sortedCategories = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit - 1) // Leave room for "Other"
  
  const otherAmount = Object.entries(totals)
    .slice(limit - 1)
    .reduce((sum, [, amount]) => sum + amount, 0)
  
  const result: CategoryData[] = sortedCategories.map(([category, amount]) => ({
    category,
    amount,
    transactions: transactions.filter(t => (t.category || 'Other') === category),
    percentage: (amount / totalSpending) * 100
  }))
  
  if (otherAmount > 0) {
    result.push({
      category: 'Other',
      amount: otherAmount,
      transactions: transactions.filter(t => {
        const category = t.category || 'Other'
        return !sortedCategories.some(([cat]) => cat === category)
      }),
      percentage: (otherAmount / totalSpending) * 100
    })
  }
  
  return result
}

/**
 * Group transactions by date
 */
export function groupTransactionsByDate(
  transactions: Transaction[], 
  groupBy: 'day' | 'week' | 'month' = 'day'
): Record<string, Transaction[]> {
  return transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date)
    let key: string
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
    }
    
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(transaction)
    return acc
  }, {} as Record<string, Transaction[]>)
}

/**
 * Calculate monthly comparison
 */
export function calculateMonthlyComparison(transactions: Transaction[]): MonthlyComparison {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  
  const previousMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === previousMonth && date.getFullYear() === previousYear
  })
  
  const currentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const previousMonthTotal = previousMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const change = currentMonthTotal - previousMonthTotal
  const changePercentage = previousMonthTotal > 0 ? (change / previousMonthTotal) * 100 : 0
  
  return {
    currentMonth: currentMonthTotal,
    previousMonth: previousMonthTotal,
    change,
    changePercentage
  }
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[], 
  startDate: Date, 
  endDate: Date
): Transaction[] {
  return transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date)
    return transactionDate >= startDate && transactionDate <= endDate
  })
}

/**
 * Calculate income vs expenses
 */
export function calculateIncomeVsExpenses(transactions: Transaction[]): IncomeVsExpenses {
  const income = transactions
    .filter(t => t.amount < 0) // Negative amounts are income
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const expenses = transactions
    .filter(t => t.amount > 0) // Positive amounts are expenses
    .reduce((sum, t) => sum + t.amount, 0)
  
  const net = income - expenses
  const savingsRate = income > 0 ? (net / income) * 100 : 0
  
  return { income, expenses, net, savingsRate }
}

/**
 * Get top categories by spending
 */
export function getTopCategories(transactions: Transaction[], limit: number = 5): TopCategory[] {
  const categoryData = getCategoryData(transactions, limit)
  
  return categoryData.map(data => ({
    category: data.category,
    amount: data.amount,
    percentage: data.percentage,
    icon: getCategoryIcon(data.category)
  }))
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Get category icon
 * Handles Plaid's category formats: personal_finance_category.primary (e.g., "FOOD_AND_DRINK")
 * and legacy category array format (e.g., "Food and Drink")
 */
export function getCategoryIcon(category: string): LucideIcon {
  if (!category) return MoreHorizontal
  
  // Try exact match first (for Plaid uppercase codes and any exact matches)
  if (CATEGORY_ICONS[category]) {
    return CATEGORY_ICONS[category]
  }
  
  // Try case-insensitive match
  const lowerCategory = category.toLowerCase()
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.toLowerCase() === lowerCategory) {
      return icon
    }
  }
  
  // Handle Plaid's personal_finance_category format (uppercase with underscores)
  // Try to match partial patterns from Plaid categories
  const upperCategory = category.toUpperCase()
  if (upperCategory.includes('FOOD') || upperCategory.includes('DRINK') || upperCategory.includes('RESTAURANT')) {
    return UtensilsCrossed
  }
  if (upperCategory.includes('TRANSPORT') || upperCategory.includes('GAS') || upperCategory.includes('AUTOMOTIVE')) {
    return Car
  }
  if (upperCategory.includes('ENTERTAINMENT') || upperCategory.includes('RECREATION')) {
    return Film
  }
  if (upperCategory.includes('HOME') || upperCategory.includes('HOUSING') || upperCategory.includes('RENT')) {
    return Home
  }
  if (upperCategory.includes('MEDICAL') || upperCategory.includes('HEALTH')) {
    return Heart
  }
  if (upperCategory.includes('TRAVEL') || upperCategory.includes('TICKET') || upperCategory.includes('HOTEL')) {
    return Plane
  }
  if (upperCategory.includes('MERCHANDISE') || upperCategory.includes('SHOPPING') || upperCategory.includes('GENERAL_MERCHANDISE')) {
    return ShoppingBag
  }
  if (upperCategory.includes('SERVICE') || upperCategory.includes('UTILITY') || upperCategory.includes('GENERAL_SERVICES')) {
    return Receipt
  }
  if (upperCategory.includes('LOAN') || upperCategory.includes('PAYMENT') || upperCategory.includes('REPAYMENT')) {
    return TrendingDown
  }
  if (upperCategory.includes('INCOME') || upperCategory.includes('SALARY') || upperCategory.includes('DEPOSIT')) {
    return TrendingUp
  }
  if (upperCategory.includes('FINANCIAL') || upperCategory.includes('FEE') || upperCategory.includes('BANK')) {
    return DollarSign
  }
  
  // Try partial match for common patterns (lowercase)
  if (lowerCategory.includes('food') || lowerCategory.includes('dining') || lowerCategory.includes('restaurant') || lowerCategory.includes('grocery') || lowerCategory.includes('cafe')) {
    return UtensilsCrossed
  }
  if (lowerCategory.includes('shopping') || lowerCategory.includes('store') || lowerCategory.includes('retail') || lowerCategory.includes('merchandise')) {
    return ShoppingBag
  }
  if (lowerCategory.includes('transport') || lowerCategory.includes('car') || lowerCategory.includes('gas') || lowerCategory.includes('parking') || lowerCategory.includes('automotive')) {
    return Car
  }
  if (lowerCategory.includes('entertainment') || lowerCategory.includes('movie') || lowerCategory.includes('game') || lowerCategory.includes('recreation')) {
    return Film
  }
  if (lowerCategory.includes('bill') || lowerCategory.includes('utility') || lowerCategory.includes('electric') || lowerCategory.includes('water') || lowerCategory.includes('internet')) {
    return Receipt
  }
  if (lowerCategory.includes('health') || lowerCategory.includes('medical') || lowerCategory.includes('doctor') || lowerCategory.includes('pharmacy')) {
    return Heart
  }
  if (lowerCategory.includes('travel') || lowerCategory.includes('hotel') || lowerCategory.includes('flight') || lowerCategory.includes('ticket')) {
    return Plane
  }
  if (lowerCategory.includes('loan') || lowerCategory.includes('payment') || lowerCategory.includes('repayment') || lowerCategory.includes('debt')) {
    return TrendingDown
  }
  if (lowerCategory.includes('income') || lowerCategory.includes('salary') || lowerCategory.includes('deposit')) {
    return TrendingUp
  }
  if (lowerCategory.includes('financial') || lowerCategory.includes('fee') || lowerCategory.includes('bank')) {
    return DollarSign
  }
  if (lowerCategory.includes('housing') || lowerCategory.includes('rent') || lowerCategory.includes('home') || lowerCategory.includes('mortgage')) {
    return Home
  }
  
  // Default to other icon
  return MoreHorizontal
}

/**
 * Calculate daily spending data for charts
 */
export function calculateDailySpending(transactions: Transaction[], days: number = 30): DailySpending[] {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)
  
  const filteredTransactions = filterTransactionsByDateRange(transactions, startDate, endDate)
  const groupedByDate = groupTransactionsByDate(filteredTransactions, 'day')
  
  const result: DailySpending[] = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dateKey = date.toISOString().split('T')[0]
    
    const dayTransactions = groupedByDate[dateKey] || []
    const income = dayTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const expenses = dayTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    result.push({
      date: dateKey,
      income,
      expenses,
      net: income - expenses
    })
  }
  
  return result
}

/**
 * Get largest transaction
 */
export function getLargestTransaction(transactions: Transaction[]): Transaction | null {
  if (transactions.length === 0) return null
  
  return transactions.reduce((largest, current) => {
    return Math.abs(current.amount) > Math.abs(largest.amount) ? current : largest
  })
}

/**
 * Calculate average daily spending
 */
export function calculateAverageDailySpending(transactions: Transaction[], days: number = 30): number {
  const dailyData = calculateDailySpending(transactions, days)
  const totalExpenses = dailyData.reduce((sum, day) => sum + day.expenses, 0)
  return totalExpenses / days
}

/**
 * Get current month transactions
 */
export function getCurrentMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
}

/**
 * Get previous month transactions
 */
export function getPreviousMonthTransactions(transactions: Transaction[]): Transaction[] {
  const now = new Date()
  const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  
  return transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === previousMonth && date.getFullYear() === previousYear
  })
}

/**
 * Group transactions by month
 */
export function groupTransactionsByMonth(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(transaction)
    return acc
  }, {} as Record<string, Transaction[]>)
}

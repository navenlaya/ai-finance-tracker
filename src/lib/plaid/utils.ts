import { 
  Building2, 
  CreditCard, 
  PiggyBank, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Gamepad2,
  Heart,
  BookOpen,
  Zap,
  Coffee,
  Plane,
  Shirt,
  Phone,
  Wrench
} from 'lucide-react'

/**
 * Formats a Plaid transaction to match our database schema
 * @param plaidTransaction - Transaction from Plaid API
 * @param accountId - The account ID this transaction belongs to
 * @returns Formatted transaction object
 */
export function formatPlaidTransaction(plaidTransaction: any, accountId: string) {
  return {
    accountId,
    amount: plaidTransaction.amount,
    date: new Date(plaidTransaction.date),
    name: plaidTransaction.name,
    category: plaidTransaction.category?.[0] || null,
    pending: plaidTransaction.pending,
    merchantName: plaidTransaction.merchant_name || null,
    location: plaidTransaction.location ? {
      address: plaidTransaction.location.address,
      city: plaidTransaction.location.city,
      region: plaidTransaction.location.region,
      country: plaidTransaction.location.country,
    } : null,
  }
}

/**
 * Returns an appropriate icon for a transaction category
 * @param category - Transaction category string
 * @returns Lucide React icon component
 */
export function getCategoryIcon(category: string | null) {
  if (!category) return ShoppingCart

  const categoryLower = category.toLowerCase()

  // Food and dining
  if (categoryLower.includes('food') || categoryLower.includes('restaurant') || categoryLower.includes('dining')) {
    return Utensils
  }
  
  // Transportation
  if (categoryLower.includes('transport') || categoryLower.includes('gas') || categoryLower.includes('fuel') || categoryLower.includes('car')) {
    return Car
  }
  
  // Housing
  if (categoryLower.includes('housing') || categoryLower.includes('rent') || categoryLower.includes('mortgage') || categoryLower.includes('home')) {
    return Home
  }
  
  // Entertainment
  if (categoryLower.includes('entertainment') || categoryLower.includes('games') || categoryLower.includes('movie')) {
    return Gamepad2
  }
  
  // Healthcare
  if (categoryLower.includes('health') || categoryLower.includes('medical') || categoryLower.includes('pharmacy')) {
    return Heart
  }
  
  // Education
  if (categoryLower.includes('education') || categoryLower.includes('school') || categoryLower.includes('book')) {
    return BookOpen
  }
  
  // Utilities
  if (categoryLower.includes('utility') || categoryLower.includes('electric') || categoryLower.includes('water') || categoryLower.includes('internet')) {
    return Zap
  }
  
  // Shopping
  if (categoryLower.includes('shopping') || categoryLower.includes('clothing') || categoryLower.includes('apparel')) {
    return Shirt
  }
  
  // Travel
  if (categoryLower.includes('travel') || categoryLower.includes('hotel') || categoryLower.includes('flight')) {
    return Plane
  }
  
  // Coffee shops
  if (categoryLower.includes('coffee') || categoryLower.includes('cafe')) {
    return Coffee
  }
  
  // Services
  if (categoryLower.includes('service') || categoryLower.includes('repair') || categoryLower.includes('maintenance')) {
    return Wrench
  }
  
  // Communication
  if (categoryLower.includes('phone') || categoryLower.includes('communication')) {
    return Phone
  }
  
  // Default to shopping cart
  return ShoppingCart
}

/**
 * Formats currency amounts nicely
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calculates the total balance across all accounts
 * @param accounts - Array of account objects with balance property
 * @returns Total balance
 */
export function calculateAccountTotal(accounts: Array<{ balance: number }>): number {
  return accounts.reduce((total, account) => total + (account.balance || 0), 0)
}

/**
 * Calculates monthly income from transactions
 * @param transactions - Array of transaction objects
 * @param currentMonth - Current month (0-11)
 * @param currentYear - Current year
 * @returns Total income for the month
 */
export function calculateMonthlyIncome(
  transactions: Array<{ amount: number; date: Date }>,
  currentMonth: number = new Date().getMonth(),
  currentYear: number = new Date().getFullYear()
): number {
  return Math.abs(
    transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date)
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear &&
          transaction.amount < 0 // Income is negative in Plaid
        )
      })
      .reduce((total, transaction) => total + transaction.amount, 0)
  )
}

/**
 * Calculates monthly expenses from transactions
 * @param transactions - Array of transaction objects
 * @param currentMonth - Current month (0-11)
 * @param currentYear - Current year
 * @returns Total expenses for the month
 */
export function calculateMonthlyExpenses(
  transactions: Array<{ amount: number; date: Date }>,
  currentMonth: number = new Date().getMonth(),
  currentYear: number = new Date().getFullYear()
): number {
  return transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear &&
        transaction.amount > 0 // Expenses are positive in Plaid
      )
    })
    .reduce((total, transaction) => total + transaction.amount, 0)
}

/**
 * Determines if a transaction is income or expense
 * @param amount - Transaction amount
 * @returns 'income' or 'expense'
 */
export function getTransactionType(amount: number): 'income' | 'expense' {
  return amount < 0 ? 'income' : 'expense'
}

/**
 * Formats transaction amount with proper sign and color
 * @param amount - Transaction amount
 * @param currency - Currency code (default: USD)
 * @returns Object with formatted amount, color, and sign
 */
export function formatTransactionAmount(amount: number, currency: string = 'USD') {
  const isIncome = amount < 0
  const absAmount = Math.abs(amount)
  const formattedAmount = formatCurrency(absAmount, currency)
  
  return {
    display: `${isIncome ? '+' : '-'}${formattedAmount}`,
    color: isIncome ? 'text-green-600' : 'text-red-600',
    type: isIncome ? 'income' : 'expense',
    icon: isIncome ? '↑' : '↓'
  }
}

/**
 * Gets spending trend direction
 * @param currentMonth - Current month spending
 * @param previousMonth - Previous month spending
 * @returns 'up', 'down', or 'stable'
 */
export function getSpendingTrend(currentMonth: number, previousMonth: number): 'up' | 'down' | 'stable' {
  const difference = currentMonth - previousMonth
  const threshold = previousMonth * 0.05 // 5% threshold

  if (difference > threshold) return 'up'
  if (difference < -threshold) return 'down'
  return 'stable'
}

/**
 * Formats transaction date for display
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatTransactionDate(date: Date | string): string {
  const transactionDate = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - transactionDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`
  } else {
    return transactionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: transactionDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }
}

/**
 * Categorizes spending by category
 * @param transactions - Array of transaction objects
 * @returns Object with category totals
 */
export function categorizeSpending(transactions: Array<{ amount: number; category: string | null }>) {
  const categories: Record<string, number> = {}

  transactions.forEach(transaction => {
    if (transaction.amount < 0) { // Only expenses
      const category = transaction.category || 'Uncategorized'
      categories[category] = (categories[category] || 0) + Math.abs(transaction.amount)
    }
  })

  return categories
}

/**
 * Gets the top spending category
 * @param transactions - Array of transaction objects
 * @returns Top category name and amount
 */
export function getTopSpendingCategory(transactions: Array<{ amount: number; category: string | null }>) {
  const categories = categorizeSpending(transactions)
  const topCategory = Object.entries(categories).reduce((max, [category, amount]) => 
    amount > max.amount ? { category, amount } : max, 
    { category: 'None', amount: 0 }
  )

  return topCategory
}

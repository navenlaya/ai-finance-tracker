import { Transaction } from '@prisma/client'

/**
 * Format expense transactions for AI analysis - only include necessary fields
 * Limits to last 30 days and max 50 transactions to stay within token limits
 * Only includes EXPENSES (positive amounts in Plaid format)
 */
export function formatTransactionsForAI(transactions: Transaction[]): string {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Filter to only expenses (positive amounts in Plaid format)
  // Plaid format: positive amount = money out (expense), negative = money in (income)
  const expenseTransactions = transactions
    .filter(t => t.amount > 0 && t.date >= thirtyDaysAgo)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 50) // Limit to 50 most recent transactions
    .map(t => ({
      amount: t.amount,
      category: t.category || 'uncategorized',
      date: t.date.toISOString().split('T')[0], // YYYY-MM-DD format
      name: t.name,
    }))
  
  return JSON.stringify(expenseTransactions, null, 2)
}

/**
 * Format income transactions for AI context (for budget recommendations)
 */
export function formatIncomeForAI(transactions: Transaction[]): { totalIncome: number; count: number } {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Filter to only income (negative amounts in Plaid format)
  const incomeTransactions = transactions
    .filter(t => t.amount < 0 && t.date >= thirtyDaysAgo)
    .map(t => Math.abs(t.amount))
  
  const totalIncome = incomeTransactions.reduce((sum, amount) => sum + amount, 0)
  
  return {
    totalIncome,
    count: incomeTransactions.length
  }
}

/**
 * Safely parse JSON response from AI
 * Handles cases where AI returns markdown code blocks
 */
export function parseAIResponse(response: string): any {
  try {
    // Remove markdown code blocks if present
    let cleanedResponse = response.trim()
    
    // Handle ```json ... ``` format
    if (cleanedResponse.startsWith('```json') && cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(7, -3).trim()
    }
    // Handle ``` ... ``` format
    else if (cleanedResponse.startsWith('```') && cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3, -3).trim()
    }
    
    // Try to parse the cleaned response
    const parsed = JSON.parse(cleanedResponse)
    return parsed
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    console.error('Raw response:', response)
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Calculate insight priority based on potential impact
 */
export function calculateInsightPriority(insight: any): 'high' | 'medium' | 'low' {
  const potentialSavings = insight.potentialSavings || 0
  
  // High priority: significant savings or critical issues
  if (potentialSavings > 100 || insight.priority === 'high') {
    return 'high'
  }
  
  // Medium priority: moderate savings or important patterns
  if (potentialSavings > 50 || insight.priority === 'medium') {
    return 'medium'
  }
  
  // Low priority: small savings or informational
  return 'low'
}

/**
 * Group insights by category for display
 */
export function groupInsightsByCategory(insights: any[]): {
  spending: any[]
  budget: any[]
  savings: any[]
  income: any[]
  general: any[]
  'cost reduction': any[]
} {
  return insights.reduce((groups, insight) => {
    const category = insight.category || 'general'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(insight)
    return groups
  }, {
    spending: [],
    budget: [],
    savings: [],
    income: [],
    general: [],
    'cost reduction': []
  })
}

/**
 * Validate insight data structure
 */
export function validateInsight(insight: any): boolean {
  return (
    insight &&
    typeof insight.title === 'string' &&
    typeof insight.description === 'string' &&
    typeof insight.category === 'string' &&
    typeof insight.priority === 'string' &&
    ['spending', 'budget', 'savings', 'income', 'general', 'cost reduction'].includes(insight.category) &&
    ['high', 'medium', 'low'].includes(insight.priority)
  )
}

/**
 * Sanitize insight content to prevent XSS
 */
export function sanitizeInsightContent(content: string): string {
  return content
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
}

/**
 * Calculate total spending by category (expenses only)
 */
export function calculateSpendingByCategory(transactions: Transaction[]): Record<string, number> {
  // Filter to only expenses (positive amounts in Plaid format)
  const expenseTransactions = transactions.filter(t => t.amount > 0)
  
  return expenseTransactions.reduce((totals, transaction) => {
    const category = transaction.category || 'uncategorized'
    totals[category] = (totals[category] || 0) + transaction.amount
    return totals
  }, {} as Record<string, number>)
}

/**
 * Calculate monthly averages for spending categories
 */
export function calculateMonthlyAverages(transactions: Transaction[]): Record<string, number> {
  const spendingByCategory = calculateSpendingByCategory(transactions)
  const months = Math.max(1, Math.ceil(transactions.length / 30)) // Rough estimate
  
  return Object.entries(spendingByCategory).reduce((averages, [category, total]) => {
    averages[category] = total / months
    return averages
  }, {} as Record<string, number>)
}

/**
 * Find recurring transactions (subscriptions, etc.)
 */
export function findRecurringTransactions(transactions: Transaction[]): Transaction[] {
  const recurring: Transaction[] = []
  const merchantCounts: Record<string, number> = {}
  
  // Count occurrences of each merchant
  transactions.forEach(transaction => {
    if (transaction.merchantName) {
      merchantCounts[transaction.merchantName] = (merchantCounts[transaction.merchantName] || 0) + 1
    }
  })
  
  // Find merchants that appear frequently (likely subscriptions)
  Object.entries(merchantCounts).forEach(([merchant, count]) => {
    if (count >= 2) { // Appears at least twice in the period
      const merchantTransactions = transactions.filter(t => t.merchantName === merchant)
      recurring.push(...merchantTransactions)
    }
  })
  
  return recurring
}

/**
 * Calculate potential savings from recurring expenses
 */
export function calculateRecurringSavings(transactions: Transaction[]): {
  monthlySavings: number
  yearlySavings: number
  opportunities: Array<{
    merchant: string
    monthlyAmount: number
    yearlyAmount: number
    frequency: number
  }>
} {
  const recurring = findRecurringTransactions(transactions)
  const opportunities: Array<{
    merchant: string
    monthlyAmount: number
    yearlyAmount: number
    frequency: number
  }> = []
  
  const merchantTotals: Record<string, { total: number; count: number }> = {}
  
  recurring.forEach(transaction => {
    if (transaction.merchantName) {
      if (!merchantTotals[transaction.merchantName]) {
        merchantTotals[transaction.merchantName] = { total: 0, count: 0 }
      }
      merchantTotals[transaction.merchantName].total += Math.abs(transaction.amount)
      merchantTotals[transaction.merchantName].count += 1
    }
  })
  
  Object.entries(merchantTotals).forEach(([merchant, data]) => {
    const monthlyAmount = data.total / Math.max(1, data.count / 3) // Rough monthly estimate
    const yearlyAmount = monthlyAmount * 12
    
    opportunities.push({
      merchant,
      monthlyAmount,
      yearlyAmount,
      frequency: data.count
    })
  })
  
  const monthlySavings = opportunities.reduce((sum, opp) => sum + opp.monthlyAmount, 0)
  const yearlySavings = monthlySavings * 12
  
  return {
    monthlySavings,
    yearlySavings,
    opportunities
  }
}

import { Transaction } from '@prisma/client'
import { makeGroqCall, retryGroqCall, AIInsight, AIBudgetRecommendation, AISavingsOpportunity } from './client'
import { formatTransactionsForAI, parseAIResponse, validateInsight, calculateSpendingByCategory, calculateMonthlyAverages, calculateRecurringSavings } from './utils'

/**
 * Generate spending analysis insights
 * Analyzes spending patterns, trends, and anomalies
 */
export async function generateSpendingAnalysis(transactions: Transaction[]): Promise<AIInsight[]> {
  if (transactions.length === 0) {
    return []
  }

  const transactionsData = formatTransactionsForAI(transactions)
  const spendingByCategory = calculateSpendingByCategory(transactions)
  const monthlyAverages = calculateMonthlyAverages(transactions)

  const prompt = `You are a financial advisor AI. Analyze these spending patterns and provide specific, actionable insights.

Transactions (JSON):
${transactionsData}

Spending by category: ${JSON.stringify(spendingByCategory, null, 2)}
Monthly averages: ${JSON.stringify(monthlyAverages, null, 2)}

Focus on:
- Spending patterns and trends
- Unusual or concerning expenses
- Categories with high spending
- Opportunities to optimize spending

Return ONLY valid JSON (no markdown, no code blocks, no explanations) in this EXACT format:
{
  "insights": [
    {
      "title": "Brief, specific insight title",
      "description": "Detailed explanation with actual dollar amounts and percentages. Be specific about timeframes and categories.",
      "category": "spending",
      "priority": "high",
      "potentialSavings": 150,
      "confidence": 0.85
    }
  ]
}

Requirements:
- Use actual numbers from the transaction data
- Be specific (mention categories, merchants, amounts)
- Each insight should be actionable
- Include potential savings in dollars where applicable
- Prioritize insights by financial impact
- Return 3-5 insights maximum`

  try {
    const response = await retryGroqCall(async () => {
      return await makeGroqCall([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 1000
      })
    })

    console.log('Raw AI response for spending analysis:', response)
    
    const parsed = parseAIResponse(response!)
    console.log('Parsed AI response:', parsed)

    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      throw new Error('Invalid response format from AI')
    }

    // Validate and filter insights
    const validInsights = parsed.insights.filter(validateInsight)
    
    return validInsights.map(insight => ({
      ...insight,
      category: insight.category as AIInsight['category'],
      priority: insight.priority as AIInsight['priority'],
      confidence: insight.confidence || 0.8
    }))
  } catch (error) {
    console.error('Error generating spending analysis:', error)
    throw new Error('Failed to generate spending analysis insights')
  }
}

/**
 * Generate budget recommendations based on spending patterns
 */
export async function generateBudgetRecommendations(
  transactions: Transaction[], 
  monthlyIncome?: number
): Promise<AIBudgetRecommendation[]> {
  if (transactions.length === 0) {
    return []
  }

  const transactionsData = formatTransactionsForAI(transactions)
  const spendingByCategory = calculateSpendingByCategory(transactions)
  const monthlyAverages = calculateMonthlyAverages(transactions)

  const prompt = `You are a financial advisor AI. Analyze spending patterns and suggest realistic monthly budgets.

Transactions (JSON):
${transactionsData}

Current spending by category: ${JSON.stringify(spendingByCategory, null, 2)}
Monthly averages: ${JSON.stringify(monthlyAverages, null, 2)}
${monthlyIncome ? `Monthly income: $${monthlyIncome}` : 'Monthly income: Not provided'}

Focus on:
- Realistic budget recommendations per category
- Areas where spending can be reduced
- Categories that are over/under budget
- Specific dollar amounts for budgets

Return ONLY valid JSON (no markdown, no code blocks, no explanations) in this EXACT format:
{
  "recommendations": [
    {
      "category": "Dining Out",
      "suggestedAmount": 200,
      "currentAverage": 350,
      "reasoning": "You're spending $350/month on dining out. Consider reducing to $200/month by cooking at home 2 more times per week.",
      "priority": "high"
    }
  ]
}

Requirements:
- Use actual spending data
- Suggest realistic reductions (10-30% typically)
- Include specific reasoning
- Prioritize by potential impact
- Return 3-5 recommendations maximum`

  try {
    const response = await retryGroqCall(async () => {
      return await makeGroqCall([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 1000
      })
    })

    console.log('Raw AI response for budget recommendations:', response)
    
    const parsed = parseAIResponse(response!)
    console.log('Parsed AI response:', parsed)

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid response format from AI')
    }

    return parsed.recommendations.map(rec => ({
      ...rec,
      priority: rec.priority as 'high' | 'medium' | 'low'
    }))
  } catch (error) {
    console.error('Error generating budget recommendations:', error)
    throw new Error('Failed to generate budget recommendations')
  }
}

/**
 * Generate savings opportunities from transaction analysis
 */
export async function generateSavingsOpportunities(transactions: Transaction[]): Promise<AISavingsOpportunity[]> {
  if (transactions.length === 0) {
    return []
  }

  const transactionsData = formatTransactionsForAI(transactions)
  const recurringSavings = calculateRecurringSavings(transactions)

  const prompt = `You are a financial advisor AI. Identify specific savings opportunities from spending patterns.

Transactions (JSON):
${transactionsData}

Recurring expenses analysis: ${JSON.stringify(recurringSavings, null, 2)}

Focus on:
- Recurring subscriptions and memberships
- Expensive daily habits (coffee, dining out, etc.)
- High-fee transactions
- Unnecessary or unused services
- Specific actions to save money

Return ONLY valid JSON (no markdown, no code blocks, no explanations) in this EXACT format:
{
  "opportunities": [
    {
      "title": "Cancel unused subscription",
      "description": "You're paying $21/month for Adobe Creative Suite but haven't used it in 60 days. Canceling would save $252/year.",
      "potentialMonthlySavings": 21,
      "potentialYearlySavings": 252,
      "difficulty": "easy",
      "category": "subscriptions"
    }
  ]
}

Requirements:
- Use actual transaction data
- Be specific about amounts and timeframes
- Include difficulty level (easy/medium/hard)
- Focus on actionable opportunities
- Return 3-5 opportunities maximum`

  try {
    const response = await retryGroqCall(async () => {
      return await makeGroqCall([
        { role: 'user', content: prompt }
      ], {
        temperature: 0.4,
        maxTokens: 1000
      })
    })

    console.log('Raw AI response for savings opportunities:', response)
    
    const parsed = parseAIResponse(response!)
    console.log('Parsed AI response:', parsed)

    if (!parsed.opportunities || !Array.isArray(parsed.opportunities)) {
      throw new Error('Invalid response format from AI')
    }

    return parsed.opportunities.map(opp => ({
      ...opp,
      difficulty: opp.difficulty as 'easy' | 'medium' | 'hard'
    }))
  } catch (error) {
    console.error('Error generating savings opportunities:', error)
    throw new Error('Failed to generate savings opportunities')
  }
}

/**
 * Generate comprehensive insights combining all analysis types
 */
export async function generateAllInsights(
  transactions: Transaction[], 
  monthlyIncome?: number
): Promise<{
  spendingInsights: AIInsight[]
  budgetRecommendations: AIBudgetRecommendation[]
  savingsOpportunities: AISavingsOpportunity[]
  allInsights: AIInsight[]
}> {
  if (transactions.length === 0) {
    return {
      spendingInsights: [],
      budgetRecommendations: [],
      savingsOpportunities: [],
      allInsights: []
    }
  }

  try {
    console.log(`Generating insights for ${transactions.length} transactions`)
    
    // Generate all types of insights in parallel for better performance
    const [spendingInsights, budgetRecommendations, savingsOpportunities] = await Promise.all([
      generateSpendingAnalysis(transactions),
      generateBudgetRecommendations(transactions, monthlyIncome),
      generateSavingsOpportunities(transactions)
    ])

    // Convert budget recommendations and savings opportunities to insights format
    const budgetInsights: AIInsight[] = budgetRecommendations.map(rec => ({
      title: `Budget: ${rec.category}`,
      description: rec.reasoning,
      category: 'budget' as const,
      priority: rec.priority,
      potentialSavings: rec.currentAverage - rec.suggestedAmount,
      confidence: 0.8
    }))

    const savingsInsights: AIInsight[] = savingsOpportunities.map(opp => ({
      title: opp.title,
      description: opp.description,
      category: 'savings' as const,
      priority: opp.potentialMonthlySavings > 50 ? 'high' : opp.potentialMonthlySavings > 20 ? 'medium' : 'low',
      potentialSavings: opp.potentialMonthlySavings,
      confidence: 0.85
    }))

    // Combine all insights
    const allInsights = [
      ...spendingInsights,
      ...budgetInsights,
      ...savingsInsights
    ]

    // Sort by priority (high -> medium -> low) and potential savings
    allInsights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return (b.potentialSavings || 0) - (a.potentialSavings || 0)
    })

    console.log(`Generated ${allInsights.length} total insights`)
    
    return {
      spendingInsights,
      budgetRecommendations,
      savingsOpportunities,
      allInsights
    }
  } catch (error) {
    console.error('Error generating all insights:', error)
    throw new Error('Failed to generate comprehensive insights')
  }
}

/**
 * Generate insights with caching logic
 * Checks if insights were generated recently and returns cached version if available
 */
export async function generateInsightsWithCaching(
  transactions: Transaction[],
  monthlyIncome?: number,
  existingInsights?: any[],
  lastGenerated?: Date
): Promise<{
  insights: AIInsight[]
  fromCache: boolean
  generatedAt: Date
}> {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Check if we should use cached insights
  if (existingInsights && existingInsights.length > 0 && lastGenerated && lastGenerated > twentyFourHoursAgo) {
    console.log('Using cached insights (generated within 24 hours)')
    return {
      insights: existingInsights,
      fromCache: true,
      generatedAt: lastGenerated
    }
  }

  // Check if user has significant new transactions (more than 10 new transactions)
  if (existingInsights && lastGenerated) {
    const newTransactions = transactions.filter(t => t.createdAt > lastGenerated)
    if (newTransactions.length < 10) {
      console.log('Using cached insights (less than 10 new transactions)')
      return {
        insights: existingInsights,
        fromCache: true,
        generatedAt: lastGenerated
      }
    }
  }

  // Generate new insights
  console.log('Generating new insights')
  const result = await generateAllInsights(transactions, monthlyIncome)
  
  return {
    insights: result.allInsights,
    fromCache: false,
    generatedAt: now
  }
}

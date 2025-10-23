import OpenAI from 'openai'
import { TransactionType } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SpendingAnalysis {
  totalSpent: number
  topCategories: Array<{ category: string; amount: number; percentage: number }>
  insights: string[]
  recommendations: string[]
}

export async function analyzeSpending(transactions: TransactionType[]): Promise<SpendingAnalysis> {
  try {
    const prompt = `
    Analyze the following financial transactions and provide insights:
    
    Transactions: ${JSON.stringify(transactions.slice(0, 50))}
    
    Please provide:
    1. Total amount spent
    2. Top spending categories with amounts and percentages
    3. Key insights about spending patterns
    4. Practical recommendations for better financial management
    
    Format the response as JSON with the following structure:
    {
      "totalSpent": number,
      "topCategories": [{"category": string, "amount": number, "percentage": number}],
      "insights": [string],
      "recommendations": [string]
    }
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a financial advisor AI that analyzes spending patterns and provides actionable insights. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(response) as SpendingAnalysis
  } catch (error) {
    console.error('Error analyzing spending with OpenAI:', error)
    throw new Error('Failed to analyze spending patterns')
  }
}

export async function generateInsight(transactions: TransactionType[], type: string): Promise<string> {
  try {
    const prompt = `
    Generate a ${type} insight based on these transactions:
    
    ${JSON.stringify(transactions.slice(0, 20))}
    
    Provide a concise, actionable insight (1-2 sentences).
    `

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a financial advisor AI that provides concise, actionable insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    })

    return completion.choices[0]?.message?.content || 'Unable to generate insight at this time.'
  } catch (error) {
    console.error('Error generating insight with OpenAI:', error)
    return 'Unable to generate insight at this time.'
  }
}

import Groq from 'groq-sdk'

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is required')
}

// Initialize Groq client with fast, free model
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Configuration for AI-powered financial insights using Groq
export const AI_CONFIG = {
  // Use llama-3.1-8b-instant for fast, free, high-quality analysis
  model: 'llama-3.1-8b-instant',
  
  // Temperature settings for different types of analysis
  temperature: {
    // Lower temperature for structured financial analysis (more consistent)
    financial: 0.3,
    // Slightly higher for creative insights and recommendations
    insights: 0.5,
  },
  
  // Max tokens to control response length
  maxTokens: {
    // For generating insights (should be concise but comprehensive)
    insights: 1000,
    // For detailed analysis
    analysis: 1500,
  },
  
  // Retry configuration
  retries: 3,
  retryDelay: 1000, // 1 second base delay
}

// Type definitions for AI responses
export interface AIInsight {
  title: string
  description: string
  category: 'spending' | 'budget' | 'savings' | 'income' | 'general' | 'cost reduction'
  priority: 'high' | 'medium' | 'low'
  potentialSavings?: number
  confidence: number
}

export interface AIBudgetRecommendation {
  category: string
  suggestedAmount: number
  currentAverage: number
  reasoning: string
  priority: 'high' | 'medium' | 'low'
}

export interface AISavingsOpportunity {
  title: string
  description: string
  potentialMonthlySavings: number
  potentialYearlySavings: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
}

export interface AICategoryAnalysis {
  category: string
  totalSpent: number
  averagePerTransaction: number
  trend: 'increasing' | 'decreasing' | 'stable'
  insights: string[]
  recommendations: string[]
}

// Utility function to make Groq API calls with error handling
export async function makeGroqCall(
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
  } = {}
) {
  const {
    model = AI_CONFIG.model,
    temperature = AI_CONFIG.temperature.financial,
    maxTokens = AI_CONFIG.maxTokens.insights
  } = options

  try {
    const response = await groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    })

    return response.choices[0]?.message?.content
  } catch (error) {
    console.error('Groq API call failed:', error)
    
    if (error instanceof Error) {
      // Handle specific Groq errors
      if (error.message.includes('rate_limit')) {
        throw new Error('AI service is temporarily busy. Please try again in a moment.')
      }
      if (error.message.includes('invalid_api_key')) {
        throw new Error('AI service configuration error. Please contact support.')
      }
      if (error.message.includes('quota')) {
        throw new Error('AI service quota exceeded. Please try again later.')
      }
      if (error.message.includes('model_decommissioned') || error.message.includes('decommissioned')) {
        throw new Error('AI model is no longer available. Please contact support to update the model.')
      }
    }
    
    throw new Error('Failed to generate AI insights. Please try again.')
  }
}

// Helper function to retry Groq calls with exponential backoff
export async function retryGroqCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = AI_CONFIG.retries
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff: wait 1s, 2s, 4s, etc.
      const delay = AI_CONFIG.retryDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

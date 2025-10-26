import { z } from 'zod'

/**
 * Validation schemas for API inputs
 */

// Date range validation
export const dateRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
}).refine((data) => {
  if (data.start && data.end) {
    return new Date(data.start) <= new Date(data.end)
  }
  return true
}, {
  message: "Start date must be before or equal to end date",
  path: ["start"]
})

// Transaction filters validation
export const transactionFiltersSchema = z.object({
  dateRange: dateRangeSchema.optional(),
  category: z.string().optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),
  search: z.string().max(100).optional(),
  type: z.enum(['income', 'expense', 'all']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

// Plaid exchange token validation
export const exchangeTokenSchema = z.object({
  publicToken: z.string().min(1, "Public token is required"),
})

// Plaid sync validation
export const syncTransactionsSchema = z.object({
  accountId: z.string().min(1, "Account ID is required").optional(),
})

// Plaid transactions validation
export const plaidTransactionsSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
})

// Insight generation validation
export const generateInsightsSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
})

// Insight deletion validation
export const deleteInsightSchema = z.object({
  id: z.string().min(1, "Insight ID is required"),
})

// Account validation
export const accountSchema = z.object({
  id: z.string().min(1, "Account ID is required"),
  name: z.string().min(1, "Account name is required").max(100),
  type: z.string().min(1, "Account type is required"),
  institution: z.string().min(1, "Institution is required"),
})

// Transaction validation
export const transactionSchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
  accountId: z.string().min(1, "Account ID is required"),
  amount: z.number().finite("Amount must be a valid number"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  name: z.string().min(1, "Transaction name is required").max(200),
  category: z.string().max(100).optional(),
  pending: z.boolean().default(false),
})

// User input validation for forms
export const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
})

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100),
  filters: z.object({
    category: z.string().optional(),
    dateRange: dateRangeSchema.optional(),
    amountRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
})

// CSV export validation
export const csvExportSchema = z.object({
  filters: transactionFiltersSchema.optional(),
  format: z.enum(['csv', 'json']).default('csv'),
})

// Dashboard metrics validation
export const dashboardMetricsSchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  includeCharts: z.boolean().default(true),
})

/**
 * Helper function to validate request body
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      
      throw new Error(`Validation failed: ${errorMessages.map(e => `${e.field}: ${e.message}`).join(', ')}`)
    }
    throw error
  }
}

/**
 * Helper function to validate query parameters
 */
export function validateQueryParams<T>(schema: z.ZodSchema<T>, params: Record<string, string | string[] | undefined>): T {
  // Convert query params to proper types
  const convertedParams: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      convertedParams[key] = undefined
    } else if (Array.isArray(value)) {
      convertedParams[key] = value[0] // Take first value if array
    } else {
      // Try to convert to number if it looks like a number
      if (!isNaN(Number(value)) && value !== '') {
        convertedParams[key] = Number(value)
      } else if (value === 'true') {
        convertedParams[key] = true
      } else if (value === 'false') {
        convertedParams[key] = false
      } else {
        convertedParams[key] = value
      }
    }
  }
  
  return validateRequestBody(schema, convertedParams)
}

/**
 * Common error response format
 */
export function createErrorResponse(message: string, code: string, status: number = 400) {
  return {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Common success response format
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

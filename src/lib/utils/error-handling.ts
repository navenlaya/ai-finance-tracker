import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standardized error handling for API routes
 */

export interface ApiError {
  error: string
  message: string
  code: string
  timestamp: string
  details?: any
}

export class ApiError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): NextResponse {
  const errorResponse = {
    error,
    message,
    code,
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? details : undefined
  }

  return NextResponse.json(errorResponse, { status: statusCode })
}

/**
 * Handle different types of errors
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues || []
    const validationErrors = issues.map((err: any) => ({
      field: (err.path || []).join('.'),
      message: err.message,
      code: err.code || 'VALIDATION_ERROR'
    }))

    return createErrorResponse(
      'Validation Error',
      'Invalid input data',
      400,
      'VALIDATION_ERROR',
      validationErrors
    )
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return createErrorResponse(
      error.message,
      error.message,
      error.statusCode,
      error.code,
      error.details
    )
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any
    
    switch (prismaError.code) {
      case 'P2002':
        return createErrorResponse(
          'Duplicate Entry',
          'A record with this information already exists',
          409,
          'DUPLICATE_ENTRY'
        )
      case 'P2025':
        return createErrorResponse(
          'Record Not Found',
          'The requested record could not be found',
          404,
          'RECORD_NOT_FOUND'
        )
      case 'P1001':
        return createErrorResponse(
          'Database Connection Error',
          'Unable to connect to the database',
          503,
          'DATABASE_CONNECTION_ERROR'
        )
      default:
        return createErrorResponse(
          'Database Error',
          'An error occurred while processing your request',
          500,
          'DATABASE_ERROR'
        )
    }
  }

  // Network/External API errors
  if (error && typeof error === 'object' && 'response' in error) {
    const networkError = error as any
    
    if (networkError.response?.status === 429) {
      return createErrorResponse(
        'Rate Limit Exceeded',
        'Too many requests. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    }
    
    if (networkError.response?.status === 401) {
      return createErrorResponse(
        'Authentication Error',
        'Invalid credentials or expired token',
        401,
        'AUTHENTICATION_ERROR'
      )
    }
    
    if (networkError.response?.status === 403) {
      return createErrorResponse(
        'Authorization Error',
        'You do not have permission to perform this action',
        403,
        'AUTHORIZATION_ERROR'
      )
    }
  }

  // Generic error
  return createErrorResponse(
    'Internal Server Error',
    'An unexpected error occurred. Please try again.',
    500,
    'INTERNAL_ERROR'
  )
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  const response = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      throw error // Re-throw to be handled by the API route
    }
  }
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  // Authentication errors
  UNAUTHORIZED: 'You must be logged in to access this resource',
  INVALID_TOKEN: 'Invalid or expired authentication token',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  
  // Validation errors
  INVALID_INPUT: 'The provided input is invalid',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
  INVALID_FORMAT: 'The provided data format is invalid',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'The requested resource was not found',
  RESOURCE_ALREADY_EXISTS: 'A resource with this information already exists',
  RESOURCE_CONFLICT: 'The resource conflicts with existing data',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'An external service is currently unavailable',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  SERVICE_TIMEOUT: 'The service is taking longer than expected',
  
  // Database errors
  DATABASE_ERROR: 'A database error occurred',
  CONNECTION_ERROR: 'Unable to connect to the database',
  
  // AI service errors
  AI_SERVICE_ERROR: 'AI service is currently unavailable',
  AI_QUOTA_EXCEEDED: 'AI service quota has been exceeded',
  AI_MODEL_ERROR: 'AI model is currently unavailable',
  
  // Plaid errors
  PLAID_ERROR: 'Bank connection service is currently unavailable',
  PLAID_ITEM_ERROR: 'Bank account connection failed',
  PLAID_INSTITUTION_ERROR: 'Bank institution is not supported',
  
  // General errors
  INTERNAL_ERROR: 'An internal error occurred',
  NETWORK_ERROR: 'Network connection failed',
  TIMEOUT_ERROR: 'Request timed out'
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // External services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_TIMEOUT: 'SERVICE_TIMEOUT',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // AI services
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_MODEL_ERROR: 'AI_MODEL_ERROR',
  
  // Plaid
  PLAID_ERROR: 'PLAID_ERROR',
  PLAID_ITEM_ERROR: 'PLAID_ITEM_ERROR',
  PLAID_INSTITUTION_ERROR: 'PLAID_INSTITUTION_ERROR',
  
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
}

/**
 * Error logging utility
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo)
  } else {
    // In production, you would send this to an error tracking service
    // Sentry.captureException(error, { extra: errorInfo })
    console.error('Error logged:', errorInfo)
  }
}

/**
 * Retry utility for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError
}

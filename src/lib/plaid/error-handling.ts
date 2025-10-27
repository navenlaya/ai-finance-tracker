/**
 * Comprehensive error handling utilities for Plaid operations
 */

export interface PlaidError {
  error_type: string
  error_code: string
  error_message: string
  display_message?: string
  request_id?: string
}

export interface ErrorContext {
  operation: string
  userId?: string
  accountId?: string
  itemId?: string
  timestamp: Date
}

/**
 * Plaid error codes and their user-friendly messages
 */
export const PLAID_ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'ITEM_LOGIN_REQUIRED': 'Your bank account requires reconnection. Please reconnect your account to continue.',
  'INVALID_CREDENTIALS': 'Invalid bank credentials. Please check your login information.',
  'INSUFFICIENT_CREDENTIALS': 'Additional authentication required. Please complete the verification process.',
  'ITEM_LOCKED': 'Your account is temporarily locked. Please try again later or contact your bank.',
  
  // Rate limiting
  'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
  
  // Network errors
  'PLATFORM_ERROR': 'A temporary error occurred. Please try again in a few minutes.',
  'API_ERROR': 'Unable to connect to your bank. Please try again later.',
  
  // Data errors
  'INVALID_REQUEST': 'Invalid request. Please refresh the page and try again.',
  'INVALID_INPUT': 'Invalid input provided. Please check your information and try again.',
  
  // Account errors
  'ACCOUNT_LOCKED': 'Your account is locked. Please contact your bank to unlock it.',
  'ACCOUNT_NOT_FOUND': 'Account not found. Please reconnect your bank account.',
  
  // Institution errors
  'INSTITUTION_DOWN': 'Your bank is temporarily unavailable. Please try again later.',
  'INSTITUTION_NOT_RESPONDING': 'Your bank is not responding. Please try again later.',
  
  // Default fallback
  'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again or contact support if the problem persists.',
}

/**
 * Maps Plaid error codes to user-friendly messages
 * @param errorCode - The Plaid error code
 * @returns User-friendly error message
 */
export function getPlaidErrorMessage(errorCode: string): string {
  return PLAID_ERROR_MESSAGES[errorCode] || PLAID_ERROR_MESSAGES['UNKNOWN_ERROR']
}

/**
 * Determines if an error requires user action (like reconnection)
 * @param errorCode - The Plaid error code
 * @returns True if user action is required
 */
export function requiresUserAction(errorCode: string): boolean {
  const actionRequiredErrors = [
    'ITEM_LOGIN_REQUIRED',
    'INVALID_CREDENTIALS',
    'INSUFFICIENT_CREDENTIALS',
    'ACCOUNT_LOCKED',
    'ACCOUNT_NOT_FOUND',
  ]
  
  return actionRequiredErrors.includes(errorCode)
}

/**
 * Determines if an error is temporary and can be retried
 * @param errorCode - The Plaid error code
 * @returns True if the error is temporary
 */
export function isTemporaryError(errorCode: string): boolean {
  const temporaryErrors = [
    'RATE_LIMIT_EXCEEDED',
    'PLATFORM_ERROR',
    'API_ERROR',
    'INSTITUTION_DOWN',
    'INSTITUTION_NOT_RESPONDING',
    'ITEM_LOCKED',
  ]
  
  return temporaryErrors.includes(errorCode)
}

/**
 * Extracts error information from Plaid API response
 * @param error - Error object from Plaid API
 * @returns Structured error information
 */
export function extractPlaidError(error: any): PlaidError {
  if (error.response?.data) {
    return {
      error_type: error.response.data.error_type || 'UNKNOWN_ERROR',
      error_code: error.response.data.error_code || 'UNKNOWN_ERROR',
      error_message: error.response.data.error_message || 'Unknown error occurred',
      display_message: error.response.data.display_message,
      request_id: error.response.data.request_id,
    }
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
    return {
      error_type: 'NETWORK_ERROR',
      error_code: 'NETWORK_ERROR',
      error_message: 'Network connection failed. Please check your internet connection.',
    }
  }
  
  // Handle timeout errors
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    return {
      error_type: 'TIMEOUT_ERROR',
      error_code: 'TIMEOUT_ERROR',
      error_message: 'Request timed out. Please try again.',
    }
  }
  
  // Default fallback
  return {
    error_type: 'UNKNOWN_ERROR',
    error_code: 'UNKNOWN_ERROR',
    error_message: error.message || 'An unknown error occurred',
  }
}

/**
 * Logs errors with context for debugging (without sensitive data)
 * @param error - The error object
 * @param context - Additional context about the operation
 */
export function logPlaidError(error: any, context: ErrorContext): void {
  const plaidError = extractPlaidError(error)
  
  // Log error details (excluding sensitive information)
  console.error('Plaid Error:', {
    operation: context.operation,
    error_type: plaidError.error_type,
    error_code: plaidError.error_code,
    error_message: plaidError.error_message,
    request_id: plaidError.request_id,
    timestamp: context.timestamp.toISOString(),
    userId: context.userId ? '***' : undefined, // Don't log actual user ID
    accountId: context.accountId ? '***' : undefined, // Don't log actual account ID
    itemId: context.itemId ? '***' : undefined, // Don't log actual item ID
  })
}

/**
 * Creates a standardized error response for API endpoints
 * @param error - The error object
 * @param context - Additional context about the operation
 * @returns Standardized error response
 */
export function createErrorResponse(error: any, context: ErrorContext) {
  const plaidError = extractPlaidError(error)
  const userMessage = getPlaidErrorMessage(plaidError.error_code)
  
  // Log the error for debugging
  logPlaidError(error, context)
  
  return {
    success: false,
    error: userMessage,
    error_code: plaidError.error_code,
    error_type: plaidError.error_type,
    requires_action: requiresUserAction(plaidError.error_code),
    is_temporary: isTemporaryError(plaidError.error_code),
    request_id: plaidError.request_id,
    timestamp: context.timestamp.toISOString(),
  }
}

/**
 * Retry configuration for different error types
 */
export const RETRY_CONFIG = {
  'RATE_LIMIT_EXCEEDED': { maxRetries: 3, delay: 1000 },
  'PLATFORM_ERROR': { maxRetries: 2, delay: 2000 },
  'API_ERROR': { maxRetries: 2, delay: 2000 },
  'INSTITUTION_DOWN': { maxRetries: 3, delay: 5000 },
  'INSTITUTION_NOT_RESPONDING': { maxRetries: 2, delay: 3000 },
  'ITEM_LOCKED': { maxRetries: 1, delay: 10000 },
}

/**
 * Determines retry configuration for an error
 * @param errorCode - The Plaid error code
 * @returns Retry configuration or null if no retry should be attempted
 */
export function getRetryConfig(errorCode: string): { maxRetries: number; delay: number } | null {
  return RETRY_CONFIG[errorCode as keyof typeof RETRY_CONFIG] || null
}

/**
 * Sleep utility for retry delays
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry wrapper for Plaid API calls
 * @param operation - The async operation to retry
 * @param context - Context for error logging
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Promise that resolves with the operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  maxRetries: number = 3
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const plaidError = extractPlaidError(error)
      
      // Don't retry if it's not a temporary error or if we've exceeded max retries
      if (!isTemporaryError(plaidError.error_code) || attempt === maxRetries) {
        throw error
      }
      
      // Get retry configuration
      const retryConfig = getRetryConfig(plaidError.error_code)
      if (!retryConfig) {
        throw error
      }
      
      // Wait before retrying
      await sleep(retryConfig.delay * (attempt + 1)) // Exponential backoff
    }
  }
  
  throw lastError
}

/**
 * Validates Plaid webhook events
 * @param webhookData - The webhook payload
 * @returns True if the webhook is valid
 */
export function validatePlaidWebhook(webhookData: any): boolean {
  // Basic validation - in production, you'd want to verify the webhook signature
  return (
    webhookData &&
    webhookData.webhook_type &&
    webhookData.webhook_code &&
    webhookData.item_id
  )
}

/**
 * Handles Plaid webhook events
 * @param webhookData - The webhook payload
 * @param context - Additional context
 */
export function handlePlaidWebhook(webhookData: any, context: ErrorContext): void {
  if (!validatePlaidWebhook(webhookData)) {
    console.error('Invalid Plaid webhook received:', webhookData)
    return
  }
  
  // Log webhook event
  console.log('Plaid Webhook:', {
    webhook_type: webhookData.webhook_type,
    webhook_code: webhookData.webhook_code,
    item_id: webhookData.item_id ? '***' : undefined,
    timestamp: context.timestamp.toISOString(),
  })
  
  // Handle different webhook types
  switch (webhookData.webhook_type) {
    case 'TRANSACTIONS':
      handleTransactionWebhook(webhookData, context)
      break
    case 'ITEM':
      handleItemWebhook(webhookData, context)
      break
    case 'ACCOUNTS':
      handleAccountWebhook(webhookData, context)
      break
    default:
      console.log('Unhandled webhook type:', webhookData.webhook_type)
  }
}

function handleTransactionWebhook(webhookData: any, context: ErrorContext): void {
  console.log('Transaction webhook:', webhookData.webhook_code)
  // Implement transaction webhook handling logic
}

function handleItemWebhook(webhookData: any, context: ErrorContext): void {
  console.log('Item webhook:', webhookData.webhook_code)
  // Implement item webhook handling logic
}

function handleAccountWebhook(webhookData: any, context: ErrorContext): void {
  console.log('Account webhook:', webhookData.webhook_code)
  // Implement account webhook handling logic
}

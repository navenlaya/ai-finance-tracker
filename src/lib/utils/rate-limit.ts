/**
 * Simple in-memory rate limiter for API routes
 * Tracks requests by userId + endpoint combination
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  requests: number
  windowMs: number
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/insights/generate': { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  '/api/plaid/sync': { requests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  '/api/plaid/exchange-token': { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  '/api/plaid/create-link-token': { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  '/api/plaid/accounts': { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  '/api/plaid/transactions': { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
  '/api/plaid/webhook': { requests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour (webhooks)
  '/api/insights/refresh': { requests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  '/api/insights': { requests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  '/api/transactions': { requests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
}

// In-memory store for rate limit data
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Check if a request should be rate limited
 * @param userId - User ID from Clerk auth
 * @param endpoint - API endpoint path
 * @returns Object with isAllowed boolean and resetTime
 */
export function checkRateLimit(userId: string, endpoint: string): {
  isAllowed: boolean
  remaining: number
  resetTime: number
  retryAfter: number
} {
  const config = RATE_LIMITS[endpoint]
  
  if (!config) {
    // No rate limit configured for this endpoint
    return {
      isAllowed: true,
      remaining: Infinity,
      resetTime: 0,
      retryAfter: 0
    }
  }

  const key = `${userId}:${endpoint}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupExpiredEntries()
  }

  if (!entry || now > entry.resetTime) {
    // First request or window has expired
    const resetTime = now + config.windowMs
    rateLimitStore.set(key, {
      count: 1,
      resetTime
    })
    
    return {
      isAllowed: true,
      remaining: config.requests - 1,
      resetTime,
      retryAfter: 0
    }
  }

  if (entry.count >= config.requests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    return {
      isAllowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    }
  }

  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    isAllowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
    retryAfter: 0
  }
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get rate limit info for an endpoint
 * @param endpoint - API endpoint path
 * @returns Rate limit configuration or null
 */
export function getRateLimitInfo(endpoint: string): RateLimitConfig | null {
  return RATE_LIMITS[endpoint] || null
}

/**
 * Format retry after time for user-friendly messages
 * @param retryAfter - Seconds to wait
 * @returns Human-readable time string
 */
export function formatRetryAfter(retryAfter: number): string {
  if (retryAfter < 60) {
    return `${retryAfter} seconds`
  } else if (retryAfter < 3600) {
    const minutes = Math.ceil(retryAfter / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    const hours = Math.ceil(retryAfter / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }
}

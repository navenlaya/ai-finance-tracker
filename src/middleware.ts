import { authMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { checkRateLimit, formatRetryAfter } from '@/lib/utils/rate-limit'

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: ['/', '/sign-in', '/sign-up'],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: ['/api/webhooks(.*)'],
  
  // Add rate limiting for API routes
  beforeAuth: (req) => {
    const { pathname } = req.nextUrl
    
    // Only apply rate limiting to API routes
    if (!pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    
    // Skip rate limiting for webhooks (they have their own auth)
    if (pathname.startsWith('/api/webhooks/')) {
      return NextResponse.next()
    }
    
    // Get user ID from Clerk auth header
    const authHeader = req.headers.get('authorization')
    const userId = authHeader ? 'authenticated' : 'anonymous'
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(userId, pathname)
    
    if (!rateLimitResult.isAllowed) {
      console.warn(`Rate limit exceeded for ${userId} on ${pathname}`)
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${formatRetryAfter(rateLimitResult.retryAfter)}.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }
    
    // Add rate limit headers to successful requests
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', '20')
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
    
    return response
  }
})

export const config = {
  // Protects all routes including api/trpc routes
  // Please edit this to allow other routes to be public as needed.
  // See https://clerk.com/docs/references/nextjs/auth-middleware
  // for more information about configuring your Middleware
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
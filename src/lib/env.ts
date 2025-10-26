/**
 * Environment variable validation
 * Ensures all required environment variables are present on startup
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string
  
  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
  
  // Plaid
  PLAID_CLIENT_ID: string
  PLAID_SECRET: string
  PLAID_ENV: string
  
  // AI Services
  GROQ_API_KEY: string
  
  // Encryption
  ENCRYPTION_KEY: string
  
  // Optional
  NEXT_PUBLIC_APP_URL?: string
  NODE_ENV?: string
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'PLAID_CLIENT_ID',
  'PLAID_SECRET',
  'PLAID_ENV',
  'GROQ_API_KEY',
  'ENCRYPTION_KEY'
]

const optionalEnvVars: (keyof EnvConfig)[] = [
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV'
]

/**
 * Validate environment variables
 * @throws Error if required variables are missing
 */
export function validateEnvironment(): EnvConfig {
  const missing: string[] = []
  const invalid: string[] = []
  
  // Check required variables
  for (const varName of requiredEnvVars) {
    const value = process.env[varName]
    
    if (!value) {
      missing.push(varName)
    } else {
      // Validate specific formats
      if (varName === 'DATABASE_URL' && !value.startsWith('postgresql://')) {
        invalid.push(`${varName} must be a valid PostgreSQL connection string`)
      }
      
      if (varName === 'PLAID_ENV' && !['sandbox', 'development', 'production'].includes(value)) {
        invalid.push(`${varName} must be one of: sandbox, development, production`)
      }
      
      if (varName === 'ENCRYPTION_KEY' && value.length < 32) {
        invalid.push(`${varName} must be at least 32 characters long`)
      }
    }
  }
  
  // Check optional variables
  for (const varName of optionalEnvVars) {
    const value = process.env[varName]
    
    if (value && varName === 'NEXT_PUBLIC_APP_URL' && !value.startsWith('http')) {
      invalid.push(`${varName} must be a valid URL starting with http`)
    }
  }
  
  // Throw errors if validation fails
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    )
  }
  
  if (invalid.length > 0) {
    throw new Error(
      `Invalid environment variables:\n${invalid.join('\n')}\n` +
      'Please check your .env file and fix the invalid values.'
    )
  }
  
  // Return validated config
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
    PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID!,
    PLAID_SECRET: process.env.PLAID_SECRET!,
    PLAID_ENV: process.env.PLAID_ENV!,
    GROQ_API_KEY: process.env.GROQ_API_KEY!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
}

/**
 * Get environment configuration with validation
 * @returns Validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  try {
    return validateEnvironment()
  } catch (error) {
    console.error('Environment validation failed:', error)
    
    // In production, we want to fail fast
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
    
    // In development, log warning but continue
    console.warn('⚠️  Environment validation failed, but continuing in development mode')
    
    // Return partial config for development
    return {
      DATABASE_URL: process.env.DATABASE_URL || '',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
      PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID || '',
      PLAID_SECRET: process.env.PLAID_SECRET || '',
      PLAID_ENV: process.env.PLAID_ENV || 'sandbox',
      GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'development-key-not-secure',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Get the app URL (with fallback)
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  if (isProduction()) {
    return 'https://your-app-domain.com' // Replace with actual domain
  }
  
  return 'http://localhost:3000'
}

/**
 * Get Plaid environment configuration
 */
export function getPlaidEnv(): 'sandbox' | 'development' | 'production' {
  const env = process.env.PLAID_ENV
  if (env === 'sandbox' || env === 'development' || env === 'production') {
    return env
  }
  
  console.warn(`Invalid PLAID_ENV: ${env}, defaulting to sandbox`)
  return 'sandbox'
}

/**
 * Validate environment on module load (for server-side)
 */
if (typeof window === 'undefined') {
  try {
    validateEnvironment()
    console.log('✅ Environment variables validated successfully')
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
  }
}

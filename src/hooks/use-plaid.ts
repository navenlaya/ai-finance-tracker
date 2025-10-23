'use client'

import { useState, useEffect } from 'react'

export function usePlaidLinkToken() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLinkToken = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to create link token')
      }
      
      const data = await response.json()
      setLinkToken(data.link_token)
      return data.link_token
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    linkToken,
    isLoading,
    error,
    createLinkToken,
  }
}

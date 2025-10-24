'use client'

import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

interface PlaidHookState {
  isLoading: boolean
  error: string | null
  success: boolean
  data: any
}

interface PlaidHookReturn extends PlaidHookState {
  // Account operations
  fetchAccounts: () => Promise<void>
  syncTransactions: () => Promise<void>
  
  // Transaction operations
  fetchTransactions: (accountId: string, startDate?: string, endDate?: string) => Promise<void>
  
  // Utility functions
  clearError: () => void
  clearSuccess: () => void
}

export function usePlaid(): PlaidHookReturn {
  const { user } = useUser()
  const [state, setState] = useState<PlaidHookState>({
    isLoading: false,
    error: null,
    success: false,
    data: null,
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, success: false }))
  }, [])

  const setSuccess = useCallback((success: boolean, data?: any) => {
    setState(prev => ({ ...prev, success, data, error: null }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const clearSuccess = useCallback(() => {
    setState(prev => ({ ...prev, success: false, data: null }))
  }, [])

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/plaid/accounts')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch accounts')
      }

      const data = await response.json()
      setSuccess(true, data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }, [user, setLoading, setError, setSuccess])

  const syncTransactions = useCallback(async () => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/plaid/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync transactions')
      }

      const data = await response.json()
      setSuccess(true, data)
    } catch (error) {
      console.error('Error syncing transactions:', error)
      setError(error instanceof Error ? error.message : 'Failed to sync transactions')
    } finally {
      setLoading(false)
    }
  }, [user, setLoading, setError, setSuccess])

  const fetchTransactions = useCallback(async (
    accountId: string, 
    startDate?: string, 
    endDate?: string
  ) => {
    if (!user) {
      setError('User not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/plaid/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          startDate,
          endDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch transactions')
      }

      const data = await response.json()
      setSuccess(true, data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [user, setLoading, setError, setSuccess])

  return {
    ...state,
    fetchAccounts,
    syncTransactions,
    fetchTransactions,
    clearError,
    clearSuccess,
  }
}
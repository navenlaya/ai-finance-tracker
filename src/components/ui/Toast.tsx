'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastState {
  toasts: Toast[]
}

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'CLEAR_ALL' }

const ToastContext = createContext<{
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
} | null>(null)

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast]
      }
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.id)
      }
    case 'CLEAR_ALL':
      return {
        ...state,
        toasts: []
      }
    default:
      return state
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] })

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000 // Default 5 seconds
    }
    
    dispatch({ type: 'ADD_TOAST', toast: newToast })
    
    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_TOAST', id })
      }, newToast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience hooks for different toast types
export function useToastActions() {
  const { addToast } = useToast()
  
  return {
    success: (title: string, description?: string, options?: Partial<Toast>) => {
      addToast({ type: 'success', title, description, ...options })
    },
    error: (title: string, description?: string, options?: Partial<Toast>) => {
      addToast({ type: 'error', title, description, duration: 0, ...options }) // Don't auto-dismiss errors
    },
    warning: (title: string, description?: string, options?: Partial<Toast>) => {
      addToast({ type: 'warning', title, description, ...options })
    },
    info: (title: string, description?: string, options?: Partial<Toast>) => {
      addToast({ type: 'info', title, description, ...options })
    }
  }
}

function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast()
  
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
    }
  }

  return (
    <Card className={`w-80 border-l-4 ${getBorderColor()} shadow-lg`}>
      <div className="flex items-start p-4">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${getTextColor()}`}>
            {toast.title}
          </h4>
          {toast.description && (
            <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
              {toast.description}
            </p>
          )}
          
          {toast.action && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toast.action.onClick}
                className="text-xs"
              >
                {toast.action.label}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 ml-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeToast(toast.id)}
            className="h-6 w-6 p-0 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Predefined toast messages for common actions
export const ToastMessages = {
  // Bank account actions
  bankAccountConnected: (institution: string) => ({
    type: 'success' as const,
    title: 'Bank Account Connected',
    description: `Successfully connected your ${institution} account.`
  }),
  
  bankAccountDisconnected: (institution: string) => ({
    type: 'info' as const,
    title: 'Bank Account Disconnected',
    description: `Your ${institution} account has been disconnected.`
  }),
  
  // Transaction actions
  transactionsSynced: (count: number) => ({
    type: 'success' as const,
    title: 'Transactions Synced',
    description: `Found ${count} new transactions.`
  }),
  
  transactionsExported: (format: string) => ({
    type: 'success' as const,
    title: 'Export Complete',
    description: `Transactions exported as ${format.toUpperCase()}.`
  }),
  
  // AI insights actions
  insightsGenerated: (count: number) => ({
    type: 'success' as const,
    title: 'AI Insights Generated',
    description: `Generated ${count} personalized insights.`
  }),
  
  insightsRefreshed: () => ({
    type: 'success' as const,
    title: 'Insights Refreshed',
    description: 'Your insights have been updated with the latest data.'
  }),
  
  insightDeleted: () => ({
    type: 'info' as const,
    title: 'Insight Deleted',
    description: 'The insight has been removed.'
  }),
  
  // Error messages
  connectionError: () => ({
    type: 'error' as const,
    title: 'Connection Error',
    description: 'Unable to connect to your bank. Please try again.'
  }),
  
  syncError: () => ({
    type: 'error' as const,
    title: 'Sync Failed',
    description: 'Unable to sync transactions. Please check your connection.'
  }),
  
  aiError: () => ({
    type: 'error' as const,
    title: 'AI Service Error',
    description: 'Unable to generate insights. Please try again later.'
  }),
  
  // General messages
  settingsSaved: () => ({
    type: 'success' as const,
    title: 'Settings Saved',
    description: 'Your preferences have been updated.'
  }),
  
  dataUpdated: () => ({
    type: 'success' as const,
    title: 'Data Updated',
    description: 'Your information has been refreshed.'
  }),
  
  // Rate limiting
  rateLimitExceeded: (retryAfter: string) => ({
    type: 'warning' as const,
    title: 'Too Many Requests',
    description: `Please wait ${retryAfter} before trying again.`
  })
}

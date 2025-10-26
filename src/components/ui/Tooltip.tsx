'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  delay = 200,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      updatePosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollTop - tooltipRect.height - 8
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + scrollTop + 8
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left + scrollLeft - tooltipRect.width - 8
        break
      case 'right':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + scrollLeft + 8
        break
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left < 8) left = 8
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8
    }
    if (top < 8) top = 8
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8
    }

    setTooltipPosition({ top, left })
  }

  useEffect(() => {
    if (isVisible) {
      updatePosition()
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)
    }

    return () => {
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none ${className}`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2' :
              'right-full top-1/2 -translate-y-1/2 translate-x-1/2'
            }`}
          />
        </div>
      )}
    </div>
  )
}

// Convenience component for info tooltips
export function InfoTooltip({ content, className }: { content: string; className?: string }) {
  return (
    <Tooltip content={content} className={className}>
      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
    </Tooltip>
  )
}

// Predefined tooltip content for common UI elements
export const TooltipContent = {
  savingsRate: "Your savings rate is the percentage of your income that you save each month. A higher rate means you're building wealth faster.",
  
  monthlySpending: "Your total spending for the current month, including all transactions from connected accounts.",
  
  topCategory: "The category where you spend the most money. This helps identify areas where you might want to reduce spending.",
  
  averageDailySpend: "Your average daily spending calculated from the last 30 days. This helps you understand your daily spending habits.",
  
  largestTransaction: "The single largest transaction in your account. Large transactions might indicate important purchases or unusual spending.",
  
  aiInsights: "AI-powered insights analyze your spending patterns to provide personalized recommendations for saving money and improving your financial health.",
  
  connectBank: "Connect your bank account securely using Plaid to automatically sync your transactions and get personalized insights.",
  
  syncTransactions: "Sync your latest transactions from your connected bank accounts. This ensures your data is up-to-date.",
  
  generateInsights: "Generate AI-powered insights based on your spending patterns. This may take a few moments to complete.",
  
  exportData: "Export your transaction data as a CSV file for use in other applications or for your own records.",
  
  filterTransactions: "Filter your transactions by date range, category, amount, or search terms to find specific transactions.",
  
  refreshData: "Refresh your data to get the latest information from your connected accounts.",
  
  deleteInsight: "Remove this insight from your dashboard. You can always generate new insights later.",
  
  categoryBreakdown: "See how your spending is distributed across different categories. This helps identify spending patterns.",
  
  spendingTrend: "Track your spending over time to see if you're spending more or less than previous periods.",
  
  monthlyComparison: "Compare your spending this month to last month to see changes in your spending habits.",
  
  incomeVsExpenses: "Compare your income to your expenses to see if you're spending more than you earn or saving money.",
  
  transactionDetails: "View detailed information about this transaction, including merchant, category, and date.",
  
  accountBalance: "Your current account balance as reported by your bank. This may not include pending transactions.",
  
  lastSync: "The last time your account data was synchronized with your bank. Click to sync again.",
  
  pendingTransaction: "This transaction is still pending and may not be reflected in your account balance yet.",
  
  recurringTransaction: "This appears to be a recurring transaction based on your spending patterns.",
  
  unusualSpending: "This transaction is unusual compared to your typical spending patterns and may warrant attention.",
  
  budgetAlert: "This spending exceeds your typical budget for this category and may impact your financial goals.",
  
  savingsOpportunity: "This category shows potential for reducing spending and increasing your savings rate."
}

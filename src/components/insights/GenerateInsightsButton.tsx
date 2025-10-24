'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface GenerateInsightsButtonProps {
  onGenerate: () => Promise<void>
  disabled?: boolean
  className?: string
}

export default function GenerateInsightsButton({ 
  onGenerate, 
  disabled = false,
  className = ''
}: GenerateInsightsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleGenerate = async () => {
    if (isGenerating || disabled) return

    setIsGenerating(true)
    setStatus('idle')
    setMessage('')

    try {
      await onGenerate()
      setStatus('success')
      setMessage('✓ Insights generated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error generating insights:', error)
      setStatus('error')
      setMessage('Failed to generate insights. Please try again.')
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    } finally {
      setIsGenerating(false)
    }
  }

  const getButtonContent = () => {
    if (isGenerating) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analyzing your transactions...</span>
        </>
      )
    }

    if (status === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Generated!</span>
        </>
      )
    }

    if (status === 'error') {
      return (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>Try Again</span>
        </>
      )
    }

    return (
      <>
        <Sparkles className="w-4 h-4" />
        <span>Generate AI Insights</span>
      </>
    )
  }

  const getButtonStyles = () => {
    const baseStyles = "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    
    if (status === 'success') {
      return `${baseStyles} bg-green-600 text-white hover:bg-green-700`
    }
    
    if (status === 'error') {
      return `${baseStyles} bg-red-600 text-white hover:bg-red-700`
    }
    
    if (isGenerating) {
      return `${baseStyles} bg-blue-600 text-white cursor-wait`
    }
    
    return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg`
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <button
        onClick={handleGenerate}
        disabled={disabled || isGenerating}
        className={getButtonStyles()}
      >
        {getButtonContent()}
      </button>
      
      {/* Status Message */}
      {message && (
        <div className={`text-sm font-medium text-center ${
          status === 'success' ? 'text-green-600' : 
          status === 'error' ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          {message}
        </div>
      )}
      
      {/* Estimated Time */}
      {!isGenerating && status === 'idle' && (
        <p className="text-xs text-gray-500 text-center">
          This takes about 10 seconds
        </p>
      )}
      
      {/* Progress Indicator */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            AI is analyzing your spending patterns...
          </p>
        </div>
      )}
    </div>
  )
}

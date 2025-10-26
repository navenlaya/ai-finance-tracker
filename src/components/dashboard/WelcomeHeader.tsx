'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'

interface WelcomeHeaderProps {
  subtitle?: string
  children?: React.ReactNode
}

export function WelcomeHeader({ subtitle, children }: WelcomeHeaderProps) {
  const { user } = useUser()
  
  const displayTitle = `Welcome back, ${user?.firstName || 'User'}!`
  const displaySubtitle = subtitle || 'Here\'s your financial overview'
  
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{displayTitle}</h1>
          <p className="text-lg text-gray-600">{displaySubtitle}</p>
        </div>
        {children && (
          <div className="flex flex-col sm:flex-row gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}


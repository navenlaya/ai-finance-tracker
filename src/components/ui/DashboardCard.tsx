'use client'

import React from 'react'

interface DashboardCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function DashboardCard({ children, className = '', hover = false }: DashboardCardProps) {
  return (
    <div 
      className={`
        bg-white 
        rounded-xl 
        border border-gray-200 
        shadow-sm
        transition-all 
        duration-300
        ${hover ? 'hover:shadow-md cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`p-6 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}

export function CardDescription({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  )
}

export function CardContent({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}


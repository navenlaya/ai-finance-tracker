'use client'

import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/transactions'

interface StatCardProps {
  title: string
  value: number
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  icon: LucideIcon
  iconColor?: string
}

export function StatCard({ title, value, trend, icon: Icon, iconColor = 'text-blue-500' }: StatCardProps) {
  const formattedValue = formatCurrency(value)
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{formattedValue}</p>
          
          {trend && (
            <div className="flex items-center mt-3">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-sm text-gray-500 ml-1">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-lg bg-gray-50 ${iconColor} opacity-60`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}


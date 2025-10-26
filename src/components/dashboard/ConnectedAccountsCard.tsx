'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/transactions'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  institution: string
  account_mask?: string
  account_type?: string
}

interface ConnectedAccountsCardProps {
  accounts: Account[]
  onAddAccount?: () => void
}

function AccountRow({ account }: { account: Account }) {
  const accountMask = account.account_mask 
    ? `****${account.account_mask}` 
    : account.name 
    ? `****${account.name.slice(-4)}` 
    : '****1234'
  
  const displayName = account.name || account.institution || 'Unknown Bank'
  const accountType = account.account_type || account.type || 'Account'
  const formattedBalance = formatCurrency(account.balance)

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
      {/* Left: Icon */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Middle: Bank name and type */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-medium text-gray-900">{displayName}</span>
          <span className="text-sm text-gray-500">{accountMask}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-600 capitalize">{accountType}</span>
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3 h-3" />
            Connected
          </span>
        </div>
      </div>

      {/* Right: Balance */}
      <div className="flex-shrink-0 text-right">
        <p className="text-lg font-semibold text-gray-900">{formattedBalance}</p>
      </div>
    </div>
  )
}

export function ConnectedAccountsCard({ accounts, onAddAccount }: ConnectedAccountsCardProps) {
  const router = useRouter()

  const handleAddAccount = () => {
    if (onAddAccount) {
      onAddAccount()
    } else {
      router.push('/connect-bank')
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Connected Accounts</h3>
          <Button onClick={handleAddAccount} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
        
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h4>
          <p className="text-sm text-gray-600 mb-6 max-w-sm">
            Connect your bank account to start tracking your finances
          </p>
          <Button onClick={handleAddAccount}>
            <Plus className="w-4 h-4 mr-2" />
            Connect Bank Account
          </Button>
        </div>
      </div>
    )
  }

  // Show only first 3 accounts
  const displayedAccounts = accounts.slice(0, 3)
  const hasMoreAccounts = accounts.length > 3

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connected Accounts</h3>
        <div className="flex items-center gap-2">
          {hasMoreAccounts && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/connect-bank')}
            >
              View All
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          )}
          <Button onClick={handleAddAccount} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {displayedAccounts.map((account) => (
          <AccountRow key={account.id} account={account} />
        ))}
      </div>
    </div>
  )
}


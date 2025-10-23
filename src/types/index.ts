import { User, Account, Transaction, Insight } from '@prisma/client'

export type UserType = User
export type AccountType = Account
export type TransactionType = Transaction
export type InsightType = Insight

export interface PlaidAccount {
  account_id: string
  name: string
  type: string
  subtype: string
  mask: string
}

export interface PlaidTransaction {
  transaction_id: string
  account_id: string
  amount: number
  date: string
  name: string
  category?: string[]
  pending: boolean
}

export interface PlaidLinkTokenResponse {
  link_token: string
  expiration: string
}

export interface PlaidExchangeTokenResponse {
  access_token: string
  item_id: string
  request_id: string
}

export interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  transactionCount: number
}

export interface InsightResponse {
  id: string
  content: string
  type: string
  createdAt: Date
}

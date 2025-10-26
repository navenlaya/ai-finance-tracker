import { 
  Banknote, 
  Receipt, 
  Sparkles, 
  Search, 
  TrendingUp, 
  CreditCard,
  BarChart3,
  PieChart,
  Calendar,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  secondaryAction,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed border-gray-300 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        
        <CardTitle className="mb-2 text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
        
        <CardDescription className="mb-6 max-w-sm text-gray-600">
          {description}
        </CardDescription>
        
        <div className="flex flex-col gap-2 sm:flex-row">
          {action && (
            <Button onClick={action.onClick} className="w-full sm:w-auto">
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick} 
              variant="outline" 
              className="w-full sm:w-auto"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Predefined empty states for common scenarios
export function NoAccountsEmptyState({ onConnectBank }: { onConnectBank: () => void }) {
  return (
    <EmptyState
      icon={Banknote}
      title="Connect Your First Bank Account"
      description="Link your bank account to start tracking spending and get AI-powered insights about your financial habits."
      action={{
        label: "Connect Bank Account",
        onClick: onConnectBank
      }}
    />
  )
}

export function NoTransactionsEmptyState({ onSyncTransactions }: { onSyncTransactions?: () => void }) {
  return (
    <EmptyState
      icon={Receipt}
      title="No Transactions Yet"
      description="Transactions will appear here after connecting your bank account and syncing your data."
      action={onSyncTransactions ? {
        label: "Sync Transactions",
        onClick: onSyncTransactions
      } : undefined}
    />
  )
}

export function NoInsightsEmptyState({ onGenerateInsights }: { onGenerateInsights: () => void }) {
  return (
    <EmptyState
      icon={Sparkles}
      title="Generate Your First Insights"
      description="Our AI will analyze your spending patterns and provide personalized recommendations to help you save money."
      action={{
        label: "Generate Insights",
        onClick: onGenerateInsights
      }}
    />
  )
}

export function NoSearchResultsEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No Transactions Found"
      description="No transactions match your current search criteria. Try adjusting your filters or search terms."
      action={{
        label: "Clear Filters",
        onClick: onClearFilters
      }}
    />
  )
}

export function NoChartsEmptyState() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No Data for Charts"
      description="Charts will appear here once you have transaction data. Connect your bank account to get started."
    />
  )
}

export function NoCategoriesEmptyState() {
  return (
    <EmptyState
      icon={PieChart}
      title="No Category Data"
      description="Category breakdown will appear here once transactions are properly categorized."
    />
  )
}

export function NoRecentActivityEmptyState() {
  return (
    <EmptyState
      icon={Calendar}
      title="No Recent Activity"
      description="Recent transactions and activity will appear here once you start using the app."
    />
  )
}

export function NoFiltersEmptyState({ onAddFilters }: { onAddFilters: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="No Filters Applied"
      description="Use filters to narrow down your transaction view by date, category, amount, or search terms."
      action={{
        label: "Add Filters",
        onClick: onAddFilters
      }}
    />
  )
}

export function NoSpendingDataEmptyState() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No Spending Data"
      description="Spending analysis will appear here once you have transaction data to analyze."
    />
  )
}

export function NoBudgetDataEmptyState() {
  return (
    <EmptyState
      icon={CreditCard}
      title="No Budget Data"
      description="Budget recommendations will appear here once we analyze your spending patterns."
    />
  )
}

// Loading empty state (shows while data is being fetched)
export function LoadingEmptyState() {
  return (
    <Card className="border-dashed border-gray-300">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
        
        <CardTitle className="mb-2 text-lg font-semibold text-gray-900">
          Loading...
        </CardTitle>
        
        <CardDescription className="text-gray-600">
          Please wait while we fetch your data.
        </CardDescription>
      </CardContent>
    </Card>
  )
}

// Error empty state
export function ErrorEmptyState({ 
  title = "Something went wrong", 
  description = "We encountered an error while loading your data. Please try again.",
  onRetry 
}: { 
  title?: string
  description?: string
  onRetry?: () => void 
}) {
  return (
    <EmptyState
      icon={Receipt}
      title={title}
      description={description}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry
      } : undefined}
    />
  )
}

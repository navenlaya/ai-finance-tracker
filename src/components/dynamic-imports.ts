import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'

// Dynamic imports for heavy components with loading states
export const SpendingByCategoryChart = dynamic(
  () => import('@/components/dashboard/SpendingByCategoryChart'),
  {
    loading: () => <Skeleton className="h-80 w-full" />,
    ssr: false
  }
)

export const SpendingTrendChart = dynamic(
  () => import('@/components/dashboard/SpendingTrendChart'),
  {
    loading: () => <Skeleton className="h-80 w-full" />,
    ssr: false
  }
)

export const MonthlyComparisonChart = dynamic(
  () => import('@/components/dashboard/MonthlyComparisonChart'),
  {
    loading: () => <Skeleton className="h-80 w-full" />,
    ssr: false
  }
)

export const TransactionList = dynamic(
  () => import('@/components/transactions/TransactionList'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false
  }
)

export const TransactionFilters = dynamic(
  () => import('@/components/transactions/TransactionFilters'),
  {
    loading: () => <Skeleton className="h-20 w-full" />,
    ssr: false
  }
)

export const InsightsList = dynamic(
  () => import('@/components/insights/InsightsList'),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false
  }
)

export const GenerateInsightsButton = dynamic(
  () => import('@/components/insights/GenerateInsightsButton'),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
    ssr: false
  }
)

// Plaid components (these are heavy and should be loaded dynamically)
export const PlaidLink = dynamic(
  () => import('@/components/plaid/PlaidLink'),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
)

export const LinkButton = dynamic(
  () => import('@/components/plaid/link-button'),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
    ssr: false
  }
)

// Dashboard cards (load these dynamically to improve initial page load)
export const DashboardCards = dynamic(
  () => import('@/components/dashboard/DashboardCards'),
  {
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    ),
    ssr: false
  }
)

// Chart container component
export const ChartContainer = dynamic(
  () => import('@/components/dashboard/ChartContainer'),
  {
    loading: () => <Skeleton className="h-80 w-full" />,
    ssr: false
  }
)

// Export all components for easy importing
export {
  SpendingByCategoryChart,
  SpendingTrendChart,
  MonthlyComparisonChart,
  TransactionList,
  TransactionFilters,
  InsightsList,
  GenerateInsightsButton,
  PlaidLink,
  LinkButton,
  DashboardCards,
  ChartContainer
}

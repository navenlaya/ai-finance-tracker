'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from './button'
import { ArrowLeft, LayoutDashboard, Sparkles, Receipt, CreditCard } from 'lucide-react'

export function Navigation() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  
  // Show back button on insights and transactions pages
  const showBackButton = ['/insights', '/transactions'].includes(pathname)
  const isDashboardPage = pathname === '/dashboard'

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {/* Back button for insights/transactions pages */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary"></div>
            <span className="text-xl font-bold hidden sm:inline">AI Finance Tracker</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="hidden md:inline">
                <Button variant={isDashboardPage ? "default" : "ghost"}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/insights" className="hidden md:inline">
                <Button variant={pathname === '/insights' ? "default" : "ghost"}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Insights
                </Button>
              </Link>
              <Link href="/transactions" className="hidden md:inline">
                <Button variant={pathname === '/transactions' ? "default" : "ghost"}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Transactions
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome, {user?.firstName}
                </span>
                <Button variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

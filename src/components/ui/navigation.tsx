'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { Button } from './button'
import { ProfileDropdown } from '@/components/layout/ProfileDropdown'

export function Navigation() {
  const { isSignedIn, user } = useUser()
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="AI Finance Tracker" className="h-8 w-8" />
            <span className="text-xl font-bold hidden sm:inline">AI Finance Tracker</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="hidden md:inline">
                <Button variant={pathname?.includes('/dashboard') ? "default" : "ghost"}>
                  Dashboard
                </Button>
              </Link>
              <Link href="/insights" className="hidden md:inline">
                <Button variant={pathname?.includes('/insights') ? "default" : "ghost"}>
                  Insights
                </Button>
              </Link>
              <Link href="/transactions" className="hidden md:inline">
                <Button variant={pathname?.includes('/transactions') ? "default" : "ghost"}>
                  Transactions
                </Button>
              </Link>
              <ProfileDropdown 
                userName={user?.firstName || 'User'}
                userEmail={user?.primaryEmailAddress?.emailAddress}
              />
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

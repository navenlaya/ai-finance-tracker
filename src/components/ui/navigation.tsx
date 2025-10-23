'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Button } from './button'

export function Navigation() {
  const { isSignedIn, user } = useUser()

  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary"></div>
          <span className="text-xl font-bold">AI Finance Tracker</span>
        </Link>

        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
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

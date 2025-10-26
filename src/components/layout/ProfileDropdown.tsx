'use client'

import { useState, useRef, useEffect } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, CircleUser } from 'lucide-react'

interface ProfileDropdownProps {
  userName: string
  userEmail?: string
}

export function ProfileDropdown({ userName, userEmail }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { signOut } = useClerk()
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <CircleUser className="w-6 h-6 text-gray-600" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              {userEmail && (
                <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/profile')
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                role="menuitem"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/settings')
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                role="menuitem"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-1" />

            {/* Log Out */}
            <div className="py-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


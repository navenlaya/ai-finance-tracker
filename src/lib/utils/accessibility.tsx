// @ts-nocheck
/**
 * Accessibility utilities and helpers
 * Ensure the app meets WCAG AA standards
 */

import React from 'react'

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${++idCounter}`
}

/**
 * ARIA live region for announcements
 */
export function useAriaLiveRegion() {
  const [announcement, setAnnouncement] = React.useState('')
  const [priority, setPriority] = React.useState<'polite' | 'assertive'>('polite')

  const announce = React.useCallback((message: string, urgent: boolean = false) => {
    setAnnouncement(message)
    setPriority(urgent ? 'assertive' : 'polite')
    
    // Clear announcement after a delay
    setTimeout(() => setAnnouncement(''), 1000)
  }, [])

  const LiveRegion = React.useMemo(() => {
    return <div aria-live={priority as any} aria-atomic="true" className="sr-only" role="status">{announcement}</div>
  }, [announcement, priority])

  return { announce, LiveRegion }
}

/**
 * Focus management utilities
 */
export function useFocusManagement() {
  const focusRef = React.useRef<HTMLElement>(null)

  const focusElement = React.useCallback((element?: HTMLElement) => {
    const target = element || focusRef.current
    if (target) {
      target.focus()
    }
  }, [])

  const trapFocus = React.useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [])

  return { focusRef, focusElement, trapFocus }
}

/**
 * Keyboard navigation utilities
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
} as const

export function useKeyboardNavigation(
  onKeyDown: (key: string, event: KeyboardEvent) => void
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown(event.key, event)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onKeyDown])
}

/**
 * Screen reader utilities
 */
export function useScreenReader() {
  const [isScreenReaderActive, setIsScreenReaderActive] = React.useState(false)

  React.useEffect(() => {
    // Detect screen reader usage
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsScreenReaderActive(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsScreenReaderActive(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return { isScreenReaderActive }
}

/**
 * Color contrast utilities
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color contrast library
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  if (!rgb1 || !rgb2) return 0

  const luminance1 = getLuminance(rgb1)
  const luminance2 = getLuminance(rgb2)
  
  const lighter = Math.max(luminance1, luminance2)
  const darker = Math.min(luminance1, luminance2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Accessibility props for common components
 */
export const accessibilityProps = {
  // Button accessibility
  button: (label: string, pressed?: boolean) => ({
    'aria-label': label,
    'aria-pressed': pressed,
    role: 'button',
    tabIndex: 0
  }),

  // Link accessibility
  link: (label: string, href: string) => ({
    'aria-label': label,
    href,
    role: 'link'
  }),

  // Input accessibility
  input: (label: string, required?: boolean, invalid?: boolean) => ({
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': invalid,
    role: 'textbox'
  }),

  // Card accessibility
  card: (title: string, description?: string) => ({
    'aria-labelledby': title,
    'aria-describedby': description,
    role: 'region'
  }),

  // Chart accessibility
  chart: (title: string, description: string) => ({
    'aria-label': title,
    'aria-describedby': description,
    role: 'img'
  }),

  // Table accessibility
  table: (caption: string) => ({
    'aria-label': caption,
    role: 'table'
  }),

  // List accessibility
  list: (label: string) => ({
    'aria-label': label,
    role: 'list'
  }),

  // Navigation accessibility
  navigation: (label: string) => ({
    'aria-label': label,
    role: 'navigation'
  }),

  // Dialog accessibility
  dialog: (title: string, description?: string) => ({
    'aria-labelledby': title,
    'aria-describedby': description,
    role: 'dialog',
    'aria-modal': true
  })
}

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  )
}

/**
 * Visually hidden text for screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

/**
 * Loading state accessibility
 */
export function LoadingState({ isLoading, children }: { 
  isLoading: boolean
  children: React.ReactNode 
}) {
  return (
    <div aria-live="polite" aria-busy={isLoading}>
      {isLoading && (
        <VisuallyHidden>
          Loading content, please wait...
        </VisuallyHidden>
      )}
      {children}
    </div>
  )
}

/**
 * Error state accessibility
 */
export function ErrorState({ error, children }: { 
  error: string | null
  children: React.ReactNode 
}) {
  return (
    <div>
      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          className="text-red-600"
        >
          {error}
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * Form field accessibility wrapper
 */
export function FormField({ 
  label, 
  error, 
  required, 
  children 
}: { 
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode 
}) {
  const fieldId = generateId('field')
  const errorId = generateId('error')

  return (
    <div className="space-y-2">
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': error ? errorId : undefined,
          'aria-invalid': !!error,
          required
        })}
      </div>
      
      {error && (
        <div 
          id={errorId}
          role="alert"
          className="text-sm text-red-600"
        >
          {error}
        </div>
      )}
    </div>
  )
}

/**
 * Accessibility testing utilities
 */
export const accessibilityTests = {
  // Check if element has proper focus management
  hasFocusManagement: (element: HTMLElement): boolean => {
    return element.tabIndex >= 0 || element.tagName === 'BUTTON' || element.tagName === 'A'
  },

  // Check if element has proper ARIA labels
  hasAriaLabel: (element: HTMLElement): boolean => {
    return !!(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby'))
  },

  // Check if element has proper color contrast
  hasGoodContrast: (element: HTMLElement): boolean => {
    const styles = window.getComputedStyle(element)
    const color = styles.color
    const backgroundColor = styles.backgroundColor
    
    if (!color || !backgroundColor) return false
    
    const contrastRatio = getContrastRatio(color, backgroundColor)
    return contrastRatio >= 4.5 // WCAG AA standard
  }
}

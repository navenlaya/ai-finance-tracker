import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'AI Finance Tracker - Smart Financial Insights',
    template: '%s | AI Finance Tracker'
  },
  description: 'Personal finance tracking with AI-powered insights, transaction analysis, and budget recommendations. Connect your bank accounts and get personalized financial advice.',
  keywords: [
    'finance',
    'budgeting', 
    'AI',
    'banking',
    'spending tracker',
    'personal finance',
    'financial insights',
    'money management',
    'expense tracking',
    'budget planner'
  ],
  authors: [{ name: 'AI Finance Tracker Team' }],
  creator: 'AI Finance Tracker',
  publisher: 'AI Finance Tracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AI Finance Tracker - Smart Financial Insights',
    description: 'Personal finance tracking with AI-powered insights, transaction analysis, and budget recommendations.',
    siteName: 'AI Finance Tracker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Finance Tracker - Smart Financial Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Finance Tracker - Smart Financial Insights',
    description: 'Personal finance tracking with AI-powered insights, transaction analysis, and budget recommendations.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <meta name="theme-color" content="#3b82f6" />
        </head>
        <body className={`${inter.className} h-full antialiased`}>
          <ErrorBoundary>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}

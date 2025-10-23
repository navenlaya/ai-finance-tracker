import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from '@/components/ui/navigation'
import { TrendingUp, Shield, Brain, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Financial
            <span className="text-primary block">Insights</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect your bank accounts securely and get intelligent insights about your spending patterns, 
            budget recommendations, and financial health.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free
            </Button>
          </Link>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose AI Finance Tracker?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Bank-Grade Security</CardTitle>
                <CardDescription>
                  Your financial data is encrypted and secure with industry-standard protection.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-12 w-12 text-primary mb-4" />
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Get personalized spending analysis and financial recommendations powered by AI.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Real-Time Analytics</CardTitle>
                <CardDescription>
                  Track your spending patterns and financial health with real-time data visualization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Smart Budgeting</CardTitle>
                <CardDescription>
                  Receive intelligent budget recommendations based on your spending habits and goals.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Bank</h3>
              <p className="text-gray-600">
                Securely link your bank accounts using Plaid's industry-leading security.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your transactions and identifies spending patterns and opportunities.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Insights</h3>
              <p className="text-gray-600">
                Receive personalized insights and recommendations to improve your financial health.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control of Your Finances?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who are already making smarter financial decisions.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Your Free Trial
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary"></div>
            <span className="text-xl font-bold">AI Finance Tracker</span>
          </div>
          <p className="text-gray-400">
            © 2024 AI Finance Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Cambiora - Break Destructive Habits, Build Transformational Change',
  description: 'A web app that helps you break destructive habits and build transformational, long-term change — powered by AI, science-backed psychology, and daily micro-actions.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <Navigation />
        <main className="min-h-screen pb-12 relative">
          {children}
        </main>
      </body>
    </html>
  )
}

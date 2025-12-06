'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import Button from './Button'

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/checkin', label: 'Journal' },
    { href: '/challenges', label: 'Challenges' },
    { href: '/habits', label: 'Habits' },
    { href: '/community', label: 'Community' },
    { href: '/trophies', label: 'Trophies' },
    { href: '/chat', label: 'Chat' },
    { href: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/30 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 sm:h-20 lg:h-22 min-w-0">
          <Link href="/" className="text-2xl sm:text-3xl font-bold text-gradient hover:scale-105 transition-transform duration-300 flex-shrink-0">
            Cambiora
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-2 lg:gap-6 items-center flex-shrink-0">
            {user && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm lg:text-base font-semibold transition-all duration-300 px-3 py-2 rounded-2xl whitespace-nowrap ${
                  pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            ))}
            {!loading && (
              user ? (
                <Button
                  onClick={signOut}
                  variant="secondary"
                  size="sm"
                  className="ml-2"
                >
                  Sign Out
                </Button>
              ) : (
                <Link href="/auth/login">
                  <Button variant="secondary" size="sm" className="ml-2">
                    Sign In
                  </Button>
                </Link>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-2xl text-gray-600 hover:text-primary hover:bg-primary/5 transition-all duration-300"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-2 mt-2">
              {user && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-2xl font-semibold transition-all duration-300 text-base ${
                    pathname === link.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!loading && (
                user ? (
                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="px-4 py-3 rounded-2xl font-semibold transition-all duration-300 text-base text-gray-600 hover:text-primary hover:bg-primary/5 text-left"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-2xl font-semibold transition-all duration-300 text-base text-gray-600 hover:text-primary hover:bg-primary/5"
                  >
                    Sign In
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/checkin', label: 'Check-In' },
    { href: '/challenges', label: 'Challenges' },
    { href: '/chat', label: 'Chat' },
  ]

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="text-3xl font-bold text-gradient hover:scale-105 transition-transform duration-300">
            Unplug
          </Link>
          <div className="flex gap-2 sm:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-xs sm:text-sm font-semibold transition-all duration-300 px-3 py-2 rounded-xl ${
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
          </div>
        </div>
      </div>
    </nav>
  )
}


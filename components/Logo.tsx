import React from 'react'
import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8 sm:h-10 sm:w-10',
    lg: 'h-12 w-12 sm:h-16 sm:w-16',
  }

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-4xl sm:text-5xl',
  }

  const LogoContent = () => (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Leaf Icon - Light blue minimalist leaf with white central vein */}
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Leaf shape - smooth ovate, wider at top, tapering to rounded point, oriented diagonally */}
        <path
          d="M20 12C18 18 18 25 20 32C22 38 26 44 30 46C34 48 38 46 40 40C42 33 42 26 40 20C38 14 34 10 30 8C28 7 26 7 24 8C22 9 20 10 20 12Z"
          fill="#4C9DFF"
          transform="rotate(25 30 30)"
        />
        {/* Central vein - white line curving from top left towards bottom right */}
        <path
          d="M22 18 Q28 28 32 38"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          transform="rotate(25 30 30)"
        />
        {/* Petiole (stem) - short rounded stem at bottom */}
        <ellipse
          cx="28"
          cy="48"
          rx="2.5"
          ry="1.5"
          fill="#4C9DFF"
          transform="rotate(25 30 30)"
        />
      </svg>
      
      {/* Text - Light blue, clean sans-serif */}
      {showText && (
        <span className={`font-bold text-primary ${textSizes[size]} whitespace-nowrap`}>
          Unplug
        </span>
      )}
    </div>
  )

  return showText ? (
    <Link href="/" className="hover:scale-105 transition-transform duration-300">
      <LogoContent />
    </Link>
  ) : (
    <LogoContent />
  )
}

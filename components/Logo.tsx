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
      {/* Plug Icon - Light blue with rounded shield shape */}
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main plug body - rounded shield shape with smooth left curve and angled right edge */}
        <path
          d="M12 25C12 20 15 15 22 15C25 15 27 17 27 20V25H32C35 25 37 27 37 30V35C37 38 35 40 32 40H27V45C27 48 25 50 22 50C15 50 12 45 12 40V25Z"
          fill="#4C9DFF"
        />
        {/* Left prong - extending upward and slightly right with rounded end */}
        <path
          d="M18 5L20 5L20.5 8L21.5 8L22 5L24 5L23.5 17L20.5 17L20 14L19 14L18.5 17L15.5 17L15 5L18 5Z"
          fill="#4C9DFF"
          transform="rotate(-5 19.5 11)"
        />
        {/* Right prong - parallel to left, extending upward and slightly right */}
        <path
          d="M24 5L26 5L26.5 8L27.5 8L28 5L30 5L29.5 17L26.5 17L26 14L25 14L24.5 17L21.5 17L21 5L24 5Z"
          fill="#4C9DFF"
          transform="rotate(5 25.5 11)"
        />
        {/* Arrow integrated in lower-left - pointing up and right, following curve */}
        <path
          d="M15 38L19 34L17.5 34L17.5 30L21.5 30L21.5 34L20 34L24 38L20 42L21.5 42L21.5 46L17.5 46L17.5 42L19 42L15 38Z"
          fill="#4C9DFF"
          opacity="0.9"
        />
      </svg>
      
      {/* Text - Light blue, clean sans-serif */}
      {showText && (
        <span className={`font-bold text-primary ${textSizes[size]}`}>
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

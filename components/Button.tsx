import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-2xl transition-all duration-500 ease-out focus:outline-none focus:ring-4 focus:ring-primary/30 focus:ring-offset-2 relative overflow-hidden group'
  
  const variantStyles = {
    primary: disabled
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'gradient-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-105 active:scale-100 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000',
    secondary: disabled
      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
      : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-white/50 shadow-md hover:shadow-lg hover:-translate-y-1 hover:scale-105 active:scale-100 hover:bg-white/90',
  }
  
  const sizeStyles = {
    sm: 'px-4 sm:px-5 py-2 sm:py-2.5 text-sm',
    md: 'px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base',
    lg: 'px-7 sm:px-9 py-3.5 sm:py-4.5 text-base sm:text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  )
}

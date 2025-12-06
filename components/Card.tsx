import { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
  style?: CSSProperties
}

export default function Card({ children, className = '', hover = false, glass = false, style }: CardProps) {
  const baseStyles = glass 
    ? 'glass-card rounded-3xl p-6 sm:p-8 lg:p-10 shadow-premium' 
    : 'bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 lg:p-10 shadow-soft border border-gray-100/50'
  
  const hoverStyles = hover 
    ? 'hover:shadow-premium-lg hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-out cursor-pointer' 
    : 'transition-all duration-300'
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} style={style}>
      {children}
    </div>
  )
}

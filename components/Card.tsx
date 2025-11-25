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
    ? 'glass-card rounded-3xl p-6 shadow-premium' 
    : 'bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-premium border border-white/50'
  
  const hoverStyles = hover 
    ? 'hover:shadow-premium-lg hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 ease-out cursor-pointer' 
    : 'transition-all duration-300'
  
  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`} style={style}>
      {children}
    </div>
  )
}

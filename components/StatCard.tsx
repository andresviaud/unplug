import { ReactNode } from 'react'
import Card from './Card'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card hover className="text-center group">
      {icon && (
        <div className="mb-5 sm:mb-6 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
          <div className="text-5xl sm:text-6xl animate-float" style={{ animationDelay: `${Math.random() * 2}s` }}>
            {icon}
          </div>
        </div>
      )}
      <div className={`font-extrabold text-gradient mb-3 group-hover:scale-105 transition-transform duration-300 tracking-tight ${
        typeof value === 'number' && value > 999 
          ? 'text-3xl sm:text-4xl lg:text-5xl' 
          : 'text-4xl sm:text-5xl lg:text-6xl'
      }`}>
        {value}
      </div>
      <div className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider letter-spacing-wide">{label}</div>
    </Card>
  )
}


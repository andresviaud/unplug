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
        <div className="mb-4 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
          <div className="text-4xl animate-float" style={{ animationDelay: `${Math.random() * 2}s` }}>
            {icon}
          </div>
        </div>
      )}
      <div className="text-4xl sm:text-5xl font-bold text-gradient mb-2 group-hover:scale-110 transition-transform duration-300">
        {value}
      </div>
      <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</div>
    </Card>
  )
}


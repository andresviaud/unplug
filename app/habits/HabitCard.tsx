'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { isHabitLoggedToday, type Habit } from '@/lib/storage-supabase'

interface HabitCardProps {
  habit: Habit
  index: number
  errorMessage?: string
  onLogHabit: (habitId: string) => Promise<void>
  onToggleActive: (habitId: string) => Promise<void>
  onDelete: (habitId: string) => Promise<void>
}

export default function HabitCard({
  habit,
  index,
  errorMessage,
  onLogHabit,
  onToggleActive,
  onDelete,
}: HabitCardProps) {
  const [streak, setStreak] = useState(0)
  const [loggedToday, setLoggedToday] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHabitData = async () => {
      // Calculate streak from start date
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(habit.start_date)
      startDate.setHours(0, 0, 0, 0)
      if (startDate > today) {
        setStreak(0)
      } else {
        const timeDiff = today.getTime() - startDate.getTime()
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        setStreak(Math.max(1, daysDiff))
      }

      // Check if logged today
      const logged = await isHabitLoggedToday(habit.id)
      setLoggedToday(logged)
      setLoading(false)
    }
    loadHabitData()
  }, [habit.id, habit.start_date])

  // Format date string (YYYY-MM-DD) directly to avoid timezone issues
  const formatStartDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  const startDate = formatStartDate(habit.start_date)

  return (
    <Card hover className="animate-fade-in" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{habit.name}</h3>
              <span className="px-3 sm:px-4 py-1 sm:py-1.5 gradient-primary text-white rounded-full text-xs sm:text-sm font-bold shadow-md whitespace-nowrap flex-shrink-0">
                +{habit.xp_per_day} XP/day
              </span>
            </div>
            {habit.description && (
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed break-words mb-3">
                {habit.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <span className="font-bold text-gray-900">{streak} day streak</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-sm">Started: {startDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="error-message">
            <p className="error-message-text">{errorMessage}</p>
          </div>
        )}

        <div className="flex gap-3 sm:flex-col sm:gap-2">
          {loading ? (
            <div className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 rounded-2xl text-center text-sm sm:text-base">
              Loading...
            </div>
          ) : loggedToday ? (
            <div className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl font-bold text-center shadow-premium text-sm sm:text-base">
              ✓ Logged Today
            </div>
          ) : (
            <Button
              onClick={() => onLogHabit(habit.id)}
              size="lg"
              className="w-full sm:w-auto min-w-[140px]"
            >
              Log Today
            </Button>
          )}
          <Button
            onClick={() => onToggleActive(habit.id)}
            size="md"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {habit.is_active !== false ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            onClick={() => onDelete(habit.id)}
            size="md"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}


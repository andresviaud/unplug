'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { isHabitLoggedToday, getHabitStreak, type Habit } from '@/lib/storage-supabase'

interface HabitCardSimpleProps {
  habit: Habit
  index: number
  errorMessage?: string
  onLogHabit: (habitId: string) => Promise<void>
  onUnlogHabit: (habitId: string) => Promise<void>
  onDelete: (habitId: string) => Promise<void>
}

export default function HabitCardSimple({
  habit,
  index,
  errorMessage,
  onLogHabit,
  onUnlogHabit,
  onDelete,
}: HabitCardSimpleProps) {
  const [loggedToday, setLoggedToday] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const loadHabitData = async () => {
      const logged = await isHabitLoggedToday(habit.id)
      setLoggedToday(logged)
      
      // Get actual streak from database (consecutive days logged)
      const currentStreak = await getHabitStreak(habit.id)
      setStreak(currentStreak)
    }
    loadHabitData()
    
    // Listen for habit updates to refresh streak immediately
    const handleHabitUpdate = async () => {
      const logged = await isHabitLoggedToday(habit.id)
      setLoggedToday(logged)
      const currentStreak = await getHabitStreak(habit.id)
      setStreak(currentStreak)
    }
    
    window.addEventListener('habitUpdated', handleHabitUpdate)
    return () => window.removeEventListener('habitUpdated', handleHabitUpdate)
  }, [habit.id, habit.start_date])

  const formatStartDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

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
                <span className="text-sm">Started: {formatStartDate(habit.start_date)}</span>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-3 sm:flex-col sm:gap-2">
          {loggedToday ? (
            <Button
              onClick={() => onUnlogHabit(habit.id)}
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto min-w-[140px]"
            >
              Undo
            </Button>
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


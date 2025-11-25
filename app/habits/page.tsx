'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { createHabit, getHabits, deleteHabit, logHabit, getHabitStreak, isHabitLoggedToday, getStats } from '@/lib/storage'
import type { Habit } from '@/lib/storage'

const EXAMPLE_HABITS = [
  { name: 'Quit Alcohol', description: 'Stay alcohol-free', xpPerDay: 25 },
  { name: 'Quit Nicotine', description: 'No smoking or vaping', xpPerDay: 30 },
  { name: 'Exercise Daily', description: '30 minutes of physical activity', xpPerDay: 20 },
  { name: 'Meditation', description: '10 minutes of mindfulness', xpPerDay: 15 },
  { name: 'Read Books', description: 'Read for 30 minutes', xpPerDay: 15 },
  { name: 'No Social Media', description: 'Stay off social platforms', xpPerDay: 20 },
]

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitDescription, setNewHabitDescription] = useState('')
  const [newHabitXP, setNewHabitXP] = useState(20)

  useEffect(() => {
    setHabits(getHabits())
  }, [])

  const handleCreateHabit = () => {
    if (!newHabitName.trim()) {
      alert('Please enter a habit name')
      return
    }

    const habit = createHabit({
      name: newHabitName.trim(),
      description: newHabitDescription.trim() || undefined,
      xpPerDay: newHabitXP,
    })

    setHabits(getHabits())
    setNewHabitName('')
    setNewHabitDescription('')
    setNewHabitXP(20)
    setShowCreateForm(false)
  }

  const handleUseExample = (example: typeof EXAMPLE_HABITS[0]) => {
    const habit = createHabit({
      name: example.name,
      description: example.description,
      xpPerDay: example.xpPerDay,
    })

    setHabits(getHabits())
  }

  const handleLogHabit = (habitId: string) => {
    logHabit(habitId)
    setHabits(getHabits()) // Refresh to update streaks
  }

  const handleDeleteHabit = (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit? This will also delete all its logs.')) {
      deleteHabit(habitId)
      setHabits(getHabits())
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="text-center mb-12 sm:mb-16 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gradient mb-6 tracking-tight">Habit Trackers</h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed px-4">
          Break destructive habits and build transformational, long-term change through daily micro-actions.
        </p>
      </div>

      {/* Create Habit Button */}
      <div className="mb-8 flex justify-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          size="lg"
          variant="secondary"
        >
          {showCreateForm ? 'Cancel' : '+ Create New Habit'}
        </Button>
      </div>

      {/* Create Habit Form */}
      {showCreateForm && (
        <Card className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Habit</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Habit Name *
              </label>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g., Quit Alcohol, Exercise Daily"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newHabitDescription}
                onChange={(e) => setNewHabitDescription(e.target.value)}
                placeholder="Brief description of your habit"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                XP Per Day: {newHabitXP}
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={newHabitXP}
                onChange={(e) => setNewHabitXP(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10 XP</span>
                <span>50 XP</span>
              </div>
            </div>
            <Button onClick={handleCreateHabit} size="lg" className="w-full">
              Create Habit
            </Button>
          </div>
        </Card>
      )}

      {/* Example Habits */}
      {habits.length === 0 && !showCreateForm && (
        <Card className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start Examples</h2>
          <p className="text-gray-600 mb-6">Get started with one of these popular habits:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAMPLE_HABITS.map((example, index) => (
              <button
                key={index}
                onClick={() => handleUseExample(example)}
                className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-primary hover:shadow-premium transition-all duration-300 text-left"
              >
                <div className="font-bold text-gray-900 mb-1">{example.name}</div>
                <div className="text-sm text-gray-600 mb-2">{example.description}</div>
                <div className="text-xs text-primary font-semibold">+{example.xpPerDay} XP/day</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* User Habits List */}
      {habits.length > 0 && (
        <div className="space-y-6">
          {habits.map((habit, index) => {
            const streak = getHabitStreak(habit.id)
            const loggedToday = isHabitLoggedToday(habit.id)
            
            return (
              <Card key={habit.id} hover className="animate-fade-in" style={{ animationDelay: `${0.3 + index * 0.1}s` }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{habit.name}</h3>
                      <span className="px-3 sm:px-4 py-1 sm:py-1.5 gradient-primary text-white rounded-full text-xs sm:text-sm font-bold shadow-md whitespace-nowrap flex-shrink-0">
                        +{habit.xpPerDay} XP/day
                      </span>
                    </div>
                    {habit.description && (
                      <p className="text-gray-700 text-base sm:text-lg leading-relaxed break-words mb-3">
                        {habit.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        <span className="font-bold text-gray-900">{streak} day streak</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:flex-col sm:gap-2">
                    {loggedToday ? (
                      <div className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl font-bold text-center shadow-premium text-sm sm:text-base">
                        ✓ Logged Today
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleLogHabit(habit.id)}
                        size="lg"
                        className="w-full sm:w-auto min-w-[140px]"
                      >
                        Log Today
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteHabit(habit.id)}
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
          })}
        </div>
      )}
    </div>
  )
}


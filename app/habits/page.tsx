'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import HabitCardSimple from './HabitCardSimple'
import Celebration from '@/components/Celebration'
import { 
  createHabit, 
  getHabits, 
  deleteHabit, 
  logHabit, 
  unlogHabit,
  toggleHabitActive, 
  getTodayEST,
  getHabitStreak,
  type Habit
} from '@/lib/storage-supabase'

const EXAMPLE_HABITS = [
  { name: 'Quit Alcohol', description: 'Stay alcohol-free', xpPerDay: 25 },
  { name: 'Quit Nicotine', description: 'No smoking or vaping', xpPerDay: 30 },
  { name: 'Exercise Daily', description: '30 minutes of physical activity', xpPerDay: 20 },
  { name: 'Meditation', description: '10 minutes of mindfulness', xpPerDay: 15 },
  { name: 'Read Books', description: 'Read for 30 minutes', xpPerDay: 15 },
  { name: 'No Social Media', description: 'Stay off social platforms', xpPerDay: 20 },
]

export default function HabitsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [habits, setHabits] = useState<Habit[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitDescription, setNewHabitDescription] = useState('')
  const [newHabitXP, setNewHabitXP] = useState(20)
  const [newHabitStartDate, setNewHabitStartDate] = useState('')
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({})
  const [celebration, setCelebration] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  // Initialize auth and start date
  useEffect(() => {
    const init = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Auth error:', error)
        }
        setUser(session?.user ?? null)
        setAuthLoading(false)
        try {
          setNewHabitStartDate(getTodayEST())
        } catch (dateError) {
          console.error('Date error:', dateError)
          const today = new Date().toISOString().split('T')[0]
          setNewHabitStartDate(today)
        }
      } catch (error) {
        console.error('Error initializing:', error)
        setAuthLoading(false)
        const today = new Date().toISOString().split('T')[0]
        setNewHabitStartDate(today)
      }
    }
    init()
  }, [])

  // Load habits when user is available
  useEffect(() => {
    if (user) {
      loadHabits()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadHabits = async () => {
    try {
      setLoading(true)
      const data = await getHabits()
      setHabits(data)
    } catch (error: any) {
      console.error('Error loading habits:', error)
      alert('Error loading habits: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) {
      alert('Please enter a habit name')
      return
    }

    if (!newHabitStartDate) {
      alert('Please select a start date')
      return
    }

    try {
      await createHabit({
        name: newHabitName.trim(),
        description: newHabitDescription.trim() || undefined,
        xp_per_day: newHabitXP,
        start_date: newHabitStartDate,
      })
      await loadHabits()
      setNewHabitName('')
      setNewHabitDescription('')
      setNewHabitXP(20)
      setNewHabitStartDate(getTodayEST())
      setShowCreateForm(false)
      alert('Habit created successfully!')
    } catch (error: any) {
      console.error('Error creating habit:', error)
      alert(`Error creating habit: ${error.message}\n\nMake sure you are logged in.`)
    }
  }

  const handleUseExample = async (example: typeof EXAMPLE_HABITS[0]) => {
    try {
      await createHabit({
        name: example.name,
        description: example.description,
        xp_per_day: example.xpPerDay,
        start_date: getTodayEST(),
      })
      await loadHabits()
      alert('Habit created successfully!')
    } catch (error: any) {
      alert('Error creating habit: ' + error.message)
    }
  }

  const handleLogHabit = async (habitId: string) => {
    try {
      // Get current streak before logging
      const oldStreak = await getHabitStreak(habitId)
      
      const result = await logHabit(habitId)
      if (!result.success && result.message) {
        setErrorMessages(prev => ({
          ...prev,
          [habitId]: result.message || '',
        }))
        setTimeout(() => {
          setErrorMessages(prev => {
            const newMessages = { ...prev }
            delete newMessages[habitId]
            return newMessages
          })
        }, 5000)
      } else {
        // Success! Reload habits to update UI (streaks will be recalculated)
        await loadHabits()
        
        // Get new streak after logging
        const newStreak = await getHabitStreak(habitId)
        const habit = habits.find(h => h.id === habitId)
        
        // Notify dashboard to update streaks
        window.dispatchEvent(new Event('habitUpdated'))
        
        // Celebrate with different messages based on streak milestones
        let message = 'Habit Logged! 🎉'
        if (newStreak === 1) {
          message = 'Day 1 Complete! 🚀'
        } else if (newStreak === 7) {
          message = '7 Day Streak! 🔥'
        } else if (newStreak === 30) {
          message = '30 Day Streak! 🌟'
        } else if (newStreak === 100) {
          message = '100 Day Streak! 💎'
        } else if (newStreak > oldStreak && newStreak % 10 === 0) {
          message = `${newStreak} Day Streak! 🎊`
        } else if (newStreak > oldStreak) {
          message = `${newStreak} Day Streak! 🔥`
        }
        
        setCelebration({ show: true, message })
      }
    } catch (error: any) {
      alert('Error logging habit: ' + error.message)
    }
  }

  const handleUnlogHabit = async (habitId: string) => {
    try {
      const result = await unlogHabit(habitId)
      if (!result.success && result.message) {
        setErrorMessages(prev => ({
          ...prev,
          [habitId]: result.message || '',
        }))
        setTimeout(() => {
          setErrorMessages(prev => {
            const newMessages = { ...prev }
            delete newMessages[habitId]
            return newMessages
          })
        }, 5000)
      } else {
        // Success! Reload habits to update UI (streaks will be recalculated)
        await loadHabits()
        
        // Notify dashboard to update streaks
        window.dispatchEvent(new Event('habitUpdated'))
      }
    } catch (error: any) {
      alert('Error unlogging habit: ' + error.message)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit? This will also delete all its logs.')) {
      try {
        await deleteHabit(habitId)
        await loadHabits()
      } catch (error: any) {
        alert('Error deleting habit: ' + error.message)
      }
    }
  }

  const handleToggleActive = async (habitId: string) => {
    try {
      await toggleHabitActive(habitId)
      await loadHabits()
    } catch (error: any) {
      alert('Error toggling habit: ' + error.message)
    }
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Card>
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Please Sign In</h1>
            <p className="text-gray-600">You need to be logged in to view and create habits.</p>
            <Button onClick={() => router.push('/auth/login')} size="lg">
              Go to Sign In
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const activeHabits = habits.filter(h => h.is_active !== false)
  const displayedHabits = activeHabits

  return (
    <>
      <Celebration 
        show={celebration.show} 
        message={celebration.message}
        onComplete={() => setCelebration({ show: false, message: '' })}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gradient mb-6 tracking-tight">Habit Trackers</h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed px-4">
          Break destructive habits and build transformational, long-term change through daily micro-actions.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
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
                className="input-premium"
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
                className="input-premium"
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Start Date *
              </label>
              <input
                type="date"
                value={newHabitStartDate}
                onChange={(e) => setNewHabitStartDate(e.target.value)}
                max={getTodayEST()}
                className="input-premium"
              />
              <p className="text-xs text-gray-500 mt-2">
                Select the date when you started this habit (can be in the past)
              </p>
            </div>
            <Button 
              onClick={handleCreateHabit} 
              size="lg" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Habit'}
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
      {displayedHabits.length > 0 ? (
        <div className="space-y-6">
          {displayedHabits.map((habit, index) => (
            <HabitCardSimple
              key={habit.id}
              habit={habit}
              index={index}
              errorMessage={errorMessages[habit.id]}
              onLogHabit={handleLogHabit}
              onUnlogHabit={handleUnlogHabit}
              onDelete={handleDeleteHabit}
            />
          ))}
        </div>
      ) : (
        <Card className="relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative text-center py-12 sm:py-16">
            <div className="text-6xl sm:text-7xl mb-6 opacity-60 animate-float">🎯</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">No Habits Yet</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Start your transformation journey by creating your first habit. Every great change begins with a single step.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              size="lg"
              className="shadow-premium"
            >
              + Create Your First Habit
            </Button>
          </div>
        </Card>
      )}
      </div>
    </>
  )
}

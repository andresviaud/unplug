'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { getPublicHabits, cheerHabit, uncheerHabit, type PublicHabit } from '@/lib/storage-supabase'
import Link from 'next/link'

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth()
  const [publicHabits, setPublicHabits] = useState<PublicHabit[]>([])
  const [loading, setLoading] = useState(true)
  const [cheering, setCheering] = useState<string | null>(null) // Track which habit is being cheered

  const loadPublicHabits = async () => {
    try {
      setLoading(true)
      const habits = await getPublicHabits()
      setPublicHabits(habits)
    } catch (error: any) {
      console.error('Error loading public habits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadPublicHabits()
    }
  }, [authLoading])

  const handleCheer = async (habitId: string) => {
    if (!user) {
      alert('Please sign in to cheer habits')
      return
    }

    setCheering(habitId)
    try {
      const result = await cheerHabit(habitId)
      if (result.success) {
        // Reload to update cheer counts
        await loadPublicHabits()
      } else {
        alert(result.message || 'Failed to cheer habit')
      }
    } catch (error: any) {
      console.error('Error cheering habit:', error)
      alert('Failed to cheer habit: ' + error.message)
    } finally {
      setCheering(null)
    }
  }

  const handleUncheer = async (habitId: string) => {
    if (!user) return

    setCheering(habitId)
    try {
      const result = await uncheerHabit(habitId)
      if (result.success) {
        // Reload to update cheer counts
        await loadPublicHabits()
      } else {
        alert(result.message || 'Failed to remove cheer')
      }
    } catch (error: any) {
      console.error('Error removing cheer:', error)
      alert('Failed to remove cheer: ' + error.message)
    } finally {
      setCheering(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <p className="text-gray-600">Loading community feed...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Card>
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Community Support</h1>
            <p className="text-gray-600">Please sign in to view and support the community.</p>
            <Link href="/auth/login">
              <Button size="lg">Sign In</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Header */}
      <div className="text-center mb-12 sm:mb-16 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gradient tracking-tight mb-6">
          Community Support
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
          Support others on their journey. See public habits and cheer them on! 🎉
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Only habits marked as "public" appear here. Make your habits public in the{' '}
          <Link href="/habits" className="text-primary hover:underline font-semibold">
            Habits page
          </Link>
          .
        </p>
      </div>

      {/* Public Habits Feed */}
      {publicHabits.length === 0 ? (
        <Card className="relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative text-center py-12 sm:py-16">
            <div className="text-6xl sm:text-7xl mb-6 opacity-60">👥</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              No Public Habits Yet
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Be the first to share your journey! Make your habits public to inspire others.
            </p>
            <Link href="/habits">
              <Button size="lg" className="shadow-premium">
                Go to Habits
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {publicHabits.map((habit, index) => (
            <Card
              key={habit.id}
              hover
              className="group relative overflow-hidden animate-fade-in border-2 border-transparent hover:border-primary/20 transition-all duration-500"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-50" />

              <div className="relative">
                {/* User Info */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {(habit.user_email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {habit.user_email || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">Shared their journey</p>
                  </div>
                </div>

                {/* Habit Info */}
                <div className="mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300 tracking-tight">
                    {habit.habit_name}
                  </h3>
                  {habit.habit_description && (
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                      {habit.habit_description}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Streak</span>
                    <span className="text-lg font-bold text-primary flex items-center gap-1">
                      🔥 {habit.streak} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">XP per day</span>
                    <span className="text-sm font-semibold text-gray-900">
                      +{habit.xp_per_day} XP
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cheers</span>
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      👏 {habit.cheer_count}
                    </span>
                  </div>
                </div>

                {/* Cheer Button */}
                <div className="pt-4 border-t border-gray-100">
                  {habit.has_cheered ? (
                    <Button
                      onClick={() => handleUncheer(habit.habit_id)}
                      size="md"
                      variant="secondary"
                      disabled={cheering === habit.habit_id}
                      className="w-full"
                    >
                      {cheering === habit.habit_id ? 'Removing...' : '👏 Un-cheer'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleCheer(habit.habit_id)}
                      size="md"
                      disabled={cheering === habit.habit_id}
                      className="w-full group-hover:scale-[1.02] transition-transform duration-300"
                    >
                      {cheering === habit.habit_id ? 'Cheering...' : '👏 Cheer Them On!'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


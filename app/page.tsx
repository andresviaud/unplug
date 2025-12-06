'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/Card'
import StatCard from '@/components/StatCard'
import Button from '@/components/Button'
import { useAuth } from '@/lib/useAuth'
import { getTodayCheckIn, getUserStats, getChallengeCompletions, completeDailyChallengeById, undoDailyChallengeById, getHabits, getHabitStreak, getTodayEST, type DailyEntry, type UserStats, type Habit } from '@/lib/storage-supabase'
import { generateDailyChallengesFromHabits, type DailyChallenge } from '@/lib/challenge-generator'
import { PageErrorBoundary } from './page-error-boundary'
import AnimalVisual from '@/components/AnimalVisual'
import Celebration from '@/components/Celebration'

function DashboardContent() {
  const { user, loading: authLoading } = useAuth()
  const [todayCheckIn, setTodayCheckIn] = useState<DailyEntry | null>(null)
  const [stats, setStats] = useState<UserStats>({ total_xp: 0, current_streak: 0, last_completion_date: null })
  const [totalChallenges, setTotalChallenges] = useState(0)
  const [aiPrompt, setAiPrompt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingChallenge, setCompletingChallenge] = useState(false)
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([])
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set())
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitStreaks, setHabitStreaks] = useState<Record<string, number>>({})
  const [celebration, setCelebration] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  const loadData = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
      try {
        setLoading(true)
        const [checkIn, userStats, completions, userHabits] = await Promise.all([
          getTodayCheckIn().catch(err => {
            console.error('Error loading check-in:', err)
            return null
          }),
          getUserStats().catch(err => {
            console.error('Error loading stats:', err)
            return { total_xp: 0, current_streak: 0, last_completion_date: null }
          }),
          getChallengeCompletions().catch(err => {
            console.error('Error loading completions:', err)
            return []
          }),
          getHabits().catch(err => {
            console.error('Error loading habits:', err)
            return []
          }),
        ])
        setTodayCheckIn(checkIn)
        setStats(userStats)
        setTotalChallenges(completions.length)
        setHabits(userHabits)
        
        // Load individual habit streaks
        const streaks: Record<string, number> = {}
        for (const habit of userHabits) {
          if (habit.is_active !== false) {
            streaks[habit.id] = await getHabitStreak(habit.id).catch(() => 0)
          }
        }
        setHabitStreaks(streaks)
        
        // Generate daily challenges for each habit
        if (userHabits.length > 0) {
          const activeHabits = userHabits.filter(h => h.is_active !== false)
          const challenges = generateDailyChallengesFromHabits(activeHabits)
          setDailyChallenges(challenges)
          
          // Check which challenges are already completed today
          const today = getTodayEST()
          const completions = await getChallengeCompletions()
          const todayCompletions = completions
            .filter(c => c.date === today)
            .map(c => c.challenge_id)
          setCompletedChallengeIds(new Set(todayCompletions))
        } else {
          setDailyChallenges([])
          setCompletedChallengeIds(new Set())
        }
        
        // Load AI prompt if check-in exists
        if (checkIn) {
          try {
            const response = await fetch('/api/ai-daily-prompt')
            if (response.ok) {
              const data = await response.json()
              setAiPrompt(data.message)
            }
          } catch (error) {
            console.error('Error loading AI prompt:', error)
          }
        }
    } catch (error: any) {
      console.error('Error loading data:', error)
      setError(error?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [user, authLoading])

  // Listen for habit updates to refresh streaks immediately
  useEffect(() => {
    const handleHabitUpdate = async () => {
      if (habits.length > 0) {
        const streaks: Record<string, number> = {}
        for (const habit of habits) {
          if (habit.is_active !== false) {
            streaks[habit.id] = await getHabitStreak(habit.id).catch(() => 0)
          }
        }
        setHabitStreaks(streaks)
      }
    }

    window.addEventListener('habitUpdated', handleHabitUpdate)
    return () => window.removeEventListener('habitUpdated', handleHabitUpdate)
  }, [habits])

  const handleCompleteChallenge = async (challenge: DailyChallenge) => {
    setCompletingChallenge(true)
    try {
      const result = await completeDailyChallengeById(challenge.id, challenge.xp)
      if (result.success) {
        // Celebrate with sound and animation!
        setCelebration({ show: true, message: `Challenge Completed! +${challenge.xp} XP 🎉` })
        
        // Update completed challenges
        setCompletedChallengeIds(prev => {
          const newSet = new Set(prev)
          newSet.add(challenge.id)
          return newSet
        })
        
        // Reload data to show updated stats and animal progress
        await loadData()
        // Force animal visual to reload by triggering a state update
        window.dispatchEvent(new Event('animalProgressUpdate'))
      } else {
        alert(result.message || 'Failed to complete challenge')
      }
    } catch (error: any) {
      console.error('Error completing challenge:', error)
      alert(error?.message || 'Failed to complete challenge')
    } finally {
      setCompletingChallenge(false)
    }
  }

  const handleUndoChallenge = async (challenge: DailyChallenge) => {
    setCompletingChallenge(true)
    try {
      const result = await undoDailyChallengeById(challenge.id)
      if (result.success) {
        // Update completed challenges
        setCompletedChallengeIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(challenge.id)
          return newSet
        })
        
        // Reload data to show updated stats and animal progress
        await loadData()
        window.dispatchEvent(new Event('animalProgressUpdate'))
      } else {
        alert(result.message || 'Failed to undo challenge')
      }
    } catch (error: any) {
      console.error('Error undoing challenge:', error)
      alert(error?.message || 'Failed to undo challenge')
    } finally {
      setCompletingChallenge(false)
    }
  }

  // Show error if any
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => {
              setError(null)
              window.location.reload()
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }


  const moodEmojis: Record<number, string> = {
    1: '😔',
    2: '😕',
    3: '😐',
    4: '🙂',
    5: '😊',
  }
  
  const moodLabels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Okay',
    4: 'Good',
    5: 'Great',
  }
  
  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="page-hero">
          <h1>Cambiora</h1>
          <p>
            A web app that helps you break destructive habits and build transformational, long-term change — powered by AI, science-backed psychology, and daily micro-actions.
          </p>
        </div>
        <div className="mt-8 text-center">
          <Link href="/auth/login">
            <Button size="lg">Sign In to Get Started</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Celebration 
        show={celebration.show} 
        message={celebration.message}
        onComplete={() => setCelebration({ show: false, message: '' })}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Hero Section */}
      <div className="page-hero">
        <h1>Cambiora</h1>
        <p>
          A web app that helps you break destructive habits and build transformational, long-term change — powered by AI, science-backed psychology, and daily micro-actions.
        </p>
      </div>

      {/* Daily Challenges Section - One per habit */}
      {dailyChallenges.length > 0 && (
        <div className="mb-10 sm:mb-12 lg:mb-16 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="page-hero mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gradient tracking-tight">Today's Challenges</h2>
            <p className="text-base sm:text-lg text-gray-700 mt-3">
              Complete personalized challenges for each of your habits to earn XP and progress!
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-7">
            {dailyChallenges.map((challenge, index) => {
              const isCompleted = completedChallengeIds.has(challenge.id)
              
              return (
                <Card key={challenge.id} hover className="group relative overflow-hidden animate-fade-in" style={{ animationDelay: `${0.1 + index * 0.1}s` }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
                  <div className="relative">
                    {/* Habit Badge */}
                    <div className="mb-4 flex items-center gap-3 flex-wrap">
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-bold">
                        {challenge.habitName}
                      </span>
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 gradient-primary text-white rounded-full text-xs sm:text-sm font-bold shadow-premium">
                        +{challenge.xp} XP
                      </span>
                    </div>
                    
                    {/* Challenge Title */}
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300 tracking-tight">
                      {challenge.title}
                    </h3>
                    
                    {/* Challenge Description */}
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-6">
                      {challenge.description}
                    </p>
                    
                    {/* Complete/Undo Button */}
                    {isCompleted ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200/60 rounded-xl">
                          <p className="text-green-800 font-semibold text-sm sm:text-base flex items-center gap-2">
                            <span>✅</span>
                            <span>Completed!</span>
                          </p>
                        </div>
                        <Button
                          onClick={() => handleUndoChallenge(challenge)}
                          size="md"
                          variant="secondary"
                          disabled={completingChallenge}
                          className="w-full"
                        >
                          {completingChallenge ? 'Undoing...' : 'Undo'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleCompleteChallenge(challenge)}
                        size="md"
                        disabled={completingChallenge}
                        className="w-full"
                      >
                        {completingChallenge ? 'Completing...' : 'Complete Challenge'}
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Today's Check-In Card */}
      {todayCheckIn && (
        <div className="mb-10 sm:mb-12 lg:mb-16 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-3 flex-wrap tracking-tight">
                {todayCheckIn.mood && (
                  <span className="text-3xl sm:text-4xl">{moodEmojis[todayCheckIn.mood]}</span>
                )}
                <span className="break-words">Today's Check-In</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                {todayCheckIn.mood && (
                  <div className="space-y-3 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Mood</div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                      {moodLabels[todayCheckIn.mood] || 'Not set'}
                    </div>
                  </div>
                )}
                {todayCheckIn.journal_text && (
                  <div className="sm:col-span-2 space-y-3 pt-6 border-t-2 border-gray-200/60 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider">Journal Entry</div>
                    <div className="text-gray-700 text-base sm:text-lg leading-relaxed break-words overflow-wrap-anywhere">{todayCheckIn.journal_text}</div>
                  </div>
                )}
              </div>
              
              {/* AI Daily Prompt */}
              {aiPrompt && (
                <div className="mt-8 pt-8 border-t-2 border-gray-200/60">
                  <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">AI Daily Prompt</div>
                  <div className="p-5 sm:p-6 bg-gradient-to-br from-primary/10 to-indigo-50/50 border-2 border-primary/20 rounded-2xl shadow-soft">
                    <p className="text-gray-800 text-base sm:text-lg leading-relaxed font-medium">{aiPrompt}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Animal Visual Section */}
      <div className="mb-10 sm:mb-12 lg:mb-16 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <AnimalVisual />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 mb-10 sm:mb-12 lg:mb-16">
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            label="Total XP"
            value={stats.total_xp}
            icon={<span>⭐</span>}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <StatCard
            label="Challenges Completed"
            value={totalChallenges}
            icon={<span>🎯</span>}
          />
        </div>
        {habits.filter(h => h.is_active !== false).length > 0 ? (
          <div className="animate-fade-in sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.4s' }}>
            <Card hover className="group">
              <div className="mb-5 sm:mb-6 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
                <div className="text-5xl sm:text-6xl animate-float">
                  🔥
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gradient mb-5 sm:mb-6 text-center group-hover:scale-105 transition-transform duration-300 tracking-tight">
                Habit Streaks
              </div>
              <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-2.5 sm:space-y-3">
                  {habits.filter(h => h.is_active !== false).map((habit) => (
                    <div 
                      key={habit.id} 
                      className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-white/80 to-gray-50/60 backdrop-blur-sm rounded-xl border border-gray-200/70 hover:border-primary/50 hover:shadow-md hover:bg-white/90 transition-all duration-300 group/item"
                    >
                      <span className="text-sm sm:text-base font-bold text-gray-900 truncate flex-1 mr-4 pr-2 min-w-0">
                        {habit.name}
                      </span>
                      <div className="flex items-baseline gap-1.5 flex-shrink-0">
                        <span className="text-lg sm:text-xl font-extrabold text-primary tabular-nums">
                          {habitStreaks[habit.id] || 0}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="animate-fade-in sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.4s' }}>
            <Card className="group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative text-center py-8 sm:py-10">
                <div className="text-4xl sm:text-5xl mb-4 opacity-60">🔥</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">Start Building Streaks</h3>
                <p className="text-sm text-gray-500 mb-6">Create a habit to track your daily progress</p>
                <Link href="/habits">
                  <Button size="md" variant="secondary" className="w-full sm:w-auto">
                    Create Habit
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <Link href="/checkin" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto sm:min-w-[180px] text-sm sm:text-base lg:text-lg">
            Log Check-In
          </Button>
        </Link>
        <Link href="/challenges" className="w-full sm:w-auto">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto sm:min-w-[180px] text-sm sm:text-base lg:text-lg">
            View Challenges
          </Button>
        </Link>
        <Link href="/habits" className="w-full sm:w-auto">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto sm:min-w-[180px] text-sm sm:text-base lg:text-lg">
            Habit Trackers
          </Button>
        </Link>
        <Link href="/chat" className="w-full sm:w-auto">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto sm:min-w-[180px] text-sm sm:text-base lg:text-lg">
            Open Chatbot
          </Button>
        </Link>
      </div>
      </div>
    </>
  )
}

export default function Dashboard() {
  return (
    <PageErrorBoundary>
      <DashboardContent />
    </PageErrorBoundary>
  )
}

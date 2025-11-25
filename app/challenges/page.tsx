'use client'

import { useEffect, useState, useRef } from 'react'
import Card from '@/components/Card'
import StatCard from '@/components/StatCard'
import Button from '@/components/Button'
import { toggleChallengeCompletion, getOverallStats, getTotalChallengesCompleted, getChallengeCompletions, getTodayEST } from '@/lib/storage'
import type { Stats } from '@/lib/storage'

interface Challenge {
  id: string
  title: string
  description: string
  xp: number
}

const CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'No Phone Before Bed',
    description: 'Put your phone away 1 hour before bedtime and keep it out of the bedroom.',
    xp: 20,
  },
  {
    id: '2',
    title: 'Digital Sunset',
    description: 'Turn off all screens 2 hours before your usual bedtime.',
    xp: 25,
  },
  {
    id: '3',
    title: 'Social Media Fast',
    description: 'Take a 24-hour break from all social media platforms.',
    xp: 30,
  },
  {
    id: '4',
    title: 'Tech-Free Meal',
    description: 'Enjoy at least one meal today without any devices nearby.',
    xp: 15,
  },
  {
    id: '5',
    title: 'Nature Walk',
    description: 'Go for a 30-minute walk outdoors without your phone.',
    xp: 20,
  },
  {
    id: '6',
    title: 'Read a Book',
    description: 'Spend 30 minutes reading a physical book or e-reader (not a phone).',
    xp: 15,
  },
]

interface TimerState {
  startTime: number | null
  elapsed: number
  isRunning: boolean
}

export default function ChallengesPage() {
  const [stats, setStats] = useState<Stats>({ xp: 0, currentStreak: 0, lastCompletionDate: null })
  const [totalChallenges, setTotalChallenges] = useState(0)
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())
  const [timers, setTimers] = useState<Record<string, TimerState>>({})
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({})
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    setStats(getOverallStats()) // Use overall stats for accurate XP from historical data
    setTotalChallenges(getTotalChallengesCompleted())
    
    const today = getTodayEST()
    const completions = getChallengeCompletions()
    const todayCompletions = completions
      .filter(c => c.date === today)
      .map(c => c.challengeId)
    setCompletedToday(new Set(todayCompletions))
  }, [])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(interval => {
        if (interval) clearInterval(interval)
      })
    }
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = (challengeId: string) => {
    const now = Date.now()
    setTimers(prev => ({
      ...prev,
      [challengeId]: {
        startTime: now,
        elapsed: 0,
        isRunning: true,
      },
    }))

    // Clear any existing interval for this challenge
    if (intervalRefs.current[challengeId]) {
      clearInterval(intervalRefs.current[challengeId])
    }

    // Start new interval
    intervalRefs.current[challengeId] = setInterval(() => {
      setTimers(prev => {
        const timer = prev[challengeId]
        if (!timer || !timer.isRunning || !timer.startTime) return prev
        
        const elapsed = Math.floor((Date.now() - timer.startTime) / 1000)
        return {
          ...prev,
          [challengeId]: {
            ...timer,
            elapsed,
          },
        }
      })
    }, 1000)
  }

  const stopTimer = (challengeId: string) => {
    if (intervalRefs.current[challengeId]) {
      clearInterval(intervalRefs.current[challengeId])
      delete intervalRefs.current[challengeId]
    }

    setTimers(prev => {
      const timer = prev[challengeId]
      if (!timer) return prev
      
      return {
        ...prev,
        [challengeId]: {
          ...timer,
          isRunning: false,
        },
      }
    })
  }

  const handleToggleComplete = (challenge: Challenge) => {
    // Clear any error message for this challenge
    setErrorMessages(prev => {
      const newMessages = { ...prev }
      delete newMessages[challenge.id]
      return newMessages
    })

    const result = toggleChallengeCompletion(challenge.id, challenge.xp)
    
    if (!result.success && result.message) {
      // Show error message
      setErrorMessages(prev => ({
        ...prev,
        [challenge.id]: result.message || '',
      }))
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setErrorMessages(prev => {
          const newMessages = { ...prev }
          delete newMessages[challenge.id]
          return newMessages
        })
      }, 5000)
    } else {
      // Success - update UI
      setStats(getOverallStats()) // Use overall stats for accurate XP from historical data
      setTotalChallenges(getTotalChallengesCompleted())
      
      const today = getTodayEST()
      const completions = getChallengeCompletions()
      const todayCompletions = completions
        .filter(c => c.date === today)
        .map(c => c.challengeId)
      setCompletedToday(new Set(todayCompletions))
      
      // Stop timer if running
      stopTimer(challenge.id)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="page-hero">
        <h1>Challenges</h1>
        <p>
          Complete challenges to earn XP and build your streak. Each challenge helps you develop healthier digital habits.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <StatCard
            label="Total XP"
            value={stats.xp}
            icon={<span>⭐</span>}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            label="Current Streak"
            value={`${stats.currentStreak} days`}
            icon={<span>🔥</span>}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <StatCard
            label="Challenges Completed"
            value={totalChallenges}
            icon={<span>🎯</span>}
          />
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-6">
        {CHALLENGES.map((challenge, index) => {
          const isCompleted = completedToday.has(challenge.id)
          const timer = timers[challenge.id]
          const errorMessage = errorMessages[challenge.id]
          const isTimerRunning = timer?.isRunning || false
          const elapsedTime = timer?.elapsed || 0
          
          return (
            <div
              key={challenge.id}
              className="animate-fade-in"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              <Card hover>
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Challenge Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{challenge.title}</h3>
                        <span className="px-3 sm:px-4 py-1 sm:py-1.5 gradient-primary text-white rounded-full text-xs sm:text-sm font-bold shadow-md self-start sm:self-auto whitespace-nowrap flex-shrink-0">
                          +{challenge.xp} XP
                        </span>
                      </div>
                      <p className="text-gray-700 text-base sm:text-lg leading-relaxed break-words overflow-wrap-anywhere">{challenge.description}</p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="error-message">
                      <p className="error-message-text">{errorMessage}</p>
                    </div>
                  )}

                  {/* Stopwatch Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-200">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">⏱️</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Elapsed Time</div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono">
                          {formatTime(elapsedTime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {!isTimerRunning ? (
                        <Button
                          onClick={() => startTimer(challenge.id)}
                          size="md"
                          variant="secondary"
                          className="flex-1 sm:flex-none"
                        >
                          Start Timer
                        </Button>
                      ) : (
                        <Button
                          onClick={() => stopTimer(challenge.id)}
                          size="md"
                          variant="secondary"
                          className="flex-1 sm:flex-none"
                        >
                          Stop
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Complete/Undo Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleToggleComplete(challenge)}
                      size="lg"
                      variant={isCompleted ? "secondary" : "primary"}
                      className="w-full sm:w-auto min-w-0 sm:min-w-[140px] text-base sm:text-lg"
                    >
                      {isCompleted ? 'Undo' : 'Complete'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import Card from '@/components/Card'
import StatCard from '@/components/StatCard'
import Button from '@/components/Button'
import { completeChallenge, getStats, getTotalChallengesCompleted, getChallengeCompletions, toggleChallengeSelection, isChallengeSelected, getChallengeSelections } from '@/lib/storage'
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
  const [showDeselected, setShowDeselected] = useState(false) // Toggle to show/hide deselected challenges
  const [selectedChallenges, setSelectedChallenges] = useState<Set<string>>(new Set())
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    setStats(getStats())
    setTotalChallenges(getTotalChallengesCompleted())
    
    const today = new Date().toISOString().split('T')[0]
    const completions = getChallengeCompletions()
    const todayCompletions = completions
      .filter(c => c.date === today)
      .map(c => c.challengeId)
    setCompletedToday(new Set(todayCompletions))
    
    // Load challenge selections
    setSelectedChallenges(getChallengeSelections())
  }, [])

  // Filter challenges based on selection
  // If no selections stored, all challenges are selected by default
  const allSelected = selectedChallenges.size === 0
  
  const displayedChallenges = showDeselected 
    ? CHALLENGES 
    : CHALLENGES.filter(c => allSelected || isChallengeSelected(c.id))
  
  const deselectedChallenges = allSelected 
    ? [] 
    : CHALLENGES.filter(c => !isChallengeSelected(c.id))

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

  const handleComplete = (challenge: Challenge) => {
    // Clear any error message for this challenge
    setErrorMessages(prev => {
      const newMessages = { ...prev }
      delete newMessages[challenge.id]
      return newMessages
    })

    const result = completeChallenge(challenge.id, challenge.xp)
    
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
      setStats(getStats())
      setTotalChallenges(getTotalChallengesCompleted())
      
      const today = new Date().toISOString().split('T')[0]
      const completions = getChallengeCompletions()
      const todayCompletions = completions
        .filter(c => c.date === today)
        .map(c => c.challengeId)
      setCompletedToday(new Set(todayCompletions))
      
      // Stop timer if running
      stopTimer(challenge.id)
    }
  }

  const handleToggleSelection = (challengeId: string) => {
    toggleChallengeSelection(challengeId)
    setSelectedChallenges(getChallengeSelections())
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="text-center mb-12 sm:mb-16 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gradient mb-6 tracking-tight">Challenges</h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto font-light leading-relaxed px-4">
          Complete challenges to earn XP and build your streak. Each challenge helps you develop healthier digital habits.
        </p>
      </div>

      {/* Toggle Button for Deselected Challenges */}
      {deselectedChallenges.length > 0 && (
        <div className="mb-6 flex justify-center animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <Button
            onClick={() => setShowDeselected(!showDeselected)}
            size="md"
            variant="secondary"
          >
            {showDeselected ? 'Hide Deselected' : `Show Deselected (${deselectedChallenges.length})`}
          </Button>
        </div>
      )}

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
        {displayedChallenges.map((challenge, index) => {
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
                    <div className="p-4 bg-amber-50 border-2 border-amber-200/50 rounded-2xl">
                      <p className="text-sm text-amber-900 font-medium">{errorMessage}</p>
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

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
                    <Button
                      onClick={() => handleToggleSelection(challenge.id)}
                      size="md"
                      variant="secondary"
                      className="w-full sm:w-auto"
                    >
                      {isChallengeSelected(challenge.id) ? 'Deselect' : 'Select'}
                    </Button>
                    {isCompleted ? (
                      <div className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl font-bold text-center shadow-premium text-sm sm:text-base w-full sm:w-auto">
                        ✓ Completed Today
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleComplete(challenge)}
                        size="lg"
                        className="w-full sm:w-auto min-w-0 sm:min-w-[140px] text-base sm:text-lg"
                      >
                        Complete
                      </Button>
                    )}
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

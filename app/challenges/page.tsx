'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/Card'
import StatCard from '@/components/StatCard'
import Button from '@/components/Button'
import { completeChallenge, getStats, getTotalChallengesCompleted, getChallengeCompletions } from '@/lib/storage'
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

export default function ChallengesPage() {
  const [stats, setStats] = useState<Stats>({ xp: 0, currentStreak: 0, lastCompletionDate: null })
  const [totalChallenges, setTotalChallenges] = useState(0)
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())

  useEffect(() => {
    setStats(getStats())
    setTotalChallenges(getTotalChallengesCompleted())
    
    const today = new Date().toISOString().split('T')[0]
    const completions = getChallengeCompletions()
    const todayCompletions = completions
      .filter(c => c.date === today)
      .map(c => c.challengeId)
    setCompletedToday(new Set(todayCompletions))
  }, [])

  const handleComplete = (challenge: Challenge) => {
    completeChallenge(challenge.id, challenge.xp)
    setStats(getStats())
    setTotalChallenges(getTotalChallengesCompleted())
    
    const today = new Date().toISOString().split('T')[0]
    const completions = getChallengeCompletions()
    const todayCompletions = completions
      .filter(c => c.date === today)
      .map(c => c.challengeId)
    setCompletedToday(new Set(todayCompletions))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gradient mb-4 sm:mb-6 tracking-tight">Challenges</h1>
        <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed px-2">
          Complete challenges to earn XP and build your streak. Each challenge helps you develop healthier digital habits.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
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
          return (
            <div
              key={challenge.id}
              className="animate-fade-in"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              <Card hover>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{challenge.title}</h3>
                      <span className="px-3 sm:px-4 py-1 sm:py-1.5 gradient-primary text-white rounded-full text-xs sm:text-sm font-bold shadow-md self-start sm:self-auto whitespace-nowrap flex-shrink-0">
                        +{challenge.xp} XP
                      </span>
                    </div>
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed break-words overflow-wrap-anywhere">{challenge.description}</p>
                  </div>
                  <div className="sm:ml-6 flex-shrink-0 w-full sm:w-auto">
                    {isCompleted ? (
                      <div className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-2xl font-bold text-center shadow-premium text-sm sm:text-base">
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

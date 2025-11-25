'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/Card'
import StatCard from '@/components/StatCard'
import Button from '@/components/Button'
import { getTodayCheckIn, getStats, getTotalChallengesCompleted } from '@/lib/storage'
import type { CheckIn, Stats } from '@/lib/storage'

export default function Dashboard() {
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null)
  const [stats, setStats] = useState<Stats>({ xp: 0, currentStreak: 0, lastCompletionDate: null })
  const [totalChallenges, setTotalChallenges] = useState(0)

  useEffect(() => {
    setTodayCheckIn(getTodayCheckIn())
    setStats(getStats())
    setTotalChallenges(getTotalChallengesCompleted())
  }, [])


  const moodEmojis: Record<string, string> = {
    'Very Low': '😔',
    'Low': '😕',
    'Okay': '😐',
    'Good': '🙂',
    'Great': '😊',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16 lg:mb-20 animate-fade-in">
        <div className="inline-block mb-4 sm:mb-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-gradient mb-4 sm:mb-6 tracking-tight">
            Unplug
          </h1>
        </div>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto font-light leading-relaxed px-2">
          Digital wellness for your mind and your screen time.
        </p>
      </div>

      {/* Today's Check-In Card */}
      {todayCheckIn && (
        <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-3xl">{moodEmojis[todayCheckIn.mood]}</span>
                Today's Check-In
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mood</div>
                  <div className="text-2xl font-bold text-gray-900">{todayCheckIn.mood}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Screen Time</div>
                  <div className="text-2xl font-bold text-gray-900">{todayCheckIn.screenTime}</div>
                </div>
                {todayCheckIn.note && (
                  <div className="sm:col-span-2 space-y-2 pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</div>
                    <div className="text-gray-700 leading-relaxed">{todayCheckIn.note}</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            label="Total XP"
            value={stats.xp}
            icon={<span>⭐</span>}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <StatCard
            label="Current Streak"
            value={`${stats.currentStreak} days`}
            icon={<span>🔥</span>}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <StatCard
            label="Challenges Completed"
            value={totalChallenges}
            icon={<span>🎯</span>}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-5 justify-center items-stretch sm:items-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <Link href="/checkin" className="w-full sm:w-auto sm:flex-1 sm:max-w-[200px]">
          <Button size="lg" className="w-full sm:w-auto min-w-0 sm:min-w-[200px] text-base sm:text-lg">
            Log Check-In
          </Button>
        </Link>
        <Link href="/challenges" className="w-full sm:w-auto sm:flex-1 sm:max-w-[200px]">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto min-w-0 sm:min-w-[200px] text-base sm:text-lg">
            View Challenges
          </Button>
        </Link>
        <Link href="/chat" className="w-full sm:w-auto sm:flex-1 sm:max-w-[200px]">
          <Button size="lg" variant="secondary" className="w-full sm:w-auto min-w-0 sm:min-w-[200px] text-base sm:text-lg">
            Open Chatbot
          </Button>
        </Link>
      </div>

    </div>
  )
}

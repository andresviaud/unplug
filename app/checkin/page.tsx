'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { saveCheckIn, getCheckIns, getTodayCheckIn } from '@/lib/storage'
import type { CheckIn } from '@/lib/storage'

const MOODS = [
  { value: 'Very Low', emoji: '😔' },
  { value: 'Low', emoji: '😕' },
  { value: 'Okay', emoji: '😐' },
  { value: 'Good', emoji: '🙂' },
  { value: 'Great', emoji: '😊' },
]

const SCREEN_TIME_OPTIONS = ['<2h', '2–4h', '4–6h', '6+ hours']

export default function CheckInPage() {
  const router = useRouter()
  const [mood, setMood] = useState('')
  const [screenTime, setScreenTime] = useState('')
  const [note, setNote] = useState('')
  const [history, setHistory] = useState<CheckIn[]>([])

  useEffect(() => {
    const today = getTodayCheckIn()
    if (today) {
      setMood(today.mood)
      setScreenTime(today.screenTime)
      setNote(today.note || '')
    }
    
    const allCheckIns = getCheckIns()
    setHistory(allCheckIns.sort((a, b) => b.date.localeCompare(a.date)))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mood || !screenTime) {
      alert('Please select both mood and screen time.')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    saveCheckIn({
      date: today,
      mood,
      screenTime,
      note: note.trim() || undefined,
    })

    router.push('/')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const moodEmojis: Record<string, string> = {
    'Very Low': '😔',
    'Low': '😕',
    'Okay': '😐',
    'Good': '🙂',
    'Great': '😊',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gradient mb-6 tracking-tight">Daily Check-In</h1>
        <p className="text-xl text-gray-700 font-light">How are you feeling today?</p>
      </div>

      <Card className="mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Mood Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wider">
              How's your mood today?
            </label>
            <div className="flex flex-wrap gap-4">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-500 ${
                    mood === m.value
                      ? 'gradient-primary text-white shadow-premium scale-110'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 border border-gray-200'
                  }`}
                >
                  <span className="mr-2 text-2xl">{m.emoji}</span>
                  {m.value}
                </button>
              ))}
            </div>
          </div>

          {/* Screen Time Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wider">
              How much screen time did you have today?
            </label>
            <div className="flex flex-wrap gap-4">
              {SCREEN_TIME_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScreenTime(option)}
                  className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-500 ${
                    screenTime === option
                      ? 'gradient-primary text-white shadow-premium scale-110'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-lg hover:scale-105 border border-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label htmlFor="note" className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Optional Note
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-white/50 backdrop-blur-sm focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none text-gray-800 placeholder-gray-400"
              placeholder="How did your day go? Any reflections?"
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Save Check-In
          </Button>
        </form>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Check-In History</h2>
          <Card>
            <div className="space-y-6">
              {history.map((checkIn, index) => (
                <div key={checkIn.date}>
                  {index > 0 && <div className="border-t border-gray-200 my-6" />}
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{moodEmojis[checkIn.mood]}</div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                        {formatDate(checkIn.date)}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mb-2">
                        <span className="font-bold text-lg text-gray-900">{checkIn.mood}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-700 font-medium">{checkIn.screenTime}</span>
                      </div>
                      {checkIn.note && (
                        <div className="mt-3 text-gray-600 leading-relaxed bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                          {checkIn.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

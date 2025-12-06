'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { saveCheckIn, getTodayCheckIn, getTodayEST, type DailyEntry } from '@/lib/storage-supabase'

const MOODS = [
  { value: 1, label: 'Very Low', emoji: '😔' },
  { value: 2, label: 'Low', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😊' },
]

const JOURNALING_PROMPTS = [
  "What's on your mind today?",
  "How are you feeling right now?",
  "What went well today?",
  "What challenged you today?",
  "What are you grateful for?",
  "What did you learn about yourself today?",
  "How did you take care of yourself today?",
  "What would you like to remember about today?",
]

export default function CheckInPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mood, setMood] = useState<number | null>(null)
  const [journalEntry, setJournalEntry] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const getRandomPrompt = () => {
    return JOURNALING_PROMPTS[Math.floor(Math.random() * JOURNALING_PROMPTS.length)]
  }
  const [currentPrompt, setCurrentPrompt] = useState(() => getRandomPrompt())

  useEffect(() => {
    const init = async () => {
      try {
        // Check if user is logged in
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          // Load today's check-in if user is logged in
          const today = await getTodayCheckIn()
          if (today) {
            setMood(today.mood || null)
            setJournalEntry(today.journal_text || '')
            setWordCount(today.journal_text ? today.journal_text.trim().split(/\s+/).filter(Boolean).length : 0)
          }
        }
      } catch (error) {
        console.error('Error initializing:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleJournalChange = (value: string) => {
    setJournalEntry(value)
    setWordCount(value.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!journalEntry.trim()) {
      alert('Please write something in your journal entry.')
      return
    }

    if (!mood) {
      alert('Please select your mood.')
      return
    }

    try {
      setSubmitting(true)
      await saveCheckIn({
        mood: mood,
        journal_text: journalEntry.trim(),
      })
      alert('Check-in saved successfully!')
      router.push('/')
    } catch (error: any) {
      console.error('Error saving check-in:', error)
      alert('Error saving check-in: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <Card>
            <div className="text-center space-y-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Please Sign In</h1>
              <p className="text-gray-600 text-base sm:text-lg">You need to be logged in to use the check-in feature.</p>
              <Button onClick={() => router.push('/auth/login')} size="lg">
                Go to Sign In
              </Button>
            </div>
          </Card>
        </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="page-hero">
        <h1>Journal</h1>
        <p>
          Reflect on your day, track your progress, and build self-awareness through daily journaling.
        </p>
      </div>

      <Card className="mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mood Selector */}
          <div className="pb-8 border-b-2 border-gray-200/60">
            {/* Mood Selector - Required */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-500 mb-4 sm:mb-5 uppercase tracking-wider">
                Mood *
              </label>
              <div className="flex flex-wrap gap-3">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`px-5 py-3 rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 ${
                      mood === m.value
                        ? 'gradient-primary text-white shadow-premium scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    <span className="mr-2 text-lg">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Journal Entry - Main Focus */}
          <div>
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <label htmlFor="journal" className="block text-sm sm:text-base font-bold text-gray-700 uppercase tracking-wider">
                Journal Entry
              </label>
              <div className="flex items-center gap-4 sm:gap-5">
                <button
                  type="button"
                  onClick={() => setCurrentPrompt(getRandomPrompt())}
                  className="text-xs sm:text-sm text-primary hover:text-primary/80 font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
                >
                  New Prompt
                </button>
                <span className="text-xs sm:text-sm text-gray-600 font-medium">{wordCount} words</span>
              </div>
            </div>
            
            {/* Prompt Suggestion */}
            <div className="mb-5 sm:mb-6 p-4 sm:p-5 bg-gradient-to-br from-primary/10 to-indigo-50/50 border-2 border-primary/20 rounded-2xl shadow-soft">
              <p className="text-sm sm:text-base text-gray-800 font-medium">💭 {currentPrompt}</p>
            </div>

            <textarea
              id="journal"
              value={journalEntry}
              onChange={(e) => handleJournalChange(e.target.value)}
              rows={14}
              className="w-full px-6 sm:px-7 py-5 sm:py-6 rounded-2xl border-2 border-gray-200/60 bg-white/95 backdrop-blur-sm focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none text-gray-900 placeholder-gray-400 text-base sm:text-lg leading-relaxed font-normal shadow-soft"
              placeholder="Start writing... Share your thoughts, feelings, experiences, or reflections from today. There's no right or wrong way to journal."
              autoFocus
            />
            <p className="mt-3 text-xs sm:text-sm text-gray-500 font-medium">
              Your journal entries are private and saved securely in your account.
            </p>
          </div>

            <Button type="submit" size="lg" className="w-full" disabled={!journalEntry.trim() || !mood || submitting}>
              {submitting ? 'Saving...' : 'Save Check-In'}
            </Button>
        </form>
      </Card>

    </div>
  )
}

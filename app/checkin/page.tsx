'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { saveCheckIn, getCheckIns, getTodayCheckIn, getTodayEST } from '@/lib/storage'
import type { CheckIn } from '@/lib/storage'

const MOODS = [
  { value: 'Very Low', emoji: '😔' },
  { value: 'Low', emoji: '😕' },
  { value: 'Okay', emoji: '😐' },
  { value: 'Good', emoji: '🙂' },
  { value: 'Great', emoji: '😊' },
]

const SCREEN_TIME_OPTIONS = ['<2h', '2–4h', '4–6h', '6+ hours']

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
  const [mood, setMood] = useState('')
  const [screenTime, setScreenTime] = useState('')
  const [journalEntry, setJournalEntry] = useState('')
  const [history, setHistory] = useState<CheckIn[]>([])
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    const today = getTodayCheckIn()
    if (today) {
      setMood(today.mood)
      setScreenTime(today.screenTime)
      setJournalEntry(today.note || '')
      setWordCount(today.note ? today.note.trim().split(/\s+/).filter(Boolean).length : 0)
    }
    
    const allCheckIns = getCheckIns()
    setHistory(allCheckIns.sort((a, b) => b.date.localeCompare(a.date)))
  }, [])

  const handleJournalChange = (value: string) => {
    setJournalEntry(value)
    setWordCount(value.trim().split(/\s+/).filter(Boolean).length)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!journalEntry.trim()) {
      alert('Please write something in your journal entry.')
      return
    }

    const today = getTodayEST()
    saveCheckIn({
      date: today,
      mood: mood || 'Okay', // Default mood if not selected
      screenTime: screenTime || '4–6h', // Default screen time if not selected
      note: journalEntry.trim(),
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

  const getRandomPrompt = () => {
    return JOURNALING_PROMPTS[Math.floor(Math.random() * JOURNALING_PROMPTS.length)]
  }

  const [currentPrompt, setCurrentPrompt] = useState(getRandomPrompt())

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="page-hero">
        <h1>Journal</h1>
        <p>
          Reflect on your day, track your progress, and build self-awareness through daily journaling.
        </p>
      </div>

      <Card className="mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Indicators - Optional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-200">
            {/* Mood Selector - Optional */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                Mood (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    className={`px-3 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                      mood === m.value
                        ? 'gradient-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{m.emoji}</span>
                    {m.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Time - Optional */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                Screen Time (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {SCREEN_TIME_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setScreenTime(option)}
                    className={`px-3 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                      screenTime === option
                        ? 'gradient-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Journal Entry - Main Focus */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label htmlFor="journal" className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Journal Entry
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentPrompt(getRandomPrompt())}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  New Prompt
                </button>
                <span className="text-xs text-gray-500">{wordCount} words</span>
              </div>
            </div>
            
            {/* Prompt Suggestion */}
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-sm text-gray-700 italic">💭 {currentPrompt}</p>
            </div>

            <textarea
              id="journal"
              value={journalEntry}
              onChange={(e) => handleJournalChange(e.target.value)}
              rows={12}
              className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 bg-white/90 backdrop-blur-sm focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none text-gray-900 placeholder-gray-400 text-base leading-relaxed font-normal"
              placeholder="Start writing... Share your thoughts, feelings, experiences, or reflections from today. There's no right or wrong way to journal."
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              Your journal entries are private and saved locally on your device.
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={!journalEntry.trim()}>
            Save Journal Entry
          </Button>
        </form>
      </Card>

      {/* Journal History */}
      {history.length > 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 break-words">Journal History</h2>
          <div className="space-y-6">
            {history.map((checkIn, index) => {
              const entryWordCount = checkIn.note ? checkIn.note.trim().split(/\s+/).filter(Boolean).length : 0
              return (
                <Card key={checkIn.date} hover={false}>
                  <div className="space-y-4">
                    {/* Date Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        {moodEmojis[checkIn.mood] && (
                          <span className="text-2xl">{moodEmojis[checkIn.mood]}</span>
                        )}
                        <h3 className="text-lg font-bold text-gray-900">
                          {formatDate(checkIn.date)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {checkIn.mood && checkIn.screenTime && (
                          <>
                            <span>{checkIn.mood}</span>
                            <span>•</span>
                            <span>{checkIn.screenTime}</span>
                            {entryWordCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{entryWordCount} words</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Journal Entry Content */}
                    {checkIn.note && (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                          {checkIn.note}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

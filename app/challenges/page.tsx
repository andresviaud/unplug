'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import StatCard from '@/components/StatCard'
import Button from '@/components/Button'
import Celebration from '@/components/Celebration'
import { useAuth } from '@/lib/useAuth'
import { 
  toggleChallengeCompletion, 
  getChallengeCompletions, 
  getTodayEST,
  getUserStats,
  getHabits,
  type Habit,
  type UserStats
} from '@/lib/storage-supabase'

interface Challenge {
  id: string
  title: string
  description: string
  xp: number
}

// Generate exactly 1 challenge per habit per day (deterministic based on date)
// Returns empty array if no habits exist
function generateChallengesFromHabits(habits: Habit[]): Challenge[] {
  if (habits.length === 0) {
    return [] // No challenges if no habits
  }

  const challenges: Challenge[] = []
  const today = new Date()
  // Use day of year (1-365) to select which challenge variant to show
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)

  habits.forEach((habit) => {
    const habitName = habit.name.toLowerCase()
    
    // Get all possible challenges for this habit type
    let possibleChallenges: Challenge[] = []
    
    if (habitName.includes('exercise') || habitName.includes('workout') || habitName.includes('gym')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Pre-Workout Nutrition',
          description: 'Eat a healthy meal or snack 30-60 minutes before your workout to fuel your body.',
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Post-Workout Stretch',
          description: 'Spend 10 minutes stretching after your workout to improve recovery and flexibility.',
          xp: 20,
        },
        {
          id: `${habit.id}-3`,
          title: 'Track Your Workout',
          description: 'Log your sets, reps, or duration to track your progress over time.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('meditation') || habitName.includes('mindfulness') || habitName.includes('yoga')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Create a Meditation Space',
          description: 'Set up a quiet, comfortable space dedicated to your practice.',
          xp: 20,
        },
        {
          id: `${habit.id}-2`,
          title: 'Practice Gratitude',
          description: 'Write down 3 things you\'re grateful for today to enhance your mindfulness practice.',
          xp: 25,
        },
        {
          id: `${habit.id}-3`,
          title: 'Deep Breathing Exercise',
          description: 'Take 5 minutes to practice deep breathing: 4 seconds in, 4 seconds hold, 4 seconds out.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('read') || habitName.includes('book') || habitName.includes('learning')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Take Reading Notes',
          description: 'Write down 3 key insights or quotes from what you read today.',
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Discuss What You Learned',
          description: 'Share something you learned today with a friend or write about it in your journal.',
          xp: 30,
        },
        {
          id: `${habit.id}-3`,
          title: 'Create a Reading List',
          description: 'Add 3 new books or articles to your reading list based on your interests.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('water') || habitName.includes('drink') || habitName.includes('hydration')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Start Your Day with Water',
          description: 'Drink a full glass of water first thing in the morning before coffee or breakfast.',
          xp: 20,
        },
        {
          id: `${habit.id}-2`,
          title: 'Eat Water-Rich Foods',
          description: 'Include fruits and vegetables with high water content (like cucumber, watermelon, or oranges) in at least one meal.',
          xp: 25,
        },
        {
          id: `${habit.id}-3`,
          title: 'Set Hydration Reminders',
          description: 'Set 3 reminders throughout the day to drink water and actually drink when they go off.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('sleep') || habitName.includes('bedtime') || habitName.includes('rest')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Create a Bedtime Routine',
          description: 'Follow a 30-minute wind-down routine before bed (reading, stretching, or journaling).',
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Keep Your Room Cool',
          description: 'Set your bedroom temperature to 65-68°F (18-20°C) for optimal sleep.',
          xp: 20,
        },
        {
          id: `${habit.id}-3`,
          title: 'Avoid Caffeine After 2 PM',
          description: 'Skip coffee, tea, or energy drinks after 2 PM to improve sleep quality.',
          xp: 25,
        },
      ]
    } else {
      // Generic complementary challenges for any habit
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Reflect on Your Progress',
          description: `Take 5 minutes to journal about how your ${habit.name} habit is helping you grow.`,
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Share Your Journey',
          description: `Tell someone about your ${habit.name} habit and why it matters to you.`,
          xp: 30,
        },
        {
          id: `${habit.id}-3`,
          title: 'Plan for Tomorrow',
          description: `Write down when and how you'll do your ${habit.name} habit tomorrow.`,
          xp: 20,
        },
      ]
    }

    // Select exactly 1 challenge per habit based on day of year + habit ID
    // This ensures consistency: same habit gets same challenge on same day
    const challengeIndex = (dayOfYear + habit.id.charCodeAt(0)) % possibleChallenges.length
    challenges.push(possibleChallenges[challengeIndex])
  })

  return challenges
}

export default function ChallengesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<UserStats>({ total_xp: 0, current_streak: 0, last_completion_date: null })
  const [totalChallenges, setTotalChallenges] = useState(0)
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({})
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [celebration, setCelebration] = useState<{ show: boolean; message: string }>({ show: false, message: '' })

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [userStats, completions, habits] = await Promise.all([
          getUserStats(),
          getChallengeCompletions(),
          getHabits(),
        ])
        
        setStats(userStats)
        setTotalChallenges(completions.length)
        
        // Generate personalized challenges from habits
        const personalizedChallenges = generateChallengesFromHabits(habits)
        setChallenges(personalizedChallenges)
        
        const today = getTodayEST()
        const todayCompletions = completions
          .filter(c => c.date === today)
          .map(c => c.challenge_id)
        setCompletedToday(new Set(todayCompletions))
      } catch (error) {
        console.error('Error loading challenges data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadData()
    }
  }, [user, authLoading])


  const handleToggleComplete = async (challenge: Challenge) => {
    // Clear any error message for this challenge
    setErrorMessages(prev => {
      const newMessages = { ...prev }
      delete newMessages[challenge.id]
      return newMessages
    })

    try {
      const result = await toggleChallengeCompletion(challenge.id, challenge.xp)
      
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
        // Success - update UI (streak comes from habits, not challenges)
        const [userStats, completions] = await Promise.all([
          getUserStats(),
          getChallengeCompletions(),
        ])
        
        setStats(userStats)
        setTotalChallenges(completions.length)
        
        const today = getTodayEST()
        const todayCompletions = completions
          .filter(c => c.date === today)
          .map(c => c.challenge_id)
        setCompletedToday(new Set(todayCompletions))
        
        // Celebrate completion!
        if (result.isCompleted) {
          setCelebration({ show: true, message: `Challenge Complete! +${challenge.xp} XP 🎉` })
        }
      }
    } catch (error: any) {
      console.error('Error toggling challenge:', error)
      setErrorMessages(prev => ({
        ...prev,
        [challenge.id]: error?.message || 'Failed to complete challenge',
      }))
    }
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
        <Card>
          <div className="text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Please Sign In</h1>
            <p className="text-gray-600 text-base sm:text-lg">You need to be logged in to view challenges.</p>
            <Button onClick={() => router.push('/auth/login')} size="lg">
              Go to Sign In
            </Button>
          </div>
        </Card>
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
      <div className="page-hero">
        <h1>Challenges</h1>
        <p>
          Complete complementary challenges to earn extra XP! These challenges support your habits but don't count toward your streak. Streaks come only from completing your habits.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 mb-10 sm:mb-12 lg:mb-16">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <StatCard
            label="Total XP"
            value={stats.total_xp}
            icon={<span>⭐</span>}
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StatCard
            label="Challenges Completed"
            value={totalChallenges}
            icon={<span>🎯</span>}
          />
        </div>
      </div>

      {/* Challenges List */}
      {challenges.length === 0 ? (
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative text-center py-12 sm:py-16">
            <div className="text-6xl sm:text-7xl mb-6 opacity-60 animate-float">🎯</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">No Challenges Yet</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Create habits to unlock personalized daily challenges that help you grow beyond your core habits.
            </p>
            <Button onClick={() => router.push('/habits')} size="lg" className="shadow-premium">
              Create Habits
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-5 sm:space-y-6 lg:space-y-7">
          {challenges.map((challenge, index) => {
          const isCompleted = completedToday.has(challenge.id)
          const errorMessage = errorMessages[challenge.id]
          
          return (
            <div
              key={challenge.id}
              className="animate-fade-in"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              <Card hover className="group">
                <div className="flex flex-col gap-5 sm:gap-6 lg:gap-7">
                  {/* Challenge Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words tracking-tight group-hover:text-primary transition-colors duration-300">{challenge.title}</h3>
                        <span className="px-4 sm:px-5 py-2 sm:py-2.5 gradient-primary text-white rounded-full text-sm sm:text-base font-bold shadow-premium self-start sm:self-auto whitespace-nowrap flex-shrink-0 transform group-hover:scale-105 transition-transform duration-300">
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

                  {/* Complete/Undo Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => handleToggleComplete(challenge)}
                      size="lg"
                      variant={isCompleted ? "secondary" : "primary"}
                      className="w-full sm:w-auto sm:min-w-[160px] text-base sm:text-lg"
                    >
                      {isCompleted ? 'Undo' : 'Complete Challenge'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )
        })}
        </div>
      )}
      </div>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import { useAuth } from '@/lib/useAuth'
import { getCompletedAnimals, getAllAnimals, isAnimalCompleted, type Animal, type UserAnimal } from '@/lib/storage-supabase'

export default function TrophiesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [completedAnimals, setCompletedAnimals] = useState<UserAnimal[]>([])
  const [allAnimals, setAllAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const [completed, all] = await Promise.all([
          getCompletedAnimals(),
          getAllAnimals(),
        ])
        setCompletedAnimals(completed)
        setAllAnimals(all)
      } catch (error) {
        console.error('Error loading trophies:', error)
      } finally {
        setLoading(false)
      }
  }

    if (!authLoading) {
      loadData()
    }
  }, [user, authLoading])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Animal emojis for better visual recognition (case-insensitive matching)
  const animalEmojis: Record<string, string> = {
    'bird': '🐦',
    'fox': '🦊',
    'deer': '🦌',
    'whale': '🐋',
    'elephant': '🐘',
    'lion': '🦁',
    'dolphin': '🐬',
    'bear': '🐻',
    'tiger': '🐯',
    'wolf': '🐺',
  }

  // Helper function to get emoji (case-insensitive)
  const getAnimalEmoji = (animalName: string): string => {
    const nameLower = (animalName || '').toLowerCase().trim()
    return animalEmojis[nameLower] || '🎨'
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
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Please Sign In</h1>
            <p className="text-gray-600">You need to be logged in to view your trophy collection.</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 font-semibold"
            >
              Go to Sign In
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const completedAnimalIds = new Set(completedAnimals.map(a => a.animal_id))
  const lockedAnimals = allAnimals.filter(a => !completedAnimalIds.has(a.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="page-hero">
        <h1>🏆 Trophy Room</h1>
        <p>
          Your collection of completed animals. Each trophy represents your dedication and progress!
        </p>
      </div>

      {/* Completed Trophies */}
      {completedAnimals.length > 0 ? (
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-8 sm:mb-10 tracking-tight">Completed Trophies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {completedAnimals.map((userAnimal, index) => {
              const animal = userAnimal.animals as Animal
              const emoji = getAnimalEmoji(animal.name)
              return (
                <Card
                  key={userAnimal.id}
                  hover
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-center">
                    <div className="text-7xl sm:text-8xl mb-6">{emoji}</div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">{animal.name}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 font-medium">
                      Completed on {formatDate(userAnimal.completed_at)}
                    </p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-bold border-2 border-green-200/60">
                      <span>✅</span>
                      <span>Completed</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <Card>
            <div className="text-center py-12 sm:py-16">
              <div className="text-7xl sm:text-8xl mb-6">🏆</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">No Trophies Yet</h2>
              <p className="text-gray-600 mb-8 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                Complete daily challenges to fill your animal nodes and earn your first trophy!
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-4 bg-primary text-white rounded-2xl hover:opacity-90 font-bold text-base sm:text-lg shadow-premium hover:shadow-premium-lg transition-all duration-300"
              >
                Go to Dashboard
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Locked Animals (Future) */}
      {lockedAnimals.length > 0 && (
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-8 sm:mb-10 tracking-tight">Upcoming Animals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {lockedAnimals.map((animal, index) => {
              const emoji = getAnimalEmoji(animal.name)
              return (
                <Card
                  key={animal.id}
                  className="animate-fade-in opacity-60"
                  style={{ animationDelay: `${(completedAnimals.length + index) * 0.1}s` }}
                >
                  <div className="text-center">
                    <div className="text-7xl sm:text-8xl mb-6 filter grayscale opacity-70">{emoji}</div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">{animal.name}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-6 font-medium">
                      {animal.total_nodes} nodes to complete
                    </p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-200/80 text-gray-600 rounded-full text-sm font-bold border-2 border-gray-300/60">
                      <span>🔒</span>
                      <span>Locked</span>
                    </div>
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


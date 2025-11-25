export interface CheckIn {
  date: string
  mood: string
  screenTime: string
  note?: string
}

export interface ChallengeCompletion {
  challengeId: string
  date: string
}

export interface Stats {
  xp: number
  currentStreak: number
  lastCompletionDate: string | null
}

const STORAGE_KEYS = {
  CHECKINS: 'unplug_checkins',
  CHALLENGES: 'unplug_challenges',
  STATS: 'unplug_stats',
} as const

export function getCheckIns(): CheckIn[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.CHECKINS)
  return data ? JSON.parse(data) : []
}

export function saveCheckIn(checkIn: CheckIn): void {
  if (typeof window === 'undefined') return
  const checkIns = getCheckIns()
  const existingIndex = checkIns.findIndex(c => c.date === checkIn.date)
  
  if (existingIndex >= 0) {
    checkIns[existingIndex] = checkIn
  } else {
    checkIns.push(checkIn)
  }
  
  localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkIns))
}

export function getTodayCheckIn(): CheckIn | null {
  const today = new Date().toISOString().split('T')[0]
  const checkIns = getCheckIns()
  return checkIns.find(c => c.date === today) || null
}

export function getChallengeCompletions(): ChallengeCompletion[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES)
  return data ? JSON.parse(data) : []
}

export function completeChallenge(challengeId: string, xpReward: number): void {
  if (typeof window === 'undefined') return
  
  const today = new Date().toISOString().split('T')[0]
  const completions = getChallengeCompletions()
  
  // Check if already completed today
  const alreadyCompleted = completions.some(
    c => c.challengeId === challengeId && c.date === today
  )
  
  if (alreadyCompleted) return
  
  completions.push({ challengeId, date: today })
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(completions))
  
  // Update stats
  const stats = getStats()
  stats.xp += xpReward
  
  // Update streak
  const lastDate = stats.lastCompletionDate
  const todayDate = new Date(today)
  
  if (lastDate) {
    const lastCompletionDate = new Date(lastDate)
    const daysDiff = Math.floor((todayDate.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 1) {
      // Consecutive day
      stats.currentStreak += 1
    } else if (daysDiff > 1) {
      // Streak broken
      stats.currentStreak = 1
    }
    // If daysDiff === 0, same day, don't change streak
  } else {
    // First completion
    stats.currentStreak = 1
  }
  
  stats.lastCompletionDate = today
  saveStats(stats)
}

export function getStats(): Stats {
  if (typeof window === 'undefined') return { xp: 0, currentStreak: 0, lastCompletionDate: null }
  const data = localStorage.getItem(STORAGE_KEYS.STATS)
  return data ? JSON.parse(data) : { xp: 0, currentStreak: 0, lastCompletionDate: null }
}

export function saveStats(stats: Stats): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))
}

export function getTotalChallengesCompleted(): number {
  const completions = getChallengeCompletions()
  return completions.length
}

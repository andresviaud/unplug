export interface CheckIn {
  date: string
  mood: string
  screenTime: string
  note?: string
}

export interface ChallengeCompletion {
  challengeId: string
  date: string
  xp?: number // XP earned from this challenge (for historical tracking)
}

export interface Stats {
  xp: number
  currentStreak: number
  lastCompletionDate: string | null
}

const STORAGE_KEYS = {
  CHECKINS: 'cambiora_checkins',
  CHALLENGES: 'cambiora_challenges',
  STATS: 'cambiora_stats',
  HABITS: 'cambiora_habits',
  HABIT_LOGS: 'cambiora_habit_logs',
} as const

export interface Habit {
  id: string
  name: string
  description?: string
  xpPerDay: number
  createdAt: string
  startDate: string // Date when user started the habit (can be in the past)
  color?: string
}

export interface HabitLog {
  habitId: string
  date: string
}

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
  
  completions.push({ challengeId, date: today, xp: xpReward })
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

export interface UserData {
  checkins: CheckIn[]
  challenges: ChallengeCompletion[]
  stats: Stats
}

export function exportUserData(): UserData {
  return {
    checkins: getCheckIns(),
    challenges: getChallengeCompletions(),
    stats: getStats(),
  }
}

export function importUserData(data: UserData): void {
  if (typeof window === 'undefined') return
  
  // Validate data structure
  if (!data.checkins || !data.challenges || !data.stats) {
    throw new Error('Invalid data format')
  }
  
  // Import data
  localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(data.checkins))
  localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(data.challenges))
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats))
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.CHECKINS)
  localStorage.removeItem(STORAGE_KEYS.CHALLENGES)
  localStorage.removeItem(STORAGE_KEYS.STATS)
  localStorage.removeItem(STORAGE_KEYS.HABITS)
  localStorage.removeItem(STORAGE_KEYS.HABIT_LOGS)
}

// Habit Tracker Functions
export function getHabits(): Habit[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.HABITS)
  const habits: Habit[] = data ? JSON.parse(data) : []
  
  // Migrate old habits that don't have startDate
  let needsUpdate = false
  const today = new Date().toISOString().split('T')[0]
  const migratedHabits = habits.map(habit => {
    if (!habit.startDate) {
      needsUpdate = true
      return {
        ...habit,
        startDate: habit.createdAt ? habit.createdAt.split('T')[0] : today,
      }
    }
    return habit
  })
  
  if (needsUpdate) {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(migratedHabits))
  }
  
  return needsUpdate ? migratedHabits : habits
}

export function createHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
  if (typeof window === 'undefined') throw new Error('Cannot create habit on server')
  
  const today = new Date().toISOString().split('T')[0]
  const startDate = habit.startDate || today
  
  const newHabit: Habit = {
    ...habit,
    id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    startDate: startDate,
  }
  
  const habits = getHabits()
  habits.push(newHabit)
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits))
  
  // If start date is in the past, don't auto-log (user can manually log if they want)
  // The start date is just for tracking when they actually started
  
  return newHabit
}

export function deleteHabit(habitId: string): void {
  if (typeof window === 'undefined') return
  
  const habits = getHabits().filter(h => h.id !== habitId)
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits))
  
  // Also remove all logs for this habit
  const logs = getHabitLogs().filter(l => l.habitId !== habitId)
  localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs))
}

export function getHabitLogs(): HabitLog[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS)
  return data ? JSON.parse(data) : []
}

export function logHabit(habitId: string): void {
  if (typeof window === 'undefined') return
  
  const today = new Date().toISOString().split('T')[0]
  const logs = getHabitLogs()
  
  // Check if already logged today
  const alreadyLogged = logs.some(l => l.habitId === habitId && l.date === today)
  if (alreadyLogged) return
  
  logs.push({ habitId, date: today })
  localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs))
  
  // Award XP and update stats
  const habit = getHabits().find(h => h.id === habitId)
  if (habit) {
    const stats = getStats()
    stats.xp += habit.xpPerDay
    
    // Update streak for this specific habit
    const habitLogs = logs.filter(l => l.habitId === habitId).sort((a, b) => a.date.localeCompare(b.date))
    if (habitLogs.length > 0) {
      let streak = 1
      for (let i = habitLogs.length - 1; i > 0; i--) {
        const currentDate = new Date(habitLogs[i].date)
        const prevDate = new Date(habitLogs[i - 1].date)
        const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 1) {
          streak++
        } else {
          break
        }
      }
      // Update overall streak if this is the longest
      if (streak > stats.currentStreak) {
        stats.currentStreak = streak
        stats.lastCompletionDate = today
      }
    }
    
    saveStats(stats)
  }
}

export function getHabitStreak(habitId: string): number {
  const logs = getHabitLogs()
    .filter(l => l.habitId === habitId)
    .sort((a, b) => b.date.localeCompare(a.date)) // Most recent first
  
  if (logs.length === 0) return 0
  
  const today = new Date().toISOString().split('T')[0]
  let streak = 0
  let expectedDateStr = today
  
  // Check if logged today
  if (logs[0]?.date === today) {
    streak = 1
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - 1)
    expectedDateStr = expectedDate.toISOString().split('T')[0]
  } else {
    // Start from yesterday if not logged today
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    expectedDateStr = yesterday.toISOString().split('T')[0]
  }
  
  // Count consecutive days
  for (let i = streak > 0 ? 1 : 0; i < logs.length; i++) {
    if (logs[i].date === expectedDateStr) {
      streak++
      const date = new Date(expectedDateStr)
      date.setDate(date.getDate() - 1)
      expectedDateStr = date.toISOString().split('T')[0]
    } else {
      break
    }
  }
  
  return streak
}

export function isHabitLoggedToday(habitId: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  const logs = getHabitLogs()
  return logs.some(l => l.habitId === habitId && l.date === today)
}

export interface HistoricalXP {
  date: string
  xp: number
  source: string // 'habit' or 'challenge'
  sourceName: string
}

export function getHistoricalXP(): HistoricalXP[] {
  if (typeof window === 'undefined') return []
  
  const historicalXP: HistoricalXP[] = []
  
  // Get XP from habit logs
  const habits = getHabits()
  const habitLogs = getHabitLogs()
  
  habitLogs.forEach(log => {
    const habit = habits.find(h => h.id === log.habitId)
    if (habit) {
      historicalXP.push({
        date: log.date,
        xp: habit.xpPerDay,
        source: 'habit',
        sourceName: habit.name,
      })
    }
  })
  
  // Get XP from challenge completions
  const challengeCompletions = getChallengeCompletions()
  challengeCompletions.forEach(completion => {
    historicalXP.push({
      date: completion.date,
      xp: completion.xp || 20, // Use stored XP or default to 20
      source: 'challenge',
      sourceName: `Challenge ${completion.challengeId}`,
    })
  })
  
  // Sort by date (most recent first)
  return historicalXP.sort((a, b) => b.date.localeCompare(a.date))
}

export function getHistoricalXPByDateRange(startDate: string, endDate: string): HistoricalXP[] {
  const allXP = getHistoricalXP()
  return allXP.filter(xp => xp.date >= startDate && xp.date <= endDate)
}

export function getTotalHistoricalXP(): number {
  const allXP = getHistoricalXP()
  return allXP.reduce((total, xp) => total + xp.xp, 0)
}

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
  CHALLENGE_SELECTIONS: 'cambiora_challenge_selections', // Which challenges are selected/active
} as const

/**
 * Get today's date in Eastern Time (EST/EDT) as YYYY-MM-DD string
 * Eastern Time is UTC-5 (EST) or UTC-4 (EDT during daylight saving)
 * Uses America/New_York timezone which automatically handles EST/EDT transitions
 */
export function getTodayEST(): string {
  const now = new Date()
  
  // Use Intl.DateTimeFormat to get date components in Eastern Time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  // Format: "MM/DD/YYYY" or "M/D/YYYY"
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')?.value || ''
  const month = parts.find(p => p.type === 'month')?.value?.padStart(2, '0') || ''
  const day = parts.find(p => p.type === 'day')?.value?.padStart(2, '0') || ''
  
  return `${year}-${month}-${day}`
}

export interface Habit {
  id: string
  name: string
  description?: string
  xpPerDay: number
  createdAt: string
  startDate: string // Date when user started the habit (can be in the past)
  color?: string
  isActive?: boolean // Whether the habit is currently selected/active (default: true)
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
  const today = getTodayEST()
  const checkIns = getCheckIns()
  return checkIns.find(c => c.date === today) || null
}

export function getChallengeCompletions(): ChallengeCompletion[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES)
  return data ? JSON.parse(data) : []
}

export function toggleChallengeCompletion(challengeId: string, xpReward: number): { success: boolean; message?: string; isCompleted: boolean } {
  if (typeof window === 'undefined') return { success: false, message: 'Cannot toggle challenge on server', isCompleted: false }
  
  const today = getTodayEST()
  const completions = getChallengeCompletions()
  
  // Check if already completed today
  const completionIndex = completions.findIndex(
    c => c.challengeId === challengeId && c.date === today
  )
  
  const stats = getStats()
  
  if (completionIndex >= 0) {
    // Already completed - uncomplete it
    const completion = completions[completionIndex]
    completions.splice(completionIndex, 1)
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(completions))
    
    // Note: XP is calculated from historical data, not stored in stats
    // Removing the completion automatically removes XP from calculations
    
    // Recalculate overall streak
    const overallStreak = getOverallStreak()
    stats.currentStreak = overallStreak
    
    // Note: We don't adjust streak when uncompleting, as it's based on calendar days
    // The streak logic will recalculate on next completion
    
    saveStats(stats)
    return { success: true, isCompleted: false }
  } else {
    // Not completed - complete it
    completions.push({ challengeId, date: today, xp: xpReward })
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(completions))
    
    // Note: XP is calculated from historical data, not stored in stats
    // Adding the completion automatically adds XP to calculations
    
    // Update streak logic: day-by-day basis
    // Only ONE completion per calendar day counts toward the streak
    const lastDate = stats.lastCompletionDate
    
    if (lastDate) {
      // If today === lastCompletionDate: don't increment streak (already counted today)
      if (today === lastDate) {
        // Same day - streak already counted, don't change it
        // But still save the completion and XP
      } else {
        // Calculate days difference
        const todayDate = new Date(today)
        todayDate.setHours(0, 0, 0, 0)
        const lastCompletionDate = new Date(lastDate)
        lastCompletionDate.setHours(0, 0, 0, 0)
        
        const timeDiff = todayDate.getTime() - lastCompletionDate.getTime()
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 1) {
          // Exactly 1 day after last completion - streak continues
          stats.lastCompletionDate = today
        } else if (daysDiff > 1) {
          // Skipped at least one full day - streak resets to 1
          stats.lastCompletionDate = today
        }
        // If daysDiff < 0 (future date), shouldn't happen, but don't change streak
      }
    } else {
      // First completion ever
      stats.lastCompletionDate = today
    }
    
    // Recalculate overall streak from calendar days
    const overallStreak = getOverallStreak()
    stats.currentStreak = overallStreak
    
    saveStats(stats)
    return { success: true, isCompleted: true }
  }
}

// Keep the old function for backward compatibility, but it now uses toggle
export function completeChallenge(challengeId: string, xpReward: number): { success: boolean; message?: string } {
  const result = toggleChallengeCompletion(challengeId, xpReward)
  return { success: result.success, message: result.message }
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
  
  // Migrate old habits that don't have startDate or isActive
  let needsUpdate = false
  const today = getTodayEST()
  const migratedHabits = habits.map(habit => {
    const updates: Partial<Habit> = {}
    
    if (!habit.startDate) {
      needsUpdate = true
      updates.startDate = habit.createdAt ? habit.createdAt.split('T')[0] : today
    }
    
    if (habit.isActive === undefined) {
      needsUpdate = true
      updates.isActive = true // Default to active for backward compatibility
    }
    
    return Object.keys(updates).length > 0 ? { ...habit, ...updates } : habit
  })
  
  if (needsUpdate) {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(migratedHabits))
  }
  
  return needsUpdate ? migratedHabits : habits
}

export function createHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
  if (typeof window === 'undefined') throw new Error('Cannot create habit on server')
  
  const today = getTodayEST()
  const startDate = habit.startDate || today
  
  const newHabit: Habit = {
    ...habit,
    id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    startDate: startDate,
    isActive: habit.isActive !== undefined ? habit.isActive : true, // Default to active
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

export function toggleHabitActive(habitId: string): void {
  if (typeof window === 'undefined') return
  
  const habits = getHabits()
  const habit = habits.find(h => h.id === habitId)
  if (!habit) return
  
  habit.isActive = !(habit.isActive ?? true) // Toggle, defaulting to true if undefined
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits))
}

export function getHabitLogs(): HabitLog[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.HABIT_LOGS)
  return data ? JSON.parse(data) : []
}

export function logHabit(habitId: string): { success: boolean; message?: string } {
  if (typeof window === 'undefined') return { success: false, message: 'Cannot log habit on server' }
  
  const today = getTodayEST()
  const logs = getHabitLogs()
  
  // Check if already logged today - enforce 24-hour rule (once per calendar day)
  const alreadyLogged = logs.some(l => l.habitId === habitId && l.date === today)
  if (alreadyLogged) {
    return { 
      success: false, 
      message: "You've already logged this habit today. You can log it again tomorrow to continue your streak!" 
    }
  }
  
  // Verify habit exists
  const habit = getHabits().find(h => h.id === habitId)
  if (!habit) {
    return { success: false, message: 'Habit not found' }
  }
  
  // Add log entry (XP is calculated from historical data, not stored in stats)
  logs.push({ habitId, date: today })
  localStorage.setItem(STORAGE_KEYS.HABIT_LOGS, JSON.stringify(logs))
  
  // Update overall streak based on calendar days
  // Streak is calculated from the earliest activity date, not consecutive logs
  const stats = getStats()
  const overallStreak = getOverallStreak()
  
  // Update stats with new overall streak
  stats.currentStreak = overallStreak
  stats.lastCompletionDate = today
  
  // Note: XP is not stored in stats.xp - it's always calculated from historical data
  // This ensures accuracy and prevents double-counting
  
  saveStats(stats)
  return { success: true }
}

export function getHabitStreak(habitId: string): number {
  const habits = getHabits()
  const habit = habits.find(h => h.id === habitId)
  
  if (!habit || !habit.startDate) return 0
  
  // Calculate days since start date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(habit.startDate)
  startDate.setHours(0, 0, 0, 0)
  
  // Don't allow future start dates
  if (startDate > today) return 0
  
  // Calculate difference in days
  const timeDiff = today.getTime() - startDate.getTime()
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  
  // Return the number of days that have passed since the start date
  // If start date is today, return 1 (first day), otherwise return days passed
  // Example: Started Oct 13, today Nov 25 = 43 days have passed
  return Math.max(1, daysDiff)
}

export function isHabitLoggedToday(habitId: string): boolean {
  const today = getTodayEST()
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

export function getOverallStreak(): number {
  if (typeof window === 'undefined') return 0
  
  const habits = getHabits()
  const habitLogs = getHabitLogs()
  const challengeCompletions = getChallengeCompletions()
  const today = getTodayEST()
  
  // Collect all activity dates (unique calendar days with at least one activity)
  const activityDates = new Set<string>()
  
  // Add habit log dates
  habitLogs.forEach(log => {
    activityDates.add(log.date)
  })
  
  // Add challenge completion dates
  challengeCompletions.forEach(completion => {
    activityDates.add(completion.date)
  })
  
  if (activityDates.size === 0) return 0
  
  // Sort dates in descending order (most recent first)
  const sortedDates = Array.from(activityDates).sort((a, b) => b.localeCompare(a))
  
  // Calculate streak: consecutive calendar days with activity, ending today
  let streak = 0
  let expectedDate = today
  
  for (const activityDate of sortedDates) {
    // Only count dates up to today
    if (activityDate > today) continue
    
    // Check if this date matches the expected date in our streak
    if (activityDate === expectedDate) {
      streak++
      // Move to previous day
      const date = new Date(expectedDate)
      date.setDate(date.getDate() - 1)
      expectedDate = date.toISOString().split('T')[0]
    } else if (activityDate < expectedDate) {
      // Gap found - streak is broken
      break
    }
    // If activityDate > expectedDate, skip (future date or already counted)
  }
  
  return streak > 0 ? streak : 0
}

export function getOverallStats(): Stats {
  const baseStats = getStats()
  const totalHistoricalXP = getTotalHistoricalXP()
  const overallStreak = getOverallStreak()
  
  return {
    xp: totalHistoricalXP, // Use total historical XP instead of just stats.xp
    currentStreak: overallStreak, // Use overall streak from earliest start date
    lastCompletionDate: baseStats.lastCompletionDate,
  }
}

// Challenge Selection Functions
export function getChallengeSelections(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  const data = localStorage.getItem(STORAGE_KEYS.CHALLENGE_SELECTIONS)
  if (!data) return new Set() // All challenges are selected by default
  const selectedIds: string[] = JSON.parse(data)
  return new Set(selectedIds)
}

export function setChallengeSelections(selectedIds: Set<string>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.CHALLENGE_SELECTIONS, JSON.stringify(Array.from(selectedIds)))
}

export function toggleChallengeSelection(challengeId: string): void {
  if (typeof window === 'undefined') return
  const selections = getChallengeSelections()
  
  // If challenge is in selections, remove it; otherwise add it
  if (selections.has(challengeId)) {
    selections.delete(challengeId)
  } else {
    selections.add(challengeId)
  }
  
  setChallengeSelections(selections)
}

export function isChallengeSelected(challengeId: string): boolean {
  const selections = getChallengeSelections()
  // If selections is empty, all challenges are selected by default
  // If selections has items, only those in the set are selected
  if (selections.size === 0) return true
  return selections.has(challengeId)
}

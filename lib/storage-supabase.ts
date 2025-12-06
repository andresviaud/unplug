// Supabase storage layer for Cambiora
// This replaces localStorage with Supabase database

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Get current user
async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper to get today's date in EST (YYYY-MM-DD)
export function getTodayEST(): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')?.value || ''
  const month = parts.find(p => p.type === 'month')?.value?.padStart(2, '0') || ''
  const day = parts.find(p => p.type === 'day')?.value?.padStart(2, '0') || ''
  return `${year}-${month}-${day}`
}

// ===== HABITS =====

export interface Habit {
  id: string
  user_id: string
  name: string
  description?: string
  xp_per_day: number
  start_date: string
  color?: string
  is_active: boolean
  is_public?: boolean // NEW: If true, habit is visible in community feed
  created_at: string
  updated_at: string
}

export async function getHabits(): Promise<Habit[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching habits:', error)
    return []
  }

  return data || []
}

// Sync animal progress for all active habits (optimized - parallel execution)
export async function syncAllAnimalProgress(): Promise<void> {
  const habits = await getHabits()
  const activeHabits = habits.filter(h => h.is_active !== false)
  
  // Sync all habits in parallel for better performance
  await Promise.all(
    activeHabits.map(habit => 
      syncAnimalProgressForHabit(habit.id).catch(err => {
        console.error(`Error syncing animal for habit ${habit.id}:`, err)
      })
    )
  )
}

export async function createHabit(habit: {
  name: string
  description?: string
  xp_per_day?: number
  start_date: string
  color?: string
  is_active?: boolean
  is_public?: boolean // NEW: Visibility setting for community
}): Promise<Habit | null> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('You must be logged in to create habits')
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: habit.name,
      description: habit.description || null,
      xp_per_day: habit.xp_per_day || 20,
      start_date: habit.start_date,
      color: habit.color || null,
      is_active: habit.is_active !== undefined ? habit.is_active : true,
      is_public: habit.is_public !== undefined ? habit.is_public : false, // Default to private
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating habit:', error)
    throw new Error(error.message)
  }

  // Initialize animal for this new habit
  if (data) {
    await syncAnimalProgressForHabit(data.id).catch(err => {
      console.error('Error initializing animal for habit:', err)
      // Don't throw - animal initialization is not critical
    })
  }

  return data
}

export async function deleteHabit(habitId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  
  // First, delete all habit logs associated with this habit
  // This ensures XP and streak calculations are accurate
  const { error: logsError } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('user_id', user.id)

  if (logsError) {
    console.error('Error deleting habit logs:', logsError)
    throw new Error(logsError.message)
  }

  // Then delete the habit itself
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting habit:', error)
    throw new Error(error.message)
  }

  // Delete all user_animals associated with this habit
  const { error: animalsError } = await supabase
    .from('user_animals')
    .delete()
    .eq('habit_id', habitId)
    .eq('user_id', user.id)

  if (animalsError) {
    console.error('Error deleting user animals:', animalsError)
    // Don't throw - animal deletion is not critical
  }

  // Finally, update user stats to recalculate XP and streak
  // This ensures all numbers are accurate and consistent
  await updateUserStats()
}

export async function toggleHabitActive(habitId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  // First get current state
  const { data: habit } = await supabase
    .from('habits')
    .select('is_active')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (!habit) return

  const { error } = await supabase
    .from('habits')
    .update({ is_active: !habit.is_active })
    .eq('id', habitId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error toggling habit:', error)
    throw new Error(error.message)
  }
}

// Toggle habit visibility (public/private) for community feed
export async function toggleHabitVisibility(habitId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  // First get current state
  const { data: habit } = await supabase
    .from('habits')
    .select('is_public')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (!habit) return

  const { error } = await supabase
    .from('habits')
    .update({ is_public: !habit.is_public })
    .eq('id', habitId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error toggling habit visibility:', error)
    throw new Error(error.message)
  }
}

// ===== HABIT LOGS =====

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  date: string
  created_at: string
}

export async function getHabitLogs(): Promise<HabitLog[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching habit logs:', error)
    return []
  }

  return data || []
}

export async function logHabit(habitId: string): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  const today = getTodayEST()

  // Check if already logged today
  const supabase = createClient()
  const { data: existingLog } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('habit_id', habitId)
    .eq('date', today)
    .single()

  if (existingLog) {
    return {
      success: false,
      message: "You've already logged this habit today. You can log it again tomorrow to continue your streak!",
    }
  }

  // Create log entry
  const { error } = await supabase
    .from('habit_logs')
    .insert({
      user_id: user.id,
      habit_id: habitId,
      date: today,
    })

  if (error) {
    console.error('Error logging habit:', error)
    return { success: false, message: error.message }
  }

  // Update user stats (XP and streak)
  await updateUserStats()

  // Sync animal progress for this habit based on streak
  await syncAnimalProgressForHabit(habitId)

  // Trigger UI update for animal visual (only in browser)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('animalProgressUpdate'))
  }

  return { success: true }
}

// Unlog a habit (undo logging for today)
export async function unlogHabit(habitId: string): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  const today = getTodayEST()
  const supabase = createClient()

  // Delete today's log entry
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('user_id', user.id)
    .eq('habit_id', habitId)
    .eq('date', today)

  if (error) {
    console.error('Error unlogging habit:', error)
    return { success: false, message: error.message }
  }

  // Update user stats (XP and streak will be recalculated)
  await updateUserStats()

  // Sync animal progress for this habit based on streak
  await syncAnimalProgressForHabit(habitId)

  // Trigger UI update for animal visual (only in browser)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('animalProgressUpdate'))
  }

  return { success: true }
}

export async function isHabitLoggedToday(habitId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const today = getTodayEST()
  const supabase = createClient()
  const { data } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('habit_id', habitId)
    .eq('date', today)
    .single()

  return !!data
}

// Get streak for a specific habit (consecutive days logged)
export async function getHabitStreak(habitId: string): Promise<number> {
  const user = await getCurrentUser()
  if (!user) return 0

  const today = getTodayEST()
  const supabase = createClient()
  
  // Get all logs for this habit, ordered by date descending
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('date')
    .eq('user_id', user.id)
    .eq('habit_id', habitId)
    .order('date', { ascending: false })

  if (!logs || logs.length === 0) return 0

  // Calculate consecutive days from today backwards
  const logDates = new Set(logs.map(log => log.date))
  let streak = 0
  let expectedDate = today

  // Check if today is logged
  if (!logDates.has(expectedDate)) {
    // If today isn't logged, check yesterday
    const yesterday = new Date(expectedDate)
    yesterday.setDate(yesterday.getDate() - 1)
    expectedDate = yesterday.toISOString().split('T')[0]
  }

  // Count consecutive days
  while (logDates.has(expectedDate)) {
    streak++
    const prevDate = new Date(expectedDate)
    prevDate.setDate(prevDate.getDate() - 1)
    expectedDate = prevDate.toISOString().split('T')[0]
  }

  return streak
}

// Get streaks for all habits in one batch query (much faster)
export async function getAllHabitStreaks(habitIds: string[]): Promise<Record<string, number>> {
  const user = await getCurrentUser()
  if (!user || habitIds.length === 0) return {}

  const today = getTodayEST()
  const supabase = createClient()
  
  // Get all logs for all habits in one query
  const { data: allLogs } = await supabase
    .from('habit_logs')
    .select('habit_id, date')
    .eq('user_id', user.id)
    .in('habit_id', habitIds)
    .order('date', { ascending: false })

  if (!allLogs || allLogs.length === 0) {
    return Object.fromEntries(habitIds.map(id => [id, 0]))
  }

  // Group logs by habit_id
  const logsByHabit: Record<string, string[]> = {}
  for (const log of allLogs) {
    if (!logsByHabit[log.habit_id]) {
      logsByHabit[log.habit_id] = []
    }
    logsByHabit[log.habit_id].push(log.date)
  }

  // Calculate streak for each habit
  const streaks: Record<string, number> = {}
  for (const habitId of habitIds) {
    const logs = logsByHabit[habitId] || []
    if (logs.length === 0) {
      streaks[habitId] = 0
      continue
    }

    const logDates = new Set(logs)
    let streak = 0
    let expectedDate = today

    // Check if today is logged
    if (!logDates.has(expectedDate)) {
      const yesterday = new Date(expectedDate)
      yesterday.setDate(yesterday.getDate() - 1)
      expectedDate = yesterday.toISOString().split('T')[0]
    }

    // Count consecutive days
    while (logDates.has(expectedDate)) {
      streak++
      const prevDate = new Date(expectedDate)
      prevDate.setDate(prevDate.getDate() - 1)
      expectedDate = prevDate.toISOString().split('T')[0]
    }

    streaks[habitId] = streak
  }

  return streaks
}

// ===== USER STATS =====

export interface UserStats {
  total_xp: number
  current_streak: number
  last_completion_date: string | null
}

export async function getUserStats(): Promise<UserStats> {
  const user = await getCurrentUser()
  if (!user) {
    return { total_xp: 0, current_streak: 0, last_completion_date: null }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    // Create stats if they don't exist
    const { data: newStats } = await supabase
      .from('user_stats')
      .insert({ user_id: user.id })
      .select()
      .single()

    return newStats || { total_xp: 0, current_streak: 0, last_completion_date: null }
  }

  return {
    total_xp: data.total_xp || 0,
    current_streak: data.current_streak || 0,
    last_completion_date: data.last_completion_date,
  }
}

// Calculate and update user stats from all activities
async function updateUserStats(): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()
  const today = getTodayEST()

  // Get all habit logs
  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('date, habits(xp_per_day)')
    .eq('user_id', user.id)

  // Get all challenge completions
  const { data: challengeCompletions } = await supabase
    .from('challenge_completions')
    .select('date, xp')
    .eq('user_id', user.id)

  // Calculate total XP
  let totalXP = 0
  if (habitLogs) {
    habitLogs.forEach((log: any) => {
      if (log.habits) {
        totalXP += log.habits.xp_per_day || 0
      }
    })
  }
  if (challengeCompletions) {
    challengeCompletions.forEach((completion: any) => {
      totalXP += completion.xp || 0
    })
  }

  // Calculate streak (ONLY from habit logs, NOT from challenges)
  const habitActivityDates = new Set<string>()
  if (habitLogs) {
    habitLogs.forEach((log: any) => habitActivityDates.add(log.date))
  }

  const sortedDates = Array.from(habitActivityDates).sort((a, b) => b.localeCompare(a))
  let streak = 0
  let expectedDate = today

  for (const activityDate of sortedDates) {
    if (activityDate > today) continue
    if (activityDate === expectedDate) {
      streak++
      const date = new Date(expectedDate)
      date.setDate(date.getDate() - 1)
      expectedDate = date.toISOString().split('T')[0]
    } else if (activityDate < expectedDate) {
      break
    }
  }

  // Update stats
  await supabase
    .from('user_stats')
    .upsert({
      user_id: user.id,
      total_xp: totalXP,
      current_streak: streak,
      last_completion_date: today,
    }, {
      onConflict: 'user_id',
    })
}

// ===== DAILY ENTRIES (Check-ins) =====

export interface DailyEntry {
  id: string
  user_id: string
  date: string
  mood: number | null
  journal_text: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export async function getTodayCheckIn(): Promise<DailyEntry | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const today = getTodayEST()
  const supabase = createClient()
  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return data || null
}

export async function saveCheckIn(checkIn: {
  mood: number
  journal_text: string
}): Promise<void> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('You must be logged in')
  }

  const today = getTodayEST()
  const supabase = createClient()
  const { error } = await supabase
    .from('daily_entries')
    .upsert({
      user_id: user.id,
      date: today,
      mood: checkIn.mood,
      journal_text: checkIn.journal_text,
    }, {
      onConflict: 'user_id,date',
    })

  if (error) {
    console.error('Error saving check-in:', error)
    throw new Error(error.message)
  }
}

// ===== CHALLENGES =====

export interface ChallengeCompletion {
  id: string
  user_id: string
  challenge_id: string
  date: string
  xp: number
  created_at: string
}

export async function getChallengeCompletions(): Promise<ChallengeCompletion[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('challenge_completions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching challenge completions:', error)
    return []
  }

  return data || []
}

export async function toggleChallengeCompletion(
  challengeId: string,
  xpReward: number
): Promise<{ success: boolean; message?: string; isCompleted: boolean }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in', isCompleted: false }
  }

  const today = getTodayEST()
  const supabase = createClient()

  // Check if already completed today
  const { data: existing } = await supabase
    .from('challenge_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .eq('date', today)
    .single()

  if (existing) {
    // Uncomplete it
    const { error } = await supabase
      .from('challenge_completions')
      .delete()
      .eq('id', existing.id)

    if (error) {
      return { success: false, message: error.message, isCompleted: true }
    }

    await updateUserStats()
    return { success: true, isCompleted: false }
  } else {
    // Complete it
    const { error } = await supabase
      .from('challenge_completions')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        date: today,
        xp: xpReward,
      })

    if (error) {
      return { success: false, message: error.message, isCompleted: false }
    }

    await updateUserStats()
    return { success: true, isCompleted: true }
  }
}

export async function isChallengeCompletedToday(challengeId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const today = getTodayEST()
  const supabase = createClient()
  const { data } = await supabase
    .from('challenge_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .eq('date', today)
    .single()

  return !!data
}

// Get today's daily challenge description (based on user's habits)
export async function getDailyChallenge(): Promise<string> {
  const user = await getCurrentUser()
  if (!user) {
    return "" // No challenge if not logged in
  }

  const supabase = createClient()
  const { data: habits } = await supabase
    .from('habits')
    .select('name')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(3)

  if (!habits || habits.length === 0) {
    return "" // No challenge if no habits
  }

  if (habits.length === 1) {
    return `Complete your "${habits[0].name}" habit today!`
  } else if (habits.length === 2) {
    return `Complete at least one of your habits today: "${habits[0].name}" or "${habits[1].name}"`
  } else {
    const habitNames = habits.map(h => h.name).join(', ')
    return `Complete at least one of your habits today: ${habitNames}`
  }
}

// Complete a specific daily challenge by challenge ID
export async function completeDailyChallengeById(challengeId: string, xp: number): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  const today = getTodayEST()
  const supabase = createClient()

  // Check if already completed today
  const { data: existing } = await supabase
    .from('challenge_completions')
    .select('id')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .eq('date', today)
    .single()

  if (existing) {
    return { success: false, message: "You've already completed this challenge today!" }
  }

  // Create challenge completion entry
  const { error: challengeError } = await supabase
    .from('challenge_completions')
    .insert({
      user_id: user.id,
      challenge_id: challengeId,
      date: today,
      xp: xp,
    })

  if (challengeError && challengeError.code !== '23505') {
    console.error('Error creating challenge completion:', challengeError)
    return { success: false, message: challengeError.message }
  }

  // Update user stats (XP will be recalculated)
  await updateUserStats()

  // Update animal progress (add one node)
  // Note: Animal progress is now based on habit streaks, not challenge completions
  // So we don't call progressAnimal() here anymore

  return { success: true }
}

// Complete today's daily challenge (legacy - for single challenge completion)
// This updates daily_entries.is_completed, adds XP, updates streak
// Note: Animal progress is now based on habit streaks, not challenge completions
export async function completeDailyChallenge(): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  const today = getTodayEST()
  const supabase = createClient()

  // Check if already completed today
  const { data: todayEntry } = await supabase
    .from('daily_entries')
    .select('is_completed')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (todayEntry?.is_completed) {
    return { success: false, message: "You've already completed today's challenge!" }
  }

  // Create or update daily entry with is_completed = true
  const { error: entryError } = await supabase
    .from('daily_entries')
    .upsert({
      user_id: user.id,
      date: today,
      is_completed: true,
    }, {
      onConflict: 'user_id,date',
    })

  if (entryError) {
    console.error('Error updating daily entry:', entryError)
    return { success: false, message: entryError.message }
  }

  // Add XP reward (20 XP for completing daily challenge)
  const xpReward = 20
  const { error: challengeError } = await supabase
    .from('challenge_completions')
    .insert({
      user_id: user.id,
      challenge_id: 'daily', // Special ID for daily challenge
      date: today,
      xp: xpReward,
    })

  if (challengeError && challengeError.code !== '23505') { // Ignore duplicate key error
    console.error('Error creating challenge completion:', challengeError)
  }

  // Update user stats (XP and streak)
  await updateUserStats()

  // Update animal progress (add one node)
  // Note: Animal progress is now based on habit streaks, not challenge completions
  // So we don't call progressAnimal() here anymore

  return { success: true }
}

// Undo a specific daily challenge by challenge ID
export async function undoDailyChallengeById(challengeId: string): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  const today = getTodayEST()
  const supabase = createClient()

  // Delete the challenge completion entry
  const { error: challengeError } = await supabase
    .from('challenge_completions')
    .delete()
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .eq('date', today)

  if (challengeError) {
    console.error('Error deleting challenge completion:', challengeError)
    return { success: false, message: challengeError.message }
  }

  // Note: Animal progress is now based on habit streaks, not challenge completions
  // So we don't need to reverse animal progress here

  // Update user stats (XP will be recalculated without the challenge completion)
  await updateUserStats()

  return { success: true }
}

// Undo daily challenge completion (legacy - for single challenge)
export async function undoDailyChallenge(): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  const today = getTodayEST()
  const supabase = createClient()

  // Check if challenge was completed today
  const { data: todayEntry } = await supabase
    .from('daily_entries')
    .select('is_completed')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (!todayEntry?.is_completed) {
    return { success: false, message: "Today's challenge hasn't been completed yet." }
  }

  // Set is_completed to false
  const { error: entryError } = await supabase
    .from('daily_entries')
    .update({
      is_completed: false,
    })
    .eq('user_id', user.id)
    .eq('date', today)

  if (entryError) {
    console.error('Error undoing daily entry:', entryError)
    return { success: false, message: entryError.message }
  }

  // Delete the challenge completion entry
  const { error: challengeError } = await supabase
    .from('challenge_completions')
    .delete()
    .eq('user_id', user.id)
    .eq('challenge_id', 'daily')
    .eq('date', today)

  if (challengeError) {
    console.error('Error deleting challenge completion:', challengeError)
    // Continue anyway - the main thing is to set is_completed to false
  }

  // Note: Animal progress is now based on habit streaks, not challenge completions
  // So we don't need to reverse animal progress here

  // Update user stats (XP will be recalculated without the challenge completion)
  await updateUserStats()

  return { success: true }
}

// Progress the current active animal by one node
// Sync animal progress for a specific habit based on its streak
// This function ALWAYS fixes any mismatches automatically
export async function syncAnimalProgressForHabit(habitId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const supabase = createClient()

  // Get the habit streak
  const streak = await getHabitStreak(habitId)
  
  // Get or create the animal for this habit
  let { data: userAnimal, error: fetchError } = await supabase
    .from('user_animals')
    .select('*, animals(*)')
    .eq('user_id', user.id)
    .eq('habit_id', habitId)
    .single()

  // If error is "PGRST116" (no rows returned), that's fine - we'll create one
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching user_animal:', fetchError)
    // Check if habit_id column exists (migration might not be run)
    if (fetchError.message?.includes('column') && fetchError.message?.includes('habit_id')) {
      console.error('ERROR: The database migration has not been run! Please run supabase-migration-animals-per-habit.sql in Supabase SQL Editor.')
    }
    return
  }

  if (!userAnimal) {
    // No animal for this habit yet, assign a different animal based on habit ID
    // This ensures each habit gets a unique animal
    const { data: allAnimals } = await supabase
      .from('animals')
      .select('*')
      .order('order_index', { ascending: true })

    if (!allAnimals || allAnimals.length === 0) {
      console.error('No animals found in database')
      return
    }

    // Get all existing animals for this user to see which ones are already assigned to OTHER habits
    // We want each habit to have a different animal
    const { data: existingUserAnimals } = await supabase
      .from('user_animals')
      .select('animal_id, habit_id')
      .eq('user_id', user.id)
      .eq('is_completed', false)

    // Get animal IDs that are already assigned to OTHER habits (not this one)
    const usedAnimalIds = new Set(
      existingUserAnimals
        ?.filter(ua => ua.habit_id !== habitId) // Exclude this habit
        .map(ua => ua.animal_id) || []
    )
    
    // Find the first available animal that isn't already assigned to another habit
    // If all animals are used by other habits, assign based on habit ID hash for variety
    let selectedAnimal = allAnimals[0] // Default to first animal
    
    if (usedAnimalIds.size < allAnimals.length) {
      // There are unused animals, pick the first one not in use by other habits
      selectedAnimal = allAnimals.find(animal => !usedAnimalIds.has(animal.id)) || allAnimals[0]
    } else {
      // All animals are in use by other habits, assign based on habit ID hash for variety
      // This ensures different habits get different animals even if all are used
      const habitIdHash = habitId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const animalIndex = habitIdHash % allAnimals.length
      selectedAnimal = allAnimals[animalIndex]
      
      // If this animal is already used by another habit, try the next one
      let attempts = 0
      while (usedAnimalIds.has(selectedAnimal.id) && attempts < allAnimals.length) {
        const nextIndex = (animalIndex + attempts + 1) % allAnimals.length
        selectedAnimal = allAnimals[nextIndex]
        attempts++
      }
    }

    // Calculate target node index based on current streak (streak 0 = 0 nodes)
    // Make absolutely sure it matches streak exactly
    const targetNodeIndex = Math.max(0, Math.min(Math.floor(streak), selectedAnimal.total_nodes))

    // Create a new user_animal entry for this habit with the correct initial progress
    const { data: newUserAnimal, error } = await supabase
      .from('user_animals')
      .insert({
        user_id: user.id,
        habit_id: habitId,
        animal_id: selectedAnimal.id,
        current_node_index: targetNodeIndex, // Set to match streak immediately
        is_completed: targetNodeIndex >= selectedAnimal.total_nodes,
      })
      .select('*, animals(*)')
      .single()

    if (error || !newUserAnimal) {
      console.error('Error creating user_animal:', error)
      // Check if habit_id column exists
      if (error?.message?.includes('column') && error?.message?.includes('habit_id')) {
        console.error('ERROR: The database migration has not been run! Please run supabase-migration-animals-per-habit.sql in Supabase SQL Editor.')
      }
      return
    }

    userAnimal = newUserAnimal
    
    // If the animal is already complete, start the next one
    if (userAnimal.is_completed) {
      const { data: nextAnimal } = await supabase
        .from('animals')
        .select('*')
        .gt('order_index', selectedAnimal.order_index)
        .order('order_index', { ascending: true })
        .limit(1)
        .single()

      if (nextAnimal) {
        await supabase
          .from('user_animals')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            animal_id: nextAnimal.id,
            current_node_index: 0,
            is_completed: false,
          })
      }
    }
    
    return // Animal created with correct progress, no need to update
  }

  const animal = userAnimal.animals as any
  const totalNodes = animal.total_nodes

  // Set node index to match the streak EXACTLY (capped at total nodes)
  // Streak of 0 = 0 nodes, streak of 1 = 1 node, streak of 2 = 2 nodes, etc.
  // Make absolutely sure it's never negative and matches streak exactly
  const targetNodeIndex = Math.max(0, Math.min(Math.floor(streak), totalNodes))
  const isCompleted = targetNodeIndex >= totalNodes

  // ALWAYS update - no conditions, just update to match streak exactly
  // This is the single source of truth - streak determines nodes, period.
  if (isCompleted && !userAnimal.is_completed) {
    // Animal is complete, mark it as completed
    const { error } = await supabase
      .from('user_animals')
      .update({
        current_node_index: totalNodes,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', userAnimal.id)

    if (error) {
      console.error('Error completing animal:', error)
    } else {
      // If this animal is complete, start the next animal for this habit
      const { data: nextAnimal } = await supabase
        .from('animals')
        .select('*')
        .gt('order_index', animal.order_index)
        .order('order_index', { ascending: true })
        .limit(1)
        .single()

      if (nextAnimal) {
        await supabase
          .from('user_animals')
          .insert({
            user_id: user.id,
            habit_id: habitId,
            animal_id: nextAnimal.id,
            current_node_index: 0,
            is_completed: false,
          })
      }
    }
  } else {
    // Update node index to match streak EXACTLY (including 0)
    // ALWAYS update - this is the fix. No conditions, just update.
    const { error } = await supabase
      .from('user_animals')
      .update({
        current_node_index: targetNodeIndex,
        is_completed: false,
      })
      .eq('id', userAnimal.id)
      .eq('user_id', user.id)
      .eq('habit_id', habitId)

    if (error) {
      console.error('Error updating animal progress:', error)
    }
  }
}

// ===== ANIMALS =====

export interface Animal {
  id: string
  name: string
  total_nodes: number
  nodes: Array<{ x: number; y: number }>
  order_index: number
  created_at: string
}

export interface UserAnimal {
  id: string
  user_id: string
  animal_id: string
  habit_id: string | null
  current_node_index: number
  is_completed: boolean
  created_at: string
  completed_at: string | null
  animals: Animal
}

// Get current active animal with progress for a specific habit
// Optionally syncs progress with current streak before returning (default: true)
export async function getCurrentAnimal(habitId: string, syncFirst: boolean = true): Promise<{ animal: Animal; progress: UserAnimal } | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()

  // Optionally sync first to ensure progress is accurate
  if (syncFirst) {
    await syncAnimalProgressForHabit(habitId).catch(err => {
      console.error('Error syncing animal progress:', err)
    })
  }

  // Get the current active animal for this habit (not completed)
  const { data: activeAnimal } = await supabase
    .from('user_animals')
    .select('*, animals(*)')
    .eq('user_id', user.id)
    .eq('habit_id', habitId)
    .eq('is_completed', false)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (activeAnimal) {
    return {
      animal: activeAnimal.animals as Animal,
      progress: activeAnimal as UserAnimal,
    }
  }

  return null
}

// ===== NOTIFICATION SETTINGS =====

export interface NotificationSettings {
  enabled: boolean
  reminder_time: string // Format: "HH:MM:SS"
}

// Get user notification settings
export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_notification_settings')
    .select('enabled, reminder_time')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // If no settings exist, return default
    if (error.code === 'PGRST116') {
      return { enabled: false, reminder_time: '09:00:00' }
    }
    console.error('Error fetching notification settings:', error)
    return null
  }

  return {
    enabled: data.enabled || false,
    reminder_time: data.reminder_time || '09:00:00',
  }
}

// Update user notification settings
export async function updateNotificationSettings(
  enabled: boolean,
  reminderTime: string // Format: "HH:MM"
): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  // Convert "HH:MM" to "HH:MM:SS"
  const reminderTimeFormatted = reminderTime.includes(':') && reminderTime.split(':').length === 2
    ? `${reminderTime}:00`
    : reminderTime

  const supabase = createClient()
  const { error } = await supabase
    .from('user_notification_settings')
    .upsert({
      user_id: user.id,
      enabled,
      reminder_time: reminderTimeFormatted,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    console.error('Error updating notification settings:', error)
    return { success: false, message: error.message }
  }

  return { success: true }
}

// Reset all user data (challenges, XP, streaks, logs, animal progress)
export async function resetAllData(): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  const supabase = createClient()

  try {
    // Delete all habit logs (this will reset streaks)
    const { error: logsError } = await supabase
      .from('habit_logs')
      .delete()
      .eq('user_id', user.id)

    if (logsError) {
      console.error('Error deleting habit logs:', logsError)
      return { success: false, message: logsError.message }
    }

    // Delete all challenge completions (this will reset XP from challenges)
    const { error: challengesError } = await supabase
      .from('challenge_completions')
      .delete()
      .eq('user_id', user.id)

    if (challengesError) {
      console.error('Error deleting challenge completions:', challengesError)
      return { success: false, message: challengesError.message }
    }

    // Delete all user animals (reset animal progress)
    const { error: animalsError } = await supabase
      .from('user_animals')
      .delete()
      .eq('user_id', user.id)

    if (animalsError) {
      console.error('Error deleting user animals:', animalsError)
      return { success: false, message: animalsError.message }
    }

    // Reset user stats (XP and streak to 0)
    const { error: statsError } = await supabase
      .from('user_stats')
      .update({
        total_xp: 0,
        current_streak: 0,
        last_completion_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (statsError) {
      console.error('Error resetting user stats:', statsError)
      return { success: false, message: statsError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error resetting data:', error)
    return { success: false, message: error.message || 'Failed to reset data' }
  }
}

// Get all completed animals (trophies)
export async function getCompletedAnimals(): Promise<UserAnimal[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_animals')
    .select('*, animals(*)')
    .eq('user_id', user.id)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })

  if (error) {
    console.error('Error fetching completed animals:', error)
    return []
  }

  return (data || []) as UserAnimal[]
}

// Get all available animals (for showing locked ones)
export async function getAllAnimals(): Promise<Animal[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('animals')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching all animals:', error)
    return []
  }

  return (data || []) as Animal[]
}

// Check if an animal is completed by the user
export async function isAnimalCompleted(animalId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = createClient()
  const { data } = await supabase
    .from('user_animals')
    .select('id')
    .eq('user_id', user.id)
    .eq('animal_id', animalId)
    .eq('is_completed', true)
    .single()

  return !!data
}

// ===== COMMUNITY SUPPORT =====

// Interface for public habit with user info and streak
export interface PublicHabit {
  id: string
  habit_id: string
  habit_name: string
  habit_description?: string
  user_id: string
  user_email?: string
  streak: number
  xp_per_day: number
  start_date: string
  created_at: string
  cheer_count: number
  has_cheered: boolean // Whether current user has cheered this habit
}

// Get all public habits from the community (excluding current user's own habits)
export async function getPublicHabits(): Promise<PublicHabit[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createClient()

  // Get all public habits (excluding current user's)
  const { data: publicHabits, error: habitsError } = await supabase
    .from('habits')
    .select('id, name, description, user_id, xp_per_day, start_date, created_at')
    .eq('is_public', true)
    .eq('is_active', true)
    .neq('user_id', user.id) // Exclude current user's habits
    .order('created_at', { ascending: false })
    .limit(50) // Limit to 50 most recent

  if (habitsError || !publicHabits) {
    console.error('Error fetching public habits:', habitsError)
    return []
  }

  // Get streaks for all these habits
  const habitIds = publicHabits.map(h => h.id)
  const streaks: Record<string, number> = await getAllHabitStreaks(habitIds).catch(() => ({}))

  // Get cheer counts and check if current user has cheered
  const { data: allCheers } = await supabase
    .from('cheers')
    .select('habit_id, from_user_id')
    .in('habit_id', habitIds)

  // Count cheers per habit and check if user has cheered
  const cheerCounts: Record<string, number> = {}
  const userCheers: Set<string> = new Set()

  if (allCheers) {
    for (const cheer of allCheers) {
      cheerCounts[cheer.habit_id] = (cheerCounts[cheer.habit_id] || 0) + 1
      if (cheer.from_user_id === user.id) {
        userCheers.add(cheer.habit_id)
      }
    }
  }

  // Get user emails using database function
  const uniqueUserIds = Array.from(new Set(publicHabits.map(h => h.user_id)))
  const userDisplayMap: Record<string, string> = {}
  
  if (uniqueUserIds.length > 0) {
    try {
      // Call the database function to get user emails
      const { data: userEmails, error: emailError } = await supabase
        .rpc('get_user_emails', { user_ids: uniqueUserIds })
      
      if (!emailError && userEmails) {
        for (const userEmail of userEmails) {
          userDisplayMap[userEmail.user_id] = userEmail.email || 'Anonymous'
        }
      }
    } catch (error) {
      console.error('Error fetching user emails:', error)
      // Fallback to anonymous names if function doesn't exist yet
    }
  }
  
  // Fallback: if emails not available, use anonymous names
  for (const habit of publicHabits) {
    if (!userDisplayMap[habit.user_id]) {
      userDisplayMap[habit.user_id] = `User ${habit.user_id.substring(0, 4)}`
    }
  }

  // Build the result
  return publicHabits.map(habit => ({
    id: habit.id,
    habit_id: habit.id,
    habit_name: habit.name,
    habit_description: habit.description || undefined,
    user_id: habit.user_id,
    user_email: userDisplayMap[habit.user_id] || 'Anonymous',
    streak: streaks[habit.id] || 0,
    xp_per_day: habit.xp_per_day,
    start_date: habit.start_date,
    created_at: habit.created_at,
    cheer_count: cheerCounts[habit.id] || 0,
    has_cheered: userCheers.has(habit.id),
  }))
}

// Cheer (support) someone else's public habit
export async function cheerHabit(habitId: string): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in to cheer habits' }
  }

  const supabase = createClient()

  // Verify the habit exists and is public
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('id, user_id, is_public')
    .eq('id', habitId)
    .single()

  if (habitError || !habit) {
    return { success: false, message: 'Habit not found' }
  }

  // Prevent users from cheering their own habits
  if (habit.user_id === user.id) {
    return { success: false, message: 'You cannot cheer your own habit' }
  }

  // Verify habit is public
  if (!habit.is_public) {
    return { success: false, message: 'This habit is not public' }
  }

  // Check if user already cheered this habit
  const { data: existingCheer } = await supabase
    .from('cheers')
    .select('id')
    .eq('from_user_id', user.id)
    .eq('habit_id', habitId)
    .single()

  if (existingCheer) {
    return { success: false, message: 'You have already cheered this habit' }
  }

  // Create cheer
  const { error: cheerError } = await supabase
    .from('cheers')
    .insert({
      from_user_id: user.id,
      to_user_id: habit.user_id,
      habit_id: habitId,
    })

  if (cheerError) {
    console.error('Error creating cheer:', cheerError)
    return { success: false, message: cheerError.message }
  }

  return { success: true }
}

// Un-cheer (remove support) from a habit
export async function uncheerHabit(habitId: string): Promise<{ success: boolean; message?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: 'You must be logged in' }
  }

  const supabase = createClient()

  // Delete the cheer
  const { error } = await supabase
    .from('cheers')
    .delete()
    .eq('from_user_id', user.id)
    .eq('habit_id', habitId)

  if (error) {
    console.error('Error removing cheer:', error)
    return { success: false, message: error.message }
  }

  return { success: true }
}


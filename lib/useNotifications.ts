'use client'

import { useEffect, useRef } from 'react'
import { getNotificationSettings, getHabits, isHabitLoggedToday } from '@/lib/storage-supabase'
import { scheduleDailyReminder, showDailyHabitReminder, isNotificationEnabled } from '@/lib/notifications'

// Hook to manage daily habit reminders
export function useNotifications() {
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true

    const setupReminders = async () => {
      // Check if notifications are enabled in browser
      if (!isNotificationEnabled()) {
        return
      }

      // Get user notification settings
      const settings = await getNotificationSettings()
      if (!settings || !settings.enabled) {
        return
      }

      // Extract time from "HH:MM:SS" format
      const timeParts = settings.reminder_time.split(':')
      const reminderTime = `${timeParts[0]}:${timeParts[1]}`

      // Schedule the reminder
      const cleanup = scheduleDailyReminder(reminderTime, async () => {
        if (!mounted) return

        // Get all active habits
        const habits = await getHabits()
        const activeHabits = habits.filter(h => h.is_active !== false)

        if (activeHabits.length === 0) return

        // Check which habits haven't been logged today
        const unloggedHabits: string[] = []
        for (const habit of activeHabits) {
          const logged = await isHabitLoggedToday(habit.id)
          if (!logged) {
            unloggedHabits.push(habit.name)
          }
        }

        // Show notification if there are unlogged habits
        if (unloggedHabits.length > 0) {
          showDailyHabitReminder(unloggedHabits)
        }
      })

      cleanupRef.current = cleanup
    }

    setupReminders()

    // Cleanup on unmount
    return () => {
      mounted = false
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, []) // Run once on mount
}


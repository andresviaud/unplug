'use client'

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Check if notifications are enabled
export function isNotificationEnabled(): boolean {
  if (!('Notification' in window)) {
    return false
  }
  return Notification.permission === 'granted'
}

// Show a notification
export function showNotification(title: string, options?: NotificationOptions): void {
  if (!isNotificationEnabled()) {
    return
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'habit-reminder',
      requireInteraction: false,
      ...options,
    })

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    // Handle click to focus window
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch (error) {
    console.error('Error showing notification:', error)
  }
}

// Show habit reminder notification
export function showHabitReminder(habitName: string): void {
  showNotification('Time to log your habit! 🎯', {
    body: `Don't forget to log "${habitName}" today to keep your streak going!`,
    icon: '/favicon.ico',
  })
}

// Show daily reminder for all unlogged habits
export function showDailyHabitReminder(unloggedHabits: string[]): void {
  if (unloggedHabits.length === 0) return

  const habitText = unloggedHabits.length === 1
    ? unloggedHabits[0]
    : `${unloggedHabits.length} habits`

  showNotification('Complete Your Habits Today! 🔥', {
    body: `You still need to log ${habitText}. Keep your streak alive!`,
    icon: '/favicon.ico',
  })
}

// Schedule daily reminder
export function scheduleDailyReminder(
  reminderTime: string, // Format: "HH:MM" (24-hour)
  onReminder: () => void
): () => void {
  let timeoutId: NodeJS.Timeout | null = null
  let isCancelled = false

  const scheduleNext = () => {
    if (isCancelled) return

    // Calculate time until next reminder
    const [hours, minutes] = reminderTime.split(':').map(Number)
    const now = new Date()
    const reminderDate = new Date()
    reminderDate.setHours(hours, minutes, 0, 0)

    // If reminder time has passed today, schedule for tomorrow
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1)
    }

    const msUntilReminder = reminderDate.getTime() - now.getTime()

    // Set timeout for the reminder
    timeoutId = setTimeout(() => {
      if (!isCancelled) {
        onReminder()
        // Schedule next day's reminder
        scheduleNext()
      }
    }, msUntilReminder)
  }

  // Start scheduling
  scheduleNext()

  // Return cleanup function
  return () => {
    isCancelled = true
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
}


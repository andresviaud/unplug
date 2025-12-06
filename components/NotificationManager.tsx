'use client'

import { useNotifications } from '@/lib/useNotifications'

// This component manages daily habit reminders
export default function NotificationManager() {
  useNotifications()
  return null // This component doesn't render anything
}


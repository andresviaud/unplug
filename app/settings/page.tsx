'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { useAuth } from '@/lib/useAuth'
import { getNotificationSettings, updateNotificationSettings, resetAllData } from '@/lib/storage-supabase'
import { requestNotificationPermission, isNotificationEnabled } from '@/lib/notifications'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!authLoading) {
      checkNotificationPermission()
      loadSettings()
    }
  }, [user, authLoading])

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }

  const loadSettings = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const settings = await getNotificationSettings()
      if (settings) {
        setEnabled(settings.enabled)
        // Convert "HH:MM:SS" to "HH:MM"
        const timeParts = settings.reminder_time.split(':')
        setReminderTime(`${timeParts[0]}:${timeParts[1]}`)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    checkNotificationPermission()
    
    if (granted) {
      setMessage({ type: 'success', text: 'Notification permission granted! You can now enable reminders.' })
    } else {
      setMessage({ type: 'error', text: 'Notification permission denied. Please enable it in your browser settings.' })
    }
    
    setTimeout(() => setMessage(null), 5000)
  }

  const handleSave = async () => {
    if (!user) return

    // If enabling notifications, check permission first
    if (enabled && !isNotificationEnabled()) {
      const granted = await requestNotificationPermission()
      checkNotificationPermission()
      
      if (!granted) {
        setMessage({ type: 'error', text: 'Please grant notification permission to enable reminders.' })
        setTimeout(() => setMessage(null), 5000)
        return
      }
    }

    setSaving(true)
    try {
      const result = await updateNotificationSettings(enabled, reminderTime)
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save settings' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleResetAll = async () => {
    // Double confirmation for destructive action
    const confirm1 = window.confirm(
      '⚠️ WARNING: This will permanently delete ALL your progress:\n\n' +
      '• All habit logs (streaks will reset)\n' +
      '• All challenge completions\n' +
      '• All XP (will reset to 0)\n' +
      '• All animal progress\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you sure you want to continue?'
    )

    if (!confirm1) return

    const confirm2 = window.confirm(
      'This is your LAST chance to cancel.\n\n' +
      'Clicking OK will permanently delete everything.\n\n' +
      'Are you absolutely sure?'
    )

    if (!confirm2) return

    setResetting(true)
    try {
      const result = await resetAllData()
      if (result.success) {
        setMessage({ type: 'success', text: 'All data has been reset successfully. Your account is now fresh!' })
        setTimeout(() => {
          // Reload the page to reflect changes
          window.location.reload()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to reset data' })
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to reset data' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setResetting(false)
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
            <p className="text-gray-600 text-base sm:text-lg">You need to be logged in to view settings.</p>
            <Button onClick={() => router.push('/auth/login')} size="lg">
              Go to Sign In
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="page-hero">
        <h1>Settings</h1>
        <p>Manage your notification preferences and app settings.</p>
      </div>

      <Card className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Habit Reminders</h2>
        
        {/* Notification Permission Status */}
        <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">Browser Permission</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              notificationPermission === 'granted'
                ? 'bg-green-100 text-green-800'
                : notificationPermission === 'denied'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {notificationPermission === 'granted' ? 'Granted' : notificationPermission === 'denied' ? 'Denied' : 'Not Set'}
            </span>
          </div>
          {notificationPermission !== 'granted' && (
            <Button
              onClick={handleRequestPermission}
              variant="secondary"
              size="sm"
              className="mt-2"
            >
              Request Permission
            </Button>
          )}
        </div>

        {/* Enable/Disable Notifications */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-primary' : 'bg-gray-300'
            }`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="ml-3 text-base font-semibold text-gray-700">
              Enable Daily Habit Reminders
            </span>
          </label>
          <p className="mt-2 text-sm text-gray-600 ml-14">
            Get notified daily to log your habits and keep your streak alive!
          </p>
        </div>

        {/* Reminder Time */}
        {enabled && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Reminder Time
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="input-premium"
            />
            <p className="mt-2 text-sm text-gray-600">
              Choose when you want to receive your daily habit reminder.
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          size="lg"
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Card>

      {/* Reset All Data Section */}
      <Card className="border-2 border-red-200/60 bg-red-50/30">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Danger Zone</h2>
        <p className="text-gray-700 mb-6 text-base leading-relaxed">
          Reset all your progress and start fresh. This will permanently delete:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2 text-sm sm:text-base ml-2">
          <li>All habit logs and streaks</li>
          <li>All challenge completions</li>
          <li>All XP (reset to 0)</li>
          <li>All animal progress</li>
        </ul>
        <p className="text-red-700 font-semibold mb-6 text-sm sm:text-base">
          ⚠️ This action cannot be undone!
        </p>
        
        {/* Message */}
        {message && message.type === 'success' && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-200">
            <p className="text-sm font-medium text-green-800">
              {message.text}
            </p>
          </div>
        )}

        <button
          onClick={handleResetAll}
          disabled={resetting}
          className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-2xl transition-all duration-300 bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 hover:border-red-700 shadow-premium hover:shadow-premium-lg hover:-translate-y-1 hover:scale-105 active:scale-100 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
        >
          {resetting ? 'Resetting...' : 'Reset All Data'}
        </button>
      </Card>
    </div>
  )
}


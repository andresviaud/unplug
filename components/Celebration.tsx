'use client'

import { useEffect, useState } from 'react'

interface CelebrationProps {
  show: boolean
  message?: string
  onComplete?: () => void
}

export default function Celebration({ show, message, onComplete }: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      
      // Play satisfying success sound using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Create a pleasant success sound (two-tone chime)
        const playTone = (frequency: number, startTime: number, duration: number) => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = frequency
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0, startTime)
          gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01)
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
          
          oscillator.start(startTime)
          oscillator.stop(startTime + duration)
        }
        
        // Play two-tone success chime
        playTone(523.25, audioContext.currentTime, 0.2) // C5
        playTone(659.25, audioContext.currentTime + 0.1, 0.3) // E5
      } catch (e) {
        // Silently fail if audio is not supported
      }

      // Hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onComplete) onComplete()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Confetti effect */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${1 + Math.random() * 1}s`,
            }}
          />
        ))}
      </div>

      {/* Celebration message */}
      <div className="relative z-10 animate-celebration-bounce">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-premium-lg border-2 border-primary/30">
          <div className="text-center">
            <div className="text-6xl sm:text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
              {message || 'Great Job!'}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 font-medium">
              Keep up the amazing work! 💪
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


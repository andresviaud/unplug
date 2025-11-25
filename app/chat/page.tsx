'use client'

import { useEffect, useState, useRef } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Unplug Bot. How are you feeling today?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getFallbackResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase()
    
    if (
      lowerText.includes('stress') ||
      lowerText.includes('stressed') ||
      lowerText.includes('anxious') ||
      lowerText.includes('anxiety') ||
      lowerText.includes('overwhelmed') ||
      lowerText.includes('sad') ||
      lowerText.includes('depressed')
    ) {
      return "I hear you're going through a tough time. It's okay to feel this way. Consider taking a short break from your screens—maybe step outside for a few minutes, take some deep breaths, or do something that brings you joy. Remember, your feelings are valid. Would you like to talk more about what's on your mind?"
    }
    
    if (lowerText.includes('screen time') || lowerText.includes('phone') || lowerText.includes('device')) {
      return "Screen time can definitely impact how we feel. What specific challenges are you facing with your digital habits? Sometimes setting small boundaries—like no phone during meals or before bed—can make a big difference."
    }
    
    if (lowerText.includes('sleep') || lowerText.includes('tired') || lowerText.includes('exhausted')) {
      return "Sleep and screen time are closely connected. The blue light from screens can disrupt your sleep cycle. Try putting your devices away at least an hour before bedtime. How has your sleep been lately?"
    }
    
    return "Tell me more about how your day felt. I'm here to listen and help you reflect on your digital wellness journey."
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message,
          },
        ])
      } else {
        // Fallback to rule-based response
        const fallbackResponse = getFallbackResponse(userMessage.content)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fallbackResponse,
          },
        ])
      }
    } catch (error) {
      // Fallback to rule-based response
      const fallbackResponse = getFallbackResponse(userMessage.content)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackResponse,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="text-center mb-8 sm:mb-12 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gradient mb-4 sm:mb-6 tracking-tight">Unplug Bot</h1>
        <p className="text-lg sm:text-xl text-gray-700 font-light px-2">Your digital wellness companion</p>
      </div>

      <Card className="h-[calc(100vh-280px)] sm:h-[600px] lg:h-[700px] flex flex-col animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {/* Disclaimer */}
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200/50 rounded-2xl">
          <p className="text-sm text-amber-900 font-medium">
            <strong className="font-bold">Note:</strong> Unplug Bot is not a therapist. This is a reflective support tool.
          </p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 mb-6 pr-3 custom-scrollbar">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex animate-fade-in ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-3 sm:py-4 shadow-lg ${
                  message.role === 'user'
                    ? 'gradient-primary text-white rounded-br-md'
                    : 'bg-white/90 backdrop-blur-sm text-gray-900 rounded-bl-md border border-gray-100'
                }`}
              >
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/90 backdrop-blur-sm text-gray-900 rounded-3xl rounded-bl-md shadow-lg border border-gray-100 px-5 py-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="flex gap-3 sm:gap-4 border-t-2 border-gray-200 pt-4 sm:pt-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={2}
            className="flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none text-sm sm:text-base text-gray-800 placeholder-gray-400"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="self-end min-w-[100px] sm:min-w-[120px] text-sm sm:text-base px-4 sm:px-6"
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  )
}

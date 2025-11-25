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
      content: "Hi! I'm Cambiora Bot. How are you feeling today?",
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
        if (!data.message) {
          console.error('Invalid response format:', data)
          throw new Error('Invalid response from server')
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message,
          },
        ])
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Unable to connect to AI service'
        
        console.error('Chat API error:', errorData)
        
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I'm sorry, but I'm currently unable to respond. ${errorMessage}`,
          },
        ])
      }
    } catch (error) {
      console.error('Chat fetch error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, but I encountered an error connecting to the AI service. Please check your internet connection and ensure your OpenAI API key is properly configured. Check the browser console for more details.",
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
      <div className="text-center mb-12 sm:mb-16 animate-fade-in">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gradient mb-6 tracking-tight">Cambiora Bot</h1>
        <p className="text-lg sm:text-xl text-gray-700 font-light max-w-2xl mx-auto px-4">Your digital wellness companion</p>
      </div>

      <Card className="h-[calc(100vh-280px)] sm:h-[600px] lg:h-[700px] flex flex-col animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {/* Disclaimer */}
        <div className="mb-6 space-y-3">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200/50 rounded-3xl">
            <p className="text-sm text-amber-900 font-medium">
              <strong className="font-bold">Note:</strong> Cambiora Bot is not a therapist. This is a reflective support tool.
            </p>
          </div>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-3xl">
            <p className="text-sm text-blue-900 font-medium">
              <strong className="font-bold">AI-Powered:</strong> This chatbot uses OpenAI for personalized responses when available, with an intelligent fallback system for helpful support anytime.
            </p>
          </div>
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
                className={`max-w-[90%] sm:max-w-[85%] rounded-3xl px-4 sm:px-5 py-3 sm:py-4 shadow-premium min-w-0 ${
                  message.role === 'user'
                    ? 'gradient-primary text-white rounded-br-md'
                    : 'bg-white/90 backdrop-blur-sm text-gray-900 rounded-bl-md border border-gray-100'
                }`}
              >
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
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
            className="flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 resize-none text-sm sm:text-base text-gray-800 placeholder-gray-400"
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

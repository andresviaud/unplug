import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getFallbackResponse } from '@/lib/fallback-chat'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let messages: Array<{ role: string; content: string }> = []
  
  try {
    const requestData = await request.json()
    messages = requestData.messages || []

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY
    const useFallback = !apiKey || apiKey.trim() === ''
    
    if (useFallback) {
      console.log('Using fallback response system (OpenAI not configured)')
      // Use intelligent fallback
      const fallbackMessage = getFallbackResponse({
        messages,
        userMessage: messages[messages.length - 1]?.content || '',
      })
      return NextResponse.json({ message: fallbackMessage, fallback: true })
    }

    // Log API key status (without exposing the key)
    console.log('OpenAI API key status:', apiKey ? `Present (length: ${apiKey.length})` : 'Missing')

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Cambiora Bot, a supportive digital wellness assistant. You help users reflect on their screen time, mood, and digital habits. Be empathetic, encouraging, and focus on healthy digital boundaries. Keep responses concise and conversational.',
        },
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ],
      max_tokens: 300,
      temperature: 0.8,
    })

    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    })
    
    // Use fallback response when OpenAI fails
    console.log('Falling back to intelligent response system')
    try {
      const fallbackMessage = getFallbackResponse({
        messages,
        userMessage: messages[messages.length - 1]?.content || '',
      })
      return NextResponse.json({ message: fallbackMessage, fallback: true })
    } catch (fallbackError) {
      // If fallback also fails, return error
      return NextResponse.json(
        { error: 'Unable to generate response. Please try again.' },
        { status: 500 }
      )
    }
  }
}


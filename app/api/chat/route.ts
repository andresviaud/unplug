import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      console.error('OPENAI_API_KEY is missing or empty')
      return NextResponse.json(
        { error: 'OpenAI API key is required but not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 503 }
      )
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
        ...messages,
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
    
    // Provide more detailed error messages based on OpenAI error types
    let errorMessage = 'Failed to get AI response'
    let statusCode = 500
    
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      errorMessage = 'Invalid OpenAI API key. Please check your API key in the environment variables.'
      statusCode = 401
    } else if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
      errorMessage = 'OpenAI API rate limit exceeded. Please try again later.'
      statusCode = 429
    } else if (error?.status === 500 || error?.code === 'server_error') {
      errorMessage = 'OpenAI API server error. Please try again later.'
      statusCode = 500
    } else if (error?.message) {
      errorMessage = `OpenAI error: ${error.message}`
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      return NextResponse.json(
        { error: 'OpenAI API key is required but not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 503 }
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
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to get AI response'
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.response?.status === 401) {
      errorMessage = 'Invalid OpenAI API key. Please check your API key.'
    } else if (error?.response?.status === 429) {
      errorMessage = 'OpenAI API rate limit exceeded. Please try again later.'
    } else if (error?.response?.status === 500) {
      errorMessage = 'OpenAI API server error. Please try again later.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}


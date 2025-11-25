import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai/index.mjs'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
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
      max_tokens: 200,
      temperature: 0.7,
    })

    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}


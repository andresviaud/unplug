import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get today's check-in
    const today = new Date().toISOString().split('T')[0]
    const { data: checkIn } = await supabase
      .from('daily_entries')
      .select('mood, journal_text')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    // Get user's habits
    const { data: habits } = await supabase
      .from('habits')
      .select('name, start_date')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(3)

    // Get user stats (streak)
    const { data: stats } = await supabase
      .from('user_stats')
      .select('current_streak')
      .eq('user_id', user.id)
      .single()

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      // Fallback message if OpenAI is not configured
      const fallbackMessage = generateFallbackPrompt(checkIn, habits || [], stats || null)
      return NextResponse.json({ message: fallbackMessage, fallback: true })
    }

    // Generate AI prompt
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const moodText = checkIn?.mood 
      ? `Mood: ${getMoodLabel(checkIn.mood)}`
      : 'No mood recorded today'
    
    const habitsText = habits && habits.length > 0
      ? `Active habits: ${habits.map(h => h.name).join(', ')}`
      : 'No active habits'
    
    const streakText = stats?.current_streak 
      ? `Current streak: ${stats.current_streak} days`
      : 'Starting your journey'

    const prompt = `You are Cambiora, a supportive personal change assistant. Generate a short, encouraging daily message (1-2 sentences) for a user based on:

${moodText}
${habitsText}
${streakText}

Keep it positive, motivating, and specific to their situation. Focus on progress and small wins.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive personal change assistant. Generate short, encouraging daily messages.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.8,
    })

    const message = completion.choices[0]?.message?.content

    if (!message) {
      const fallbackMessage = generateFallbackPrompt(checkIn, habits || [], stats || null)
      return NextResponse.json({ message: fallbackMessage, fallback: true })
    }

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('AI prompt error:', error)
    
    // Return fallback on error
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: checkIn } = await supabase
        .from('daily_entries')
        .select('mood')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single()
      
      const { data: habits } = await supabase
        .from('habits')
        .select('name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(3)
      
      const { data: stats } = await supabase
        .from('user_stats')
        .select('current_streak')
        .eq('user_id', user.id)
        .single()
      
      const fallbackMessage = generateFallbackPrompt(checkIn, habits || [], stats || null)
      return NextResponse.json({ message: fallbackMessage, fallback: true })
    }
    
    return NextResponse.json(
      { error: 'Unable to generate prompt' },
      { status: 500 }
    )
  }
}

function getMoodLabel(mood: number): string {
  const labels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Okay',
    4: 'Good',
    5: 'Great',
  }
  return labels[mood] || 'Unknown'
}

function generateFallbackPrompt(checkIn: any, habits: any[], stats: any | null): string {
  const mood = checkIn?.mood
  const habitNames = habits?.map((h: any) => h.name) || []
  const streak = stats?.current_streak || 0

  if (streak > 0) {
    if (mood && mood >= 4) {
      return `You're on a ${streak}-day streak! Your positive energy is fueling your progress. Keep it up!`
    } else if (mood && mood <= 2) {
      return `You've maintained a ${streak}-day streak even on tough days. That's real strength. Today is a new opportunity.`
    } else {
      return `You're ${streak} days into your journey. Every day counts, and you're building something meaningful.`
    }
  }

  if (habitNames.length > 0) {
    return `You're working on ${habitNames[0]}. Every small step forward matters. You've got this!`
  }

  return `Today is a fresh start. Small actions lead to big changes. What will you do today?`
}


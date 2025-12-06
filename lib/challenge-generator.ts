// Shared challenge generation logic for dashboard and challenges page

import type { Habit } from './storage-supabase'

export interface DailyChallenge {
  id: string
  habitId: string
  habitName: string
  title: string
  description: string
  xp: number
}

// Generate exactly 1 challenge per habit per day (deterministic based on date)
export function generateDailyChallengesFromHabits(habits: Habit[]): DailyChallenge[] {
  if (habits.length === 0) {
    return []
  }

  const challenges: DailyChallenge[] = []
  const today = new Date()
  // Use day of year (1-365) to select which challenge variant to show
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)

  habits.forEach((habit) => {
    const habitName = habit.name.toLowerCase()
    
    // Get all possible challenges for this habit type
    let possibleChallenges: Omit<DailyChallenge, 'habitId' | 'habitName'>[] = []
    
    if (habitName.includes('exercise') || habitName.includes('workout') || habitName.includes('gym')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Pre-Workout Nutrition',
          description: 'Eat a healthy meal or snack 30-60 minutes before your workout to fuel your body.',
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Post-Workout Stretch',
          description: 'Spend 10 minutes stretching after your workout to improve recovery and flexibility.',
          xp: 20,
        },
        {
          id: `${habit.id}-3`,
          title: 'Track Your Workout',
          description: 'Log your sets, reps, or duration to track your progress over time.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('meditation') || habitName.includes('mindfulness') || habitName.includes('yoga')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Create a Meditation Space',
          description: 'Set up a quiet, comfortable space dedicated to your practice.',
          xp: 20,
        },
        {
          id: `${habit.id}-2`,
          title: 'Practice Gratitude',
          description: 'Write down 3 things you\'re grateful for today to enhance your mindfulness practice.',
          xp: 25,
        },
        {
          id: `${habit.id}-3`,
          title: 'Deep Breathing Exercise',
          description: 'Take 5 minutes to practice deep breathing: 4 seconds in, 4 seconds hold, 4 seconds out.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('read') || habitName.includes('book') || habitName.includes('learning')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Take Reading Notes',
          description: 'Write down 3 key insights or quotes from what you read today.',
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Discuss What You Learned',
          description: 'Share something you learned today with a friend or write about it in your journal.',
          xp: 30,
        },
        {
          id: `${habit.id}-3`,
          title: 'Create a Reading List',
          description: 'Add 3 new books or articles to your reading list based on your interests.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('water') || habitName.includes('drink') || habitName.includes('hydration')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Start Your Day with Water',
          description: 'Drink a full glass of water first thing in the morning before coffee or breakfast.',
          xp: 20,
        },
        {
          id: `${habit.id}-2`,
          title: 'Eat Water-Rich Foods',
          description: 'Include fruits and vegetables with high water content (like cucumber, watermelon, or oranges) in at least one meal.',
          xp: 25,
        },
        {
          id: `${habit.id}-3`,
          title: 'Set Hydration Reminders',
          description: 'Set 3 reminders throughout the day to drink water and actually drink when they go off.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('sleep') || habitName.includes('bedtime') || habitName.includes('rest')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Create a Bedtime Routine',
          description: 'Follow a 30-minute wind-down routine before bed (reading, stretching, or journaling).',
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Keep Your Room Cool',
          description: 'Set your bedroom temperature to 65-68°F (18-20°C) for optimal sleep.',
          xp: 20,
        },
        {
          id: `${habit.id}-3`,
          title: 'Avoid Caffeine After 2 PM',
          description: 'Skip coffee, tea, or energy drinks after 2 PM to improve sleep quality.',
          xp: 25,
        },
      ]
    } else if (habitName.includes('alcohol') || habitName.includes('quit alcohol') || habitName.includes('sober')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Plan Sober Activities',
          description: 'Schedule 3 alcohol-free activities for today (exercise, hobbies, social events).',
          xp: 30,
        },
        {
          id: `${habit.id}-2`,
          title: 'Practice Saying No',
          description: 'Rehearse how you\'ll decline alcohol in social situations today.',
          xp: 25,
        },
        {
          id: `${habit.id}-3`,
          title: 'Track Your Progress',
          description: 'Write down how many days you\'ve been alcohol-free and how you feel.',
          xp: 20,
        },
      ]
    } else if (habitName.includes('nicotine') || habitName.includes('smoke') || habitName.includes('vape') || habitName.includes('quit smoking')) {
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Use a Replacement Strategy',
          description: 'When you feel a craving, do 10 push-ups, take a walk, or chew gum instead.',
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Avoid Triggers',
          description: 'Identify and avoid 3 situations that typically trigger your nicotine use today.',
          xp: 30,
        },
        {
          id: `${habit.id}-3`,
          title: 'Celebrate Milestones',
          description: 'Acknowledge how long you\'ve been nicotine-free and reward yourself with something healthy.',
          xp: 20,
        },
      ]
    } else {
      // Generic complementary challenges for any habit
      possibleChallenges = [
        {
          id: `${habit.id}-1`,
          title: 'Reflect on Your Progress',
          description: `Take 5 minutes to journal about how your ${habit.name} habit is helping you grow.`,
          xp: 25,
        },
        {
          id: `${habit.id}-2`,
          title: 'Share Your Journey',
          description: `Tell someone about your ${habit.name} habit and why it matters to you.`,
          xp: 30,
        },
        {
          id: `${habit.id}-3`,
          title: 'Plan for Tomorrow',
          description: `Write down when and how you'll do your ${habit.name} habit tomorrow.`,
          xp: 20,
        },
      ]
    }

    // Select exactly 1 challenge per habit based on day of year + habit ID
    // This ensures consistency: same habit gets same challenge on same day
    const challengeIndex = (dayOfYear + habit.id.charCodeAt(0)) % possibleChallenges.length
    const selectedChallenge = possibleChallenges[challengeIndex]
    
    challenges.push({
      ...selectedChallenge,
      habitId: habit.id,
      habitName: habit.name,
    })
  })

  return challenges
}


/**
 * Intelligent fallback chat responses when OpenAI is unavailable
 * Provides contextual, helpful responses based on user input
 */

interface ChatContext {
  messages: Array<{ role: string; content: string }>
  userMessage: string
}

export function getFallbackResponse(context: ChatContext): string {
  const { userMessage, messages } = context
  const lowerText = userMessage.toLowerCase()
  const conversationHistory = messages.slice(-5) // Last 5 messages for context

  // Emotional support patterns
  if (
    lowerText.includes('stress') ||
    lowerText.includes('stressed') ||
    lowerText.includes('overwhelmed') ||
    lowerText.includes('pressure') ||
    lowerText.includes('too much')
  ) {
    return "I understand you're feeling stressed. That's completely valid. When stress builds up, it's important to take care of yourself. Consider taking a 10-minute break from your screens—step outside, take some deep breaths, or do a quick physical activity. What specific situation is causing you stress right now? Sometimes talking through it helps."
  }

  if (
    lowerText.includes('anxious') ||
    lowerText.includes('anxiety') ||
    lowerText.includes('worried') ||
    lowerText.includes('nervous') ||
    lowerText.includes('panic')
  ) {
    return "Anxiety can be really challenging, and I'm here to support you. When anxiety hits, try the 4-7-8 breathing technique: inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 times. Also, consider putting your phone away for a bit—constant notifications can amplify anxiety. What's been triggering your anxiety lately?"
  }

  if (
    lowerText.includes('sad') ||
    lowerText.includes('depressed') ||
    lowerText.includes('down') ||
    lowerText.includes('hopeless') ||
    lowerText.includes('empty')
  ) {
    return "I hear you're going through a difficult time. Your feelings are valid, and it's okay to not be okay. Consider reaching out to someone you trust, or if you're in crisis, please contact a mental health professional. For now, try doing one small thing that usually brings you comfort—even if it's just for 5 minutes. What's one thing that used to bring you joy?"
  }

  // Digital wellness patterns
  if (
    lowerText.includes('screen time') ||
    lowerText.includes('phone') ||
    lowerText.includes('device') ||
    lowerText.includes('social media') ||
    lowerText.includes('addicted') ||
    lowerText.includes('can\'t stop')
  ) {
    if (lowerText.includes('reduce') || lowerText.includes('less') || lowerText.includes('cut down')) {
      return "Reducing screen time is a great goal! Start small: try the 'phone-free hour' technique—choose one hour each day (maybe during meals or before bed) where you put your phone in another room. You can also use app timers or grayscale mode to make your phone less appealing. What time of day do you find yourself using your phone most?"
    }
    return "Screen time can definitely impact how we feel. The key is awareness and small boundaries. Try setting specific 'no-phone zones' like your bedroom or during meals. You could also try the '20-20-20 rule'—every 20 minutes, look at something 20 feet away for 20 seconds. What specific challenges are you facing with your digital habits?"
  }

  if (
    lowerText.includes('sleep') ||
    lowerText.includes('tired') ||
    lowerText.includes('exhausted') ||
    lowerText.includes('insomnia') ||
    lowerText.includes('can\'t sleep')
  ) {
    return "Sleep and screen time are closely connected. Blue light from screens suppresses melatonin, making it harder to sleep. Try these tips: 1) Put devices away 1-2 hours before bed, 2) Use night mode/blue light filters in the evening, 3) Keep your phone out of the bedroom, 4) Try reading a physical book instead. How has your sleep been lately? Are you using your phone right before bed?"
  }

  // Habit-related patterns
  if (
    lowerText.includes('habit') ||
    lowerText.includes('change') ||
    lowerText.includes('break') ||
    lowerText.includes('quit') ||
    lowerText.includes('stop')
  ) {
    return "Changing habits is challenging but absolutely possible! The key is starting small and being consistent. Research shows it takes an average of 66 days to form a new habit. Try the '2-minute rule'—make your new habit so small it takes less than 2 minutes. For breaking bad habits, identify your triggers and create a replacement behavior. What habit are you trying to change?"
  }

  // Motivation and progress
  if (
    lowerText.includes('motivated') ||
    lowerText.includes('motivation') ||
    lowerText.includes('lazy') ||
    lowerText.includes('procrastinate') ||
    lowerText.includes('stuck')
  ) {
    return "Motivation comes and goes—that's normal! The key is building systems that work even when motivation is low. Try the 'just 5 minutes' technique: commit to doing something for just 5 minutes. Often, starting is the hardest part, and once you begin, you'll likely continue. Also, celebrate small wins—progress, not perfection. What's one small step you could take right now?"
  }

  // Questions about the app or features
  if (
    lowerText.includes('how') && (lowerText.includes('work') || lowerText.includes('use') || lowerText.includes('help'))
  ) {
    return "I'm here to help you on your digital wellness journey! Cambiora helps you track your habits, reflect through journaling, and complete challenges. You can create custom habit trackers, log daily check-ins, and earn XP as you build streaks. What would you like to know more about? I can help you with habit tracking, challenges, or general wellness tips."
  }

  // Greetings and casual conversation
  if (
    lowerText.includes('hello') ||
    lowerText.includes('hi') ||
    lowerText.includes('hey') ||
    lowerText.match(/^h[iey]+$/)
  ) {
    return "Hi there! I'm here to support you on your journey to better digital wellness. How are you feeling today? Is there anything specific you'd like to work on—whether it's reducing screen time, building better habits, or just checking in with yourself?"
  }

  if (
    lowerText.includes('thank') ||
    lowerText.includes('thanks') ||
    lowerText.includes('appreciate')
  ) {
    return "You're so welcome! I'm glad I could help. Remember, progress in digital wellness is a journey, not a destination. Keep taking small steps, and be kind to yourself along the way. Is there anything else you'd like to talk about?"
  }

  // Reflection and self-awareness
  if (
    lowerText.includes('feel') ||
    lowerText.includes('feeling') ||
    lowerText.includes('today') ||
    lowerText.includes('day')
  ) {
    return "I'm listening. Sometimes just acknowledging how we feel is the first step toward feeling better. Try asking yourself: What's one thing that went well today? What's one thing you're grateful for? And what's one small action you could take right now to feel a bit better? How would you describe your day so far?"
  }

  // Goal setting and planning
  if (
    lowerText.includes('goal') ||
    lowerText.includes('plan') ||
    lowerText.includes('want') ||
    lowerText.includes('achieve')
  ) {
    return "Setting goals is powerful! Make them SMART: Specific, Measurable, Achievable, Relevant, and Time-bound. Start with small, daily goals rather than big, overwhelming ones. For example, instead of 'use my phone less,' try 'no phone during dinner' or 'phone-free hour before bed.' What's one specific goal you'd like to work toward?"
  }

  // Default contextual response
  // Analyze conversation history for better context
  const hasMentionedStress = conversationHistory.some(m => 
    m.content.toLowerCase().includes('stress') || 
    m.content.toLowerCase().includes('anxious')
  )
  const hasMentionedScreenTime = conversationHistory.some(m => 
    m.content.toLowerCase().includes('phone') || 
    m.content.toLowerCase().includes('screen')
  )

  if (hasMentionedStress) {
    return "I hear you. Stress and digital habits often go hand in hand. When we're stressed, we might turn to our devices for distraction, but that can sometimes make things worse. What's one small thing you could do right now to take care of yourself? Even a 5-minute break can help reset your mind."
  }

  if (hasMentionedScreenTime) {
    return "It sounds like you're thinking about your relationship with technology. That awareness is already a great first step! Remember, the goal isn't to eliminate technology—it's to use it intentionally and in ways that serve you. What would a healthier relationship with your devices look like for you?"
  }

  // General supportive response
  return "I'm here to support you on your digital wellness journey. Whether you're working on reducing screen time, building better habits, or just checking in with yourself, every small step counts. What's on your mind today? Feel free to share what you're thinking about, and I'll do my best to help."
}




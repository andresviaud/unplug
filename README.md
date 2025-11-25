# Unplug - Digital Wellness App

A beautiful, modern digital wellness web application built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- 📊 **Dashboard** - Track your daily check-ins, XP, streaks, and completed challenges
- ✅ **Daily Check-In** - Log your mood and screen time with optional notes (dates tracked automatically)
- 🎯 **Challenges** - Complete digital detox challenges to earn XP and build streaks
- 💬 **AI Chatbot** - Get support and guidance with OpenAI integration (with fallback mode)
- 📥 **Export/Import** - Backup and restore your data
- 📅 **Date Tracking** - All entries are timestamped with dates for time-based tracking

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** (Functional components + Hooks)
- **TypeScript**
- **Tailwind CSS**
- **localStorage** for data persistence (device-based)
- **OpenAI API** (optional) for AI chat

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/andresviaud/unplug.git
cd unplug
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Add your OpenAI API key:
   - Create a `.env.local` file in the root directory
   - Add: `OPENAI_API_KEY=your_api_key_here`
   - The app works fully without this using fallback responses

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
unplug/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── challenges/     # Challenges page
│   ├── chat/           # Chat page
│   ├── checkin/        # Check-in page
│   └── page.tsx        # Dashboard
├── components/         # Reusable UI components
├── lib/                # Utilities and storage
└── public/             # Static assets
```

## Features in Detail

### Dashboard
- View today's check-in
- See your stats: Total XP, Current Streak, Challenges Completed
- Quick access to all features

### Daily Check-In
- Select your mood (5 options with emojis)
- Log screen time ranges
- Add optional notes
- View check-in history

### Challenges
- 6 digital detox challenges
- Earn XP for completing challenges
- Build consecutive day streaks
- Track total completions

### AI Chatbot
- OpenAI-powered responses (when API key is provided)
- Fallback rule-based responses (works without API key)
- Supportive digital wellness guidance

## Data Storage

All data is stored in browser localStorage (device-specific):
- `unplug_checkins` - Check-in history with dates (YYYY-MM-DD format)
- `unplug_challenges` - Challenge completions with dates
- `unplug_stats` - XP, streaks, and last completion date

**Date Tracking**: All entries automatically include the date (ISO format: YYYY-MM-DD) for accurate time-based tracking. You can view your check-in history sorted by date, and streaks are calculated based on consecutive days.

## Design

The app features a premium, modern design with:
- Glassmorphism effects
- Smooth animations and transitions
- Gradient accents
- Mobile-first responsive layout
- Apple-style system fonts

## License

MIT

## Author

Built with ❤️ for digital wellness


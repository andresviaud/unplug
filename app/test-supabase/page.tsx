'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/Card'
import Button from '@/components/Button'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Check if environment variables are loaded
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || supabaseUrl.includes('your-project-url') || supabaseUrl.includes('placeholder')) {
        setStatus('error')
        setMessage(`❌ Supabase URL not configured. Check your .env.local file. Current value: ${supabaseUrl ? 'Set but invalid' : 'Missing'}`)
        return
      }
      
      if (!supabaseKey || supabaseKey.includes('your-anon-key') || supabaseKey.includes('placeholder')) {
        setStatus('error')
        setMessage(`❌ Supabase Anon Key not configured. Check your .env.local file. Current value: ${supabaseKey ? 'Set but invalid' : 'Missing'}`)
        return
      }

      const supabase = createClient()
      
      // Test 1: Check if we can connect
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setStatus('error')
        setMessage(`Connection Error: ${sessionError.message}\n\nCode: ${sessionError.status || 'N/A'}\n\nThis usually means:\n- Wrong Supabase URL or Key\n- Network/CORS issue\n- Supabase project is paused`)
        return
      }

      // Test 2: Try to query animals table
      const { data: animals, error: animalsError } = await supabase
        .from('animals')
        .select('*')
        .limit(1)

      if (animalsError) {
        setStatus('error')
        let errorDetails = `Database Error: ${animalsError.message}\n\nCode: ${animalsError.code || 'N/A'}\n\n`
        
        if (animalsError.code === 'PGRST116' || animalsError.message.includes('relation') || animalsError.message.includes('does not exist')) {
          errorDetails += '⚠️ The "animals" table does not exist. Did you run the SQL schema files in Supabase?\n\nGo to: Supabase Dashboard > SQL Editor > Run supabase-schema.sql and supabase-seed-animals.sql'
        } else if (animalsError.code === '42501' || animalsError.message.includes('permission denied')) {
          errorDetails += '⚠️ Permission denied. Check Row Level Security (RLS) policies in Supabase.'
        } else {
          errorDetails += 'Check:\n- Tables exist in Supabase\n- RLS policies are set up\n- Your Supabase project is active'
        }
        
        setMessage(errorDetails)
        return
      }

      // Test 3: Check if user is logged in
      if (session?.user) {
        setUser(session.user)
      }

      setStatus('success')
      setMessage(`✅ Connected! Found ${animals?.length || 0} animals in database.`)
    } catch (error: any) {
      setStatus('error')
      setMessage(`Unexpected Error: ${error.message}\n\n${error.stack || ''}`)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        {status === 'testing' && (
          <div className="text-gray-600">Testing connection...</div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
              {message}
            </div>
            {user && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="font-semibold text-blue-900">Logged in as:</p>
                <p className="text-blue-700">{user.email}</p>
                <Button onClick={handleSignOut} variant="secondary" className="mt-2">
                  Sign Out
                </Button>
              </div>
            )}
            {!user && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-yellow-700">Not logged in. <a href="/auth/login" className="underline">Sign in</a> to test authentication.</p>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 whitespace-pre-line">
              {message}
            </div>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Quick Checklist:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Restart your dev server after changing .env.local: <code className="bg-gray-100 px-1 rounded">npm run dev</code></li>
                <li>Verify .env.local has real values (not placeholders)</li>
                <li>Run SQL files in Supabase Dashboard &gt; SQL Editor</li>
                <li>Check Supabase project is not paused</li>
                <li>Verify URL format: <code className="bg-gray-100 px-1 rounded">https://xxxxx.supabase.co</code></li>
              </ol>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button onClick={testConnection} variant="secondary">
            Test Again
          </Button>
        </div>
      </Card>
    </div>
  )
}


// Test script to verify Supabase connection
import { createClient } from './client'

export async function testConnection() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('_test').select('1').limit(1)
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "relation does not exist" which is fine - it means we're connected
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, message: 'Connected to Supabase!' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


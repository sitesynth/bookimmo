import { createClient } from '@supabase/supabase-js'

const FALLBACK_SUPABASE_URL = 'https://nmgeamuyqzgdjidkzjip.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tZ2VhbXV5cXpnZGppZGt6amlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzAwNDEsImV4cCI6MjA4ODIwNjA0MX0.q03QxEoTpE4_XHZzlrPXeCCthIFbaQHkMMTPhOCpMAY'

function readRuntimeConfig() {
  if (typeof window === 'undefined') return {}
  return window.__BOOKIMMO_CONFIG__ || {}
}

const runtimeConfig = readRuntimeConfig()
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || runtimeConfig.VITE_SUPABASE_URL
  || runtimeConfig.SUPABASE_URL
  || FALLBACK_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || runtimeConfig.VITE_SUPABASE_ANON_KEY
  || runtimeConfig.SUPABASE_ANON_KEY
  || FALLBACK_SUPABASE_ANON_KEY

const isConfigured = supabaseUrl && !supabaseUrl.includes('YOUR_PROJECT') &&
                     supabaseKey && !supabaseKey.includes('YOUR_ANON_KEY')

const authStub = {
  signUp: async () => { console.warn('Supabase not configured'); return { error: new Error('Supabase not configured') } },
  signInWithPassword: async () => { console.warn('Supabase not configured'); return { error: new Error('Supabase not configured') } },
  signOut: async () => { console.warn('Supabase not configured'); return { error: null } },
  resetPasswordForEmail: async () => { console.warn('Supabase not configured'); return { error: new Error('Supabase not configured') } },
  updateUser: async () => { console.warn('Supabase not configured'); return { error: new Error('Supabase not configured') } },
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : {
      auth: authStub,
      from: () => ({
        insert: async () => {
          console.warn('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
          return { error: new Error('Supabase not configured') }
        },
      }),
    }

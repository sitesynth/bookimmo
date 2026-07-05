import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export function useAuthUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser()
      .then(({ data }) => {
        if (!mounted) return
        setUser(data?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setUser(null)
        setLoading(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      data?.subscription?.unsubscribe?.()
    }
  }, [])

  return { user, loading, isAuthenticated: Boolean(user) }
}

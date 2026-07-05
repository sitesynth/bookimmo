import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api.js'

export function useAuthUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadUser = () => {
      setLoading(true)
      apiRequest('/api/auth/me')
      .then((data) => {
        if (!mounted) return
        setUser(data?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setUser(null)
        setLoading(false)
      })
    }

    loadUser()
    const handleAuthChange = () => loadUser()
    window.addEventListener('bookimmo-auth-changed', handleAuthChange)

    return () => {
      mounted = false
      window.removeEventListener('bookimmo-auth-changed', handleAuthChange)
    }
  }, [])

  return { user, loading, isAuthenticated: Boolean(user) }
}

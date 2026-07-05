import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api.js'
import { useAuthUser } from './useAuthUser.js'

const STORAGE_KEY = 'bookimmo_favorites'

function loadLocalFavorites() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalFavorites(ids) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore persistence errors
  }
}

export function useFavorites() {
  const { user, isAuthenticated, loading: authLoading } = useAuthUser()
  const [favoriteIds, setFavoriteIds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !user) {
      setFavoriteIds(loadLocalFavorites())
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    apiRequest('/api/favorites')
      .then(({ items = [] }) => {
        if (!active) return
        const ids = items.map((item) => String(item.property_id))
        setFavoriteIds(ids)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setFavoriteIds(loadLocalFavorites())
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, user])

  const favoriteSet = useMemo(() => new Set(favoriteIds.map(String)), [favoriteIds])

  const isFavorite = useCallback((propertyId) => favoriteSet.has(String(propertyId)), [favoriteSet])

  const toggleFavorite = useCallback(async (propertyId) => {
    const id = String(propertyId)
    const currentlyFavorite = favoriteSet.has(id)

    if (!isAuthenticated || !user) {
      const next = currentlyFavorite
        ? favoriteIds.filter((value) => value !== id)
        : [...favoriteIds, id]
      setFavoriteIds(next)
      saveLocalFavorites(next)
      return { ok: true, requiresAuth: true, isFavorite: !currentlyFavorite }
    }

    if (currentlyFavorite) {
      try {
        await apiRequest(`/api/favorites?propertyId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        })
      } catch (error) {
        return { ok: false, error: error.message, isFavorite: true }
      }

      setFavoriteIds((prev) => prev.filter((value) => value !== id))
      return { ok: true, isFavorite: false }
    }

    try {
      await apiRequest('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ propertyId: id }),
      })
    } catch (error) {
      return { ok: false, error: error.message, isFavorite: false }
    }

    setFavoriteIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    return { ok: true, isFavorite: true }
  }, [favoriteIds, favoriteSet, isAuthenticated, user])

  return {
    favoriteIds,
    favoriteCount: favoriteIds.length,
    isFavorite,
    toggleFavorite,
    loading: loading || authLoading,
    isAuthenticated,
  }
}

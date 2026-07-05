import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuthUser } from './useAuthUser.js'

const STORAGE_KEY = 'bookimmo_workspace_saved_searches_v1'
const MAX_SAVED_SEARCHES = 8

function normalizeSavedSearch(item = {}) {
  const filters = item.filters || item.filters_payload || {}

  return {
    id: item.id,
    name: item.name || 'Saved search',
    summary: item.summary || filters.__summary || '',
    filters,
    notificationsEnabled: Boolean(item.notifications_enabled ?? item.notificationsEnabled),
    createdAt: item.created_at || item.createdAt || '',
    updatedAt: item.updated_at || item.updatedAt || item.created_at || item.createdAt || '',
  }
}

function loadLocalSavedSearches() {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeSavedSearch) : []
  } catch {
    return []
  }
}

function saveLocalSavedSearches(items) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_SAVED_SEARCHES)))
  } catch {
    // ignore persistence errors
  }
}

export function useSavedSearches() {
  const { user, isAuthenticated, loading: authLoading } = useAuthUser()
  const [savedSearches, setSavedSearches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !user) {
      setSavedSearches(loadLocalSavedSearches())
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    supabase
      .from('saved_searches')
      .select('id,name,filters,notifications_enabled,created_at,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(MAX_SAVED_SEARCHES)
      .then(({ data, error }) => {
        if (!active) return

        if (error) {
          setSavedSearches(loadLocalSavedSearches())
          setLoading(false)
          return
        }

        setSavedSearches((data || []).map(normalizeSavedSearch))
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setSavedSearches(loadLocalSavedSearches())
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, user])

  const saveSearch = useCallback(async ({
    searchId,
    name,
    summary,
    filters,
    notificationsEnabled = false,
  }) => {
    const now = new Date().toISOString()
    const normalizedFilters = {
      ...(filters || {}),
      __summary: summary || filters?.__summary || '',
    }

    if (!isAuthenticated || !user) {
      const nextItem = normalizeSavedSearch({
        id: searchId || `guest-search-${Date.now()}`,
        name,
        summary,
        filters: normalizedFilters,
        notifications_enabled: notificationsEnabled,
        created_at: now,
        updated_at: now,
      })

      const current = loadLocalSavedSearches()
      const next = [nextItem, ...current.filter((item) => String(item.id) !== String(nextItem.id))]
        .slice(0, MAX_SAVED_SEARCHES)
      saveLocalSavedSearches(next)
      setSavedSearches(next)
      return { ok: true, requiresAuth: true, item: nextItem }
    }

    const payload = {
      user_id: user.id,
      name,
      filters: normalizedFilters,
      notifications_enabled: notificationsEnabled,
      updated_at: now,
    }

    if (searchId) {
      payload.id = searchId
    } else {
      payload.created_at = now
    }

    const { data, error } = await supabase
      .from('saved_searches')
      .upsert(payload)
      .select('id,name,filters,notifications_enabled,created_at,updated_at')
      .single()

    if (error) {
      const fallbackItem = normalizeSavedSearch({
        id: searchId || `fallback-search-${Date.now()}`,
        name,
        summary,
        filters: normalizedFilters,
        notifications_enabled: notificationsEnabled,
        created_at: now,
        updated_at: now,
      })

      const current = loadLocalSavedSearches()
      const next = [fallbackItem, ...current.filter((item) => String(item.id) !== String(fallbackItem.id))]
        .slice(0, MAX_SAVED_SEARCHES)
      saveLocalSavedSearches(next)
      setSavedSearches(next)
      return { ok: true, fallbackLocal: true, item: fallbackItem }
    }

    const nextItem = normalizeSavedSearch(data)
    setSavedSearches((current) => [nextItem, ...current.filter((item) => String(item.id) !== String(nextItem.id))]
      .slice(0, MAX_SAVED_SEARCHES))
    return { ok: true, item: nextItem }
  }, [isAuthenticated, user])

  const deleteSearch = useCallback(async (searchId) => {
    if (!searchId) return { ok: true }

    if (!isAuthenticated || !user) {
      const next = loadLocalSavedSearches().filter((item) => String(item.id) !== String(searchId))
      saveLocalSavedSearches(next)
      setSavedSearches(next)
      return { ok: true, requiresAuth: true }
    }

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', searchId)
      .eq('user_id', user.id)

    if (error) {
      const next = loadLocalSavedSearches().filter((item) => String(item.id) !== String(searchId))
      saveLocalSavedSearches(next)
      setSavedSearches((current) => current.filter((item) => String(item.id) !== String(searchId)))
      return { ok: true, fallbackLocal: true, next }
    }

    setSavedSearches((current) => current.filter((item) => String(item.id) !== String(searchId)))
    return { ok: true }
  }, [isAuthenticated, user])

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    loading: loading || authLoading,
    isAuthenticated,
  }
}

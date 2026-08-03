import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api.js'
import { useAuthUser } from './useAuthUser.js'

const STORAGE_KEY = 'bookimmo_application_drafts'

function loadLocalDrafts() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalDrafts(drafts) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch {
    // ignore persistence errors
  }
}

function normalizeApplication(item = {}) {
  return {
    id: item.id,
    propertyId: String(item.property_id || item.propertyId || ''),
    title: item.title || '',
    status: item.status || 'draft',
    stage: item.stage || item.status || 'draft',
    coverMessage: item.cover_message || item.coverMessage || '',
    sourceChannel: item.source_channel || item.sourceChannel || '',
    providerSource: item.provider_source || item.providerSource || '',
    providerExposeId: item.provider_expose_id || item.providerExposeId || '',
    providerConversationId: item.provider_conversation_id || item.providerConversationId || '',
    assignedAgentId: item.assigned_agent_id || item.assignedAgentId || '',
    stageUpdatedAt: item.stage_updated_at || item.stageUpdatedAt || '',
    lastMessageAt: item.last_message_at || item.lastMessageAt || '',
    lastMessagePreview: item.last_message_preview || item.lastMessagePreview || '',
    unreadCount: Number(item.unread_count || item.unreadCount || 0),
    conversationState: item.conversation_state || item.conversationState || 'none',
    createdAt: item.created_at || item.createdAt || '',
    updatedAt: item.updated_at || item.updatedAt || '',
  }
}

function inferProviderExposeId(property = {}) {
  const source = String(property.source || '').trim().toLowerCase()
  const rawId = String(property.id || property.externalId || '').trim()
  if (!source || !rawId) return ''
  if (source === 'is24' || source === 'immowelt') return rawId
  return ''
}

export function useApplications() {
  const { user, isAuthenticated, loading: authLoading } = useAuthUser()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !user) {
      setApplications(loadLocalDrafts().map(normalizeApplication))
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    apiRequest('/api/applications')
      .then(({ items = [] }) => {
        if (!active) return
        setApplications(items.map(normalizeApplication))
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setApplications(loadLocalDrafts().map(normalizeApplication))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, user])

  const createDraftApplication = useCallback(async ({ property }) => {
    const propertyId = String(property.id)
    const now = new Date().toISOString()

    if (!isAuthenticated || !user) {
      const drafts = loadLocalDrafts().map(normalizeApplication)
      const nextDraft = {
        id: `guest-${propertyId}`,
        propertyId,
        title: property.title,
        createdAt: now,
        updatedAt: now,
        status: 'draft',
        coverMessage: '',
      }
      const deduped = [nextDraft, ...drafts.filter((draft) => draft.propertyId !== propertyId)]
      saveLocalDrafts(deduped)
      setApplications(deduped)
      return { ok: true, requiresAuth: true, id: nextDraft.id, status: 'draft' }
    }

    const payload = {
      propertyId,
      status: 'draft',
      coverMessage: null,
      sourceChannel: 'client_cabinet_search',
      providerSource: property.source || null,
      providerExposeId: inferProviderExposeId(property) || null,
    }

    let data
    try {
      const response = await apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      data = response.item
    } catch {
      const drafts = loadLocalDrafts().map(normalizeApplication)
      const nextDraft = {
        id: `fallback-${propertyId}`,
        propertyId,
        title: property.title,
        createdAt: now,
        updatedAt: now,
        status: 'draft',
        coverMessage: '',
      }
      const deduped = [nextDraft, ...drafts.filter((draft) => draft.propertyId !== propertyId)]
      saveLocalDrafts(deduped)
      setApplications(deduped)
      return { ok: true, fallbackLocal: true, id: nextDraft.id, status: 'draft' }
    }

    setApplications((prev) => {
      const nextItem = normalizeApplication(data)
      const remaining = prev.filter((item) => String(item.propertyId) !== propertyId)
      return [nextItem, ...remaining]
    })

    return { ok: true, id: data?.id, status: data?.status || 'draft' }
  }, [isAuthenticated, user])

  const updateApplication = useCallback(async (applicationId, updates) => {
    const now = new Date().toISOString()
    setSaving(true)

    const localUpdater = (current) => current.map((item) => (
      String(item.id) === String(applicationId)
        ? { ...item, ...updates, updatedAt: now }
        : item
    ))

    if (!isAuthenticated || !user) {
      const next = localUpdater(loadLocalDrafts().map(normalizeApplication))
      saveLocalDrafts(next)
      setApplications(next)
      setSaving(false)
      return { ok: true, localOnly: true }
    }

    const payload = {
      ...(updates.coverMessage !== undefined ? { cover_message: updates.coverMessage || null } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      updated_at: now,
    }

    try {
      await apiRequest('/api/applications', {
        method: 'PUT',
        body: JSON.stringify({
          id: applicationId,
          status: payload.status,
          coverMessage: payload.cover_message,
        }),
      })
    } catch {
      const next = localUpdater(loadLocalDrafts().map(normalizeApplication))
      saveLocalDrafts(next)
      setApplications(next)
      setSaving(false)
      return { ok: true, fallbackLocal: true }
    }

    setApplications((prev) => localUpdater(prev))
    setSaving(false)
    return { ok: true }
  }, [isAuthenticated, user])

  const draftCount = useMemo(
    () => applications.filter((item) => item.status === 'draft').length,
    [applications],
  )

  const submittedCount = useMemo(
    () => applications.filter((item) => item.status === 'submitted').length,
    [applications],
  )

  return {
    createDraftApplication,
    updateApplication,
    applications,
    loading: loading || authLoading,
    saving,
    applicationCount: applications.length,
    draftCount,
    submittedCount,
    isAuthenticated,
  }
}

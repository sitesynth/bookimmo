import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api.js'

function normalizeItem(item = {}) {
  return {
    id: item.id,
    userId: item.user_id || '',
    propertyId: String(item.property_id || ''),
    status: item.status || 'draft',
    coverMessage: item.cover_message || '',
    sourceChannel: item.source_channel || '',
    providerSource: item.provider_source || '',
    providerExposeId: item.provider_expose_id || '',
    providerConversationId: item.provider_conversation_id || '',
    assignedAgentId: item.assigned_agent_id || '',
    stage: item.stage || 'draft',
    stageUpdatedAt: item.stage_updated_at || '',
    lastMessageAt: item.last_message_at || '',
    lastMessagePreview: item.last_message_preview || '',
    unreadCount: Number(item.unread_count || 0),
    conversationState: item.conversation_state || 'none',
    createdAt: item.created_at || '',
    updatedAt: item.updated_at || '',
    client: {
      email: item.client_email || '',
      name: item.client_name || '',
      phone: item.client_phone || '',
      city: item.client_city || '',
      budget: item.client_budget || '',
      moveInDate: item.client_move_in_date || '',
      preferredDistricts: item.client_preferred_districts || '',
    },
    listing: {
      source: item.listing_source || item.provider_source || '',
      externalId: item.listing_external_id || item.provider_expose_id || '',
      slug: item.listing_slug || '',
      title: item.listing_title || '',
      address: item.listing_address || item.provider_listing_address || '',
      postcode: item.listing_postcode || '',
      district: item.listing_district || '',
      price: item.listing_price || '',
      priceLabel: item.listing_price_label || '',
      rooms: item.listing_rooms || '',
      areaSqm: item.listing_area_sqm || '',
      imageUrl: item.listing_image_url || '',
      sourceUrl: item.listing_source_url || '',
      listingType: item.listing_type || '',
      cityHint: item.listing_city_hint || '',
    },
    providerThread: {
      providerListingAddress: item.provider_listing_address || '',
      counterpartyName: item.counterparty_name || '',
      counterpartyRole: item.counterparty_role || '',
      accountLabel: item.account_label || '',
    },
  }
}

export function useAgentWorkspace(filters) {
  const [agent, setAgent] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()
        if (filters?.stage) params.set('stage', filters.stage)
        if (filters?.providerSource) params.set('providerSource', filters.providerSource)
        if (filters?.city) params.set('city', filters.city)
        if (filters?.search) params.set('search', filters.search)

        const [agentData, applicationData] = await Promise.all([
          apiRequest('/api/agent/me'),
          apiRequest(`/api/agent/applications${params.toString() ? `?${params.toString()}` : ''}`),
        ])

        if (!active) return
        setAgent(agentData.agent || null)
        setApplications((applicationData.items || []).map(normalizeItem))
      } catch (loadError) {
        if (!active) return
        setError(String(loadError?.message || 'Failed to load agent workspace'))
        setAgent(null)
        setApplications([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [filters?.city, filters?.providerSource, filters?.search, filters?.stage])

  const updateApplication = useCallback(async (id, updates = {}) => {
    setSaving(true)
    setError('')

    try {
      await apiRequest('/api/agent/applications', {
        method: 'PUT',
        body: JSON.stringify({
          id,
          stage: updates.stage,
          status: updates.status,
          conversationState: updates.conversationState,
          unreadCount: updates.unreadCount,
          agentNote: updates.agentNote,
        }),
      })

      setApplications((current) => current.map((item) => (
        String(item.id) === String(id)
          ? {
              ...item,
              ...(updates.stage !== undefined ? { stage: updates.stage } : {}),
              ...(updates.status !== undefined ? { status: updates.status } : {}),
              ...(updates.conversationState !== undefined ? { conversationState: updates.conversationState } : {}),
              ...(updates.unreadCount !== undefined ? { unreadCount: updates.unreadCount } : {}),
            }
          : item
      )))

      return { ok: true }
    } catch (saveError) {
      setError(String(saveError?.message || 'Failed to update application'))
      return { ok: false }
    } finally {
      setSaving(false)
    }
  }, [])

  const summary = useMemo(() => ({
    total: applications.length,
    attention: applications.filter((item) => ['reply_received', 'viewing_requested', 'documents_requested'].includes(item.stage)).length,
    is24: applications.filter((item) => item.providerSource === 'is24').length,
    crm: applications.filter((item) => item.sourceChannel === 'agency_crm').length,
  }), [applications])

  return {
    agent,
    applications,
    loading,
    saving,
    error,
    updateApplication,
    summary,
  }
}

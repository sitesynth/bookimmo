import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api.js'
import { useAuthUser } from './useAuthUser.js'

function normalizeEvent(item = {}) {
  return {
    id: item.id || '',
    eventType: item.event_type || item.eventType || '',
    eventSource: item.event_source || item.eventSource || '',
    actorRole: item.actor_role || item.actorRole || '',
    title: item.title || '',
    body: item.body || '',
    payload: item.payload || {},
    occurredAt: item.occurred_at || item.occurredAt || '',
    createdAt: item.created_at || item.createdAt || '',
  }
}

function normalizeMessage(item = {}) {
  return {
    id: item.id || '',
    providerSource: item.provider_source || item.providerSource || '',
    externalThreadId: item.external_thread_id || item.externalThreadId || '',
    externalMessageId: item.external_message_id || item.externalMessageId || '',
    direction: item.direction || 'inbound',
    senderRole: item.sender_role || item.senderRole || '',
    senderName: item.sender_name || item.senderName || '',
    subject: item.subject || '',
    bodyText: item.body_text || item.bodyText || '',
    bodyHtml: item.body_html || item.bodyHtml || '',
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    messageTimestamp: item.message_timestamp || item.messageTimestamp || '',
    isUnreadForClient: Boolean(item.is_unread_for_client ?? item.isUnreadForClient),
    rawPayload: item.raw_payload || item.rawPayload || {},
    createdAt: item.created_at || item.createdAt || '',
  }
}

function normalizeProviderThread(item = null) {
  if (!item) return null
  return {
    id: item.id || '',
    providerSource: item.provider_source || item.providerSource || '',
    providerConversationId: item.provider_conversation_id || item.providerConversationId || '',
    providerExposeId: item.provider_expose_id || item.providerExposeId || '',
    providerListingAddress: item.provider_listing_address || item.providerListingAddress || '',
    counterpartyName: item.counterparty_name || item.counterpartyName || '',
    counterpartyRole: item.counterparty_role || item.counterpartyRole || '',
    accountLabel: item.account_label || item.accountLabel || '',
    lastMessageAt: item.last_message_at || item.lastMessageAt || '',
    lastMessagePreview: item.last_message_preview || item.lastMessagePreview || '',
    rawPayload: item.raw_payload || item.rawPayload || {},
    linkedAt: item.linked_at || item.linkedAt || '',
    lastSyncedAt: item.last_synced_at || item.lastSyncedAt || '',
    createdAt: item.created_at || item.createdAt || '',
    updatedAt: item.updated_at || item.updatedAt || '',
  }
}

export function useApplicationThread(application) {
  const { isAuthenticated, loading: authLoading } = useAuthUser()
  const [thread, setThread] = useState({
    application: null,
    providerThread: null,
    events: [],
    messages: [],
  })
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !application?.id) {
      setThread({
        application: null,
        providerThread: null,
        events: [],
        messages: [],
      })
      setLoading(false)
      setSyncing(false)
      setError('')
      return
    }

    let active = true

    async function loadThread() {
      setLoading(true)
      setError('')

      try {
        if (application.providerSource === 'is24' && application.providerExposeId) {
          setSyncing(true)
          try {
            await apiRequest('/api/applications-sync', {
              method: 'POST',
              body: JSON.stringify({
                applicationId: application.id,
                providerSource: application.providerSource || 'is24',
              }),
            })
          } finally {
            if (active) setSyncing(false)
          }
        }

        const json = await apiRequest(`/api/applications-thread?id=${encodeURIComponent(application.id)}`)
        if (!active) return
        setThread({
          application: json.application || null,
          providerThread: normalizeProviderThread(json.providerThread),
          events: Array.isArray(json.events) ? json.events.map(normalizeEvent) : [],
          messages: Array.isArray(json.messages) ? json.messages.map(normalizeMessage) : [],
        })
        setLoading(false)
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Could not load application thread.')
        setLoading(false)
        setSyncing(false)
      }
    }

    loadThread()
    return () => {
      active = false
    }
  }, [application?.id, application?.providerExposeId, application?.providerSource, authLoading, isAuthenticated])

  return {
    thread,
    loading: loading || authLoading,
    syncing,
    error,
  }
}

import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api.js'

function normalizeApplication(item = {}) {
  return {
    ...item,
    id: item.id,
    stage: item.stage || 'draft',
    status: item.status || 'draft',
    clientName: item.client_name || '',
    clientEmail: item.client_email || '',
    clientPhone: item.client_phone || '',
    clientCity: item.client_city || '',
    clientAddress: item.client_address || '',
    clientMoveInDate: item.client_move_in_date || '',
    clientBudget: item.client_budget || '',
    clientPreferredDistricts: item.client_preferred_districts || '',
    clientAboutMe: item.client_about_me || '',
  }
}

function normalizeEvent(item = {}) {
  return {
    id: item.id,
    eventType: item.event_type || '',
    eventSource: item.event_source || '',
    actorRole: item.actor_role || '',
    title: item.title || '',
    body: item.body || '',
    payload: item.payload || {},
    occurredAt: item.occurred_at || '',
    createdAt: item.created_at || '',
  }
}

function normalizeMessage(item = {}) {
  return {
    id: item.id,
    providerSource: item.provider_source || '',
    externalThreadId: item.external_thread_id || '',
    externalMessageId: item.external_message_id || '',
    direction: item.direction || '',
    senderRole: item.sender_role || '',
    senderName: item.sender_name || '',
    subject: item.subject || '',
    bodyText: item.body_text || '',
    bodyHtml: item.body_html || '',
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    messageTimestamp: item.message_timestamp || '',
    isUnreadForClient: Boolean(item.is_unread_for_client),
    rawPayload: item.raw_payload || {},
    createdAt: item.created_at || '',
  }
}

export function useAgentApplicationThread(applicationId) {
  const [thread, setThread] = useState({ application: null, events: [], messages: [], providerThread: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!applicationId) {
      setThread({ application: null, events: [], messages: [], providerThread: null })
      return
    }

    let active = true
    setLoading(true)
    setError('')

    apiRequest(`/api/agent/application-thread?id=${encodeURIComponent(applicationId)}`)
      .then((data) => {
        if (!active) return
        setThread({
          application: data.application ? normalizeApplication(data.application) : null,
          events: Array.isArray(data.events) ? data.events.map(normalizeEvent) : [],
          messages: Array.isArray(data.messages) ? data.messages.map(normalizeMessage) : [],
          providerThread: data.providerThread || null,
        })
      })
      .catch((loadError) => {
        if (!active) return
        setError(String(loadError?.message || 'Failed to load application thread'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [applicationId])

  return { thread, loading, error }
}

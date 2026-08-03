import { newId, query, sha256 } from './db.js'

function toIsoTimestamp(value, fallback = null) {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function trimPreview(value, limit = 240) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}

function inferConversationState(unreadCount, lastMessageAt) {
  if (Number(unreadCount || 0) > 0) return 'active'
  if (lastMessageAt) return 'synced'
  return 'none'
}

function inferStageFromActivity(kind, currentStage) {
  if (kind === 'reply_received') return 'reply_received'
  if (kind === 'contact_sent') {
    return currentStage && currentStage !== 'draft' ? currentStage : 'waiting_for_reply'
  }
  return currentStage || 'draft'
}

function eventId(applicationId, sourceKey) {
  return `appevt_${sha256(`${applicationId}:${sourceKey}`).slice(0, 24)}`
}

function messageId(applicationId, sourceKey) {
  return `appmsg_${sha256(`${applicationId}:${sourceKey}`).slice(0, 24)}`
}

function normalizeTimelinePayload(row = {}) {
  const data = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    eventType: String(row.event_type || ''),
    occurredAt: toIsoTimestamp(row.timestamp, new Date(0).toISOString()),
    title: row.event_type === 'contact_sent' ? 'Application sent to provider' : 'Provider activity',
    body: row.event_type === 'contact_sent'
      ? `Contact sent for expose ${row.expose_id}.`
      : trimPreview(data.reply_text || data.url || ''),
    payload: {
      rawTimelineId: row.id,
      exposeId: String(row.expose_id || ''),
      ...data,
    },
  }
}

function normalizeReplyPayload(row = {}) {
  return {
    messageTimestamp: toIsoTimestamp(row.reply_timestamp, new Date(0).toISOString()),
    senderName: String(row.sender_name || '').trim() || null,
    bodyText: String(row.reply_text || '').trim(),
    preview: trimPreview(row.reply_text || ''),
    payload: {
      rawReplyId: row.id,
      exposeId: String(row.expose_id || ''),
      senderName: row.sender_name || null,
    },
  }
}

async function upsertThreadLink(application, summary = {}) {
  if (!application?.id) return null
  const providerSource = application.provider_source || summary.providerSource || 'is24'

  const threadResult = await query(
    `SELECT id
     FROM public.application_provider_threads
     WHERE application_id = $1 AND provider_source = $2
     LIMIT 1`,
    [application.id, providerSource],
  )

  const threadId = threadResult.rows[0]?.id || newId()
  await query(
    `INSERT INTO public.application_provider_threads (
       id, application_id, provider_source, provider_conversation_id,
       provider_expose_id, provider_listing_address, counterparty_name,
       counterparty_role, account_label, last_message_at,
       last_message_preview, raw_payload, linked_at, last_synced_at,
       created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW(), NOW(), NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       provider_conversation_id = COALESCE(EXCLUDED.provider_conversation_id, public.application_provider_threads.provider_conversation_id),
       provider_expose_id = COALESCE(EXCLUDED.provider_expose_id, public.application_provider_threads.provider_expose_id),
       provider_listing_address = COALESCE(EXCLUDED.provider_listing_address, public.application_provider_threads.provider_listing_address),
       counterparty_name = COALESCE(EXCLUDED.counterparty_name, public.application_provider_threads.counterparty_name),
       counterparty_role = COALESCE(EXCLUDED.counterparty_role, public.application_provider_threads.counterparty_role),
       account_label = COALESCE(EXCLUDED.account_label, public.application_provider_threads.account_label),
       last_message_at = COALESCE(EXCLUDED.last_message_at, public.application_provider_threads.last_message_at),
       last_message_preview = COALESCE(EXCLUDED.last_message_preview, public.application_provider_threads.last_message_preview),
       raw_payload = CASE
         WHEN EXCLUDED.raw_payload = '{}'::jsonb THEN public.application_provider_threads.raw_payload
         ELSE EXCLUDED.raw_payload
       END,
       last_synced_at = NOW(),
       updated_at = NOW()`,
    [
      threadId,
      application.id,
      providerSource,
      application.provider_conversation_id || summary.providerConversationId || null,
      application.provider_expose_id || summary.providerExposeId || null,
      summary.providerListingAddress || null,
      summary.counterpartyName || null,
      summary.counterpartyRole || null,
      summary.accountLabel || null,
      summary.lastMessageAt || null,
      summary.lastMessagePreview || null,
      JSON.stringify(summary.rawPayload || {}),
    ],
  )

  return threadId
}

async function updateApplicationSummary(application, summary = {}) {
  const unreadCount = Number(summary.unreadCount || 0)
  const lastMessageAt = summary.lastMessageAt || null
  const lastMessagePreview = summary.lastMessagePreview || null
  const stage = summary.stage || application.stage || application.status || 'draft'

  await query(
    `UPDATE public.applications
     SET provider_source = COALESCE($2, provider_source),
         provider_expose_id = COALESCE($3, provider_expose_id),
         provider_conversation_id = COALESCE($4, provider_conversation_id),
         stage = COALESCE($5, stage),
         stage_updated_at = CASE
           WHEN $5 IS NOT NULL AND $5 IS DISTINCT FROM stage THEN NOW()
           ELSE stage_updated_at
         END,
         last_message_at = COALESCE($6, last_message_at),
         last_message_preview = COALESCE($7, last_message_preview),
         unread_count = GREATEST(COALESCE($8, unread_count), unread_count),
         conversation_state = COALESCE($9, conversation_state),
         updated_at = NOW()
     WHERE id = $1`,
    [
      application.id,
      application.provider_source || summary.providerSource || 'is24',
      application.provider_expose_id || summary.providerExposeId || null,
      application.provider_conversation_id || summary.providerConversationId || null,
      stage,
      lastMessageAt,
      lastMessagePreview,
      unreadCount,
      inferConversationState(unreadCount, lastMessageAt),
    ],
  )
}

async function syncSingleApplication(application) {
  const exposeId = String(application.provider_expose_id || '').trim()
  if (!exposeId) {
    return {
      applicationId: application.id,
      exposeId: '',
      insertedEvents: 0,
      insertedMessages: 0,
      skipped: 'missing_expose_id',
    }
  }

  const [timelineResult, repliesResult, apartmentResult] = await Promise.all([
    query(
      `SELECT id, expose_id, event_type, "timestamp", data, created_at
       FROM public.apartment_timeline
       WHERE expose_id = $1
         AND event_type IN ('contact_sent', 'reply_received')
       ORDER BY "timestamp" ASC, created_at ASC`,
      [exposeId],
    ),
    query(
      `SELECT id, expose_id, sender_name, reply_text, reply_timestamp, created_at
       FROM public.apartment_replies
       WHERE expose_id = $1
       ORDER BY reply_timestamp ASC, created_at ASC`,
      [exposeId],
    ),
    query(
      `SELECT id, title, address, url
       FROM public.apartments
       WHERE id = $1
       LIMIT 1`,
      [exposeId],
    ),
  ])

  let insertedEvents = 0
  let insertedMessages = 0
  let latestMessageAt = application.last_message_at || null
  let latestMessagePreview = application.last_message_preview || null
  let stage = application.stage || application.status || 'draft'

  for (const row of timelineResult.rows) {
    const sourceKey = `timeline:${row.id}:${row.event_type}`
    const normalized = normalizeTimelinePayload(row)
    const result = await query(
      `INSERT INTO public.application_events (
         id, application_id, event_type, event_source, actor_role,
         title, body, payload, occurred_at, created_at
       )
       VALUES ($1, $2, $3, 'is24_raw_timeline', $4, $5, $6, $7::jsonb, $8, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        eventId(application.id, sourceKey),
        application.id,
        normalized.eventType,
        normalized.eventType === 'reply_received' ? 'listing_agent' : 'bookimmo_agent',
        normalized.title,
        normalized.body || null,
        JSON.stringify(normalized.payload),
        normalized.occurredAt,
      ],
    )
    if (result.rowCount > 0) insertedEvents += 1
    stage = inferStageFromActivity(normalized.eventType, stage)
  }

  for (const row of repliesResult.rows) {
    const normalized = normalizeReplyPayload(row)
    if (!normalized.bodyText) continue
    const sourceKey = `reply:${row.id}`
    const messageTimestamp = normalized.messageTimestamp
    const result = await query(
      `INSERT INTO public.application_messages (
         id, application_id, provider_source, external_thread_id,
         external_message_id, direction, sender_role, sender_name,
         body_text, attachments, message_timestamp,
         is_unread_for_client, raw_payload, created_at
       )
       VALUES ($1, $2, 'is24', $3, $4, 'inbound', 'listing_agent', $5, $6, '[]'::jsonb, $7, TRUE, $8::jsonb, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [
        messageId(application.id, sourceKey),
        application.id,
        application.provider_conversation_id || null,
        `is24-reply-${row.id}`,
        normalized.senderName,
        normalized.bodyText,
        messageTimestamp,
        JSON.stringify(normalized.payload),
      ],
    )
    if (result.rowCount > 0) {
      insertedMessages += 1
      latestMessageAt = messageTimestamp
      latestMessagePreview = normalized.preview
      stage = inferStageFromActivity('reply_received', stage)
    }
  }

  const providerListingAddress = apartmentResult.rows[0]?.address || null
  const providerListingTitle = apartmentResult.rows[0]?.title || null
  const counterpartyName = repliesResult.rows.at(-1)?.sender_name || null
  const unreadCount = Number(application.unread_count || 0) + insertedMessages

  await updateApplicationSummary(application, {
    providerSource: 'is24',
    providerExposeId: exposeId,
    providerConversationId: application.provider_conversation_id || null,
    lastMessageAt: latestMessageAt,
    lastMessagePreview: latestMessagePreview,
    unreadCount,
    stage,
  })

  await upsertThreadLink(application, {
    providerSource: 'is24',
    providerExposeId: exposeId,
    providerConversationId: application.provider_conversation_id || null,
    providerListingAddress,
    counterpartyName,
    counterpartyRole: counterpartyName ? 'listing_agent' : null,
    lastMessageAt: latestMessageAt,
    lastMessagePreview: latestMessagePreview,
    accountLabel: 'Sergey Zakharov',
    rawPayload: {
      providerListingTitle,
      providerListingAddress,
      apartmentUrl: apartmentResult.rows[0]?.url || null,
    },
  })

  return {
    applicationId: application.id,
    exposeId,
    insertedEvents,
    insertedMessages,
    lastMessageAt: latestMessageAt,
    providerConversationId: application.provider_conversation_id || null,
  }
}

export async function linkProviderThreadForApplication({
  applicationId,
  userId,
  providerSource = 'is24',
  providerConversationId = null,
  providerExposeId = null,
  providerListingAddress = null,
  counterpartyName = null,
  counterpartyRole = null,
  accountLabel = null,
  lastMessageAt = null,
  lastMessagePreview = null,
  rawPayload = {},
}) {
  const applicationResult = await query(
    `SELECT id, user_id, provider_source, provider_expose_id, provider_conversation_id,
            stage, status, unread_count, last_message_at, last_message_preview
     FROM public.applications
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [String(applicationId), String(userId)],
  )

  const application = applicationResult.rows[0]
  if (!application) {
    const error = new Error('Application not found')
    error.statusCode = 404
    throw error
  }

  await query(
    `UPDATE public.applications
     SET provider_source = COALESCE($3, provider_source),
         provider_expose_id = COALESCE($4, provider_expose_id),
         provider_conversation_id = COALESCE($5, provider_conversation_id),
         last_message_at = COALESCE($6, last_message_at),
         last_message_preview = COALESCE($7, last_message_preview),
         conversation_state = CASE
           WHEN COALESCE($5, provider_conversation_id) IS NOT NULL THEN 'linked'
           ELSE conversation_state
         END,
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [
      application.id,
      application.user_id,
      providerSource,
      providerExposeId,
      providerConversationId,
      lastMessageAt,
      lastMessagePreview,
    ],
  )

  await upsertThreadLink(
    {
      ...application,
      provider_source: providerSource || application.provider_source,
      provider_expose_id: providerExposeId || application.provider_expose_id,
      provider_conversation_id: providerConversationId || application.provider_conversation_id,
    },
    {
      providerSource,
      providerExposeId,
      providerConversationId,
      providerListingAddress,
      counterpartyName,
      counterpartyRole,
      accountLabel,
      lastMessageAt,
      lastMessagePreview,
      rawPayload,
    },
  )

  const refreshed = await query(
    `SELECT id, property_id, status, cover_message, source_channel,
            provider_source, provider_expose_id, provider_conversation_id,
            assigned_agent_id, stage, stage_updated_at, last_message_at,
            last_message_preview, unread_count, conversation_state,
            created_at, updated_at
     FROM public.applications
     WHERE id = $1
     LIMIT 1`,
    [application.id],
  )

  return refreshed.rows[0]
}

export async function syncApplicationMessagingForUser({
  userId,
  applicationId = null,
  providerSource = 'is24',
}) {
  const filters = [`user_id = $1`, `COALESCE(provider_source, 'is24') = $2`]
  const params = [String(userId), String(providerSource)]

  if (applicationId) {
    params.push(String(applicationId))
    filters.push(`id = $${params.length}`)
  }

  const applicationsResult = await query(
    `SELECT id, user_id, property_id, status, stage, unread_count,
            last_message_at, last_message_preview,
            provider_source, provider_expose_id, provider_conversation_id
     FROM public.applications
     WHERE ${filters.join(' AND ')}
     ORDER BY updated_at DESC`,
    params,
  )

  const items = []
  let totalEvents = 0
  let totalMessages = 0

  for (const application of applicationsResult.rows) {
    const synced = await syncSingleApplication(application)
    items.push(synced)
    totalEvents += synced.insertedEvents
    totalMessages += synced.insertedMessages
  }

  return {
    providerSource,
    scannedApplications: applicationsResult.rows.length,
    insertedEvents: totalEvents,
    insertedMessages: totalMessages,
    items,
  }
}

import { requireUser } from './_lib/auth.js'
import { proxyToBridge } from './_lib/bridge.js'
import { query } from './_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  const user = await requireUser(req, res)
  if (!user) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const id = String(req.query?.id || req.query?.applicationId || '')
  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const applicationResult = await query(
    `SELECT id, property_id, status, cover_message, source_channel,
            provider_source, provider_expose_id, provider_conversation_id,
            assigned_agent_id, stage, stage_updated_at, last_message_at,
            last_message_preview, unread_count, conversation_state,
            created_at, updated_at
     FROM public.applications
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, user.id],
  )

  const application = applicationResult.rows[0]
  if (!application) {
    return res.status(404).json({ error: 'Application not found' })
  }

  const [eventsResult, messagesResult, threadResult] = await Promise.all([
    query(
      `SELECT id, application_id, event_type, event_source, actor_role,
              title, body, payload, occurred_at, created_at
       FROM public.application_events
       WHERE application_id = $1
       ORDER BY occurred_at DESC, created_at DESC`,
      [id],
    ),
    query(
      `SELECT id, application_id, provider_source, external_thread_id,
              external_message_id, direction, sender_role, sender_name,
              subject, body_text, body_html, attachments, message_timestamp,
              is_unread_for_client, raw_payload, created_at
      FROM public.application_messages
      WHERE application_id = $1
      ORDER BY message_timestamp DESC, created_at DESC`,
      [id],
    ),
    query(
      `SELECT id, provider_source, provider_conversation_id, provider_expose_id,
              provider_listing_address, counterparty_name, counterparty_role,
              account_label, last_message_at, last_message_preview,
              raw_payload, linked_at, last_synced_at, created_at, updated_at
       FROM public.application_provider_threads
       WHERE application_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [id],
    ),
  ])

  return res.status(200).json({
    application,
    events: eventsResult.rows,
    messages: messagesResult.rows,
    providerThread: threadResult.rows[0] || null,
  })
}

import { requireAgent } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { query } from '../_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const agent = await requireAgent(req, res)
  if (!agent) return

  const id = String(req.query?.id || req.query?.applicationId || '')
  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  const applicationResult = await query(
    `SELECT a.id, a.user_id, a.property_id, a.status, a.cover_message, a.source_channel,
            a.provider_source, a.provider_expose_id, a.provider_conversation_id,
            a.assigned_agent_id, a.stage, a.stage_updated_at, a.last_message_at,
            a.last_message_preview, a.unread_count, a.conversation_state,
            a.created_at, a.updated_at,
            u.email AS client_email,
            COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), u.name, u.email) AS client_name,
            p.phone AS client_phone,
            p.current_city AS client_city,
            p.current_address AS client_address,
            p.move_in_date AS client_move_in_date,
            p.max_budget AS client_budget,
            p.preferred_districts AS client_preferred_districts,
            p.about_me AS client_about_me
     FROM public.applications a
     JOIN public.app_users u ON u.id = a.user_id
     LEFT JOIN public.profiles p ON p.user_id = u.id
     WHERE a.id = $1 AND a.assigned_agent_id = $2
     LIMIT 1`,
    [id, agent.id],
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

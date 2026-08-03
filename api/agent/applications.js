import { requireAgent } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { newId, query } from '../_lib/db.js'

function normalizeStage(stage) {
  return String(stage || '').trim().toLowerCase() || null
}

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  const agent = await requireAgent(req, res)
  if (!agent) return

  if (req.method === 'GET') {
    const stage = normalizeStage(req.query?.stage)
    const providerSource = String(req.query?.providerSource || '').trim().toLowerCase()
    const city = String(req.query?.city || '').trim().toLowerCase()
    const search = String(req.query?.search || '').trim().toLowerCase()

    const clauses = ['a.assigned_agent_id = $1']
    const params = [agent.id]

    if (stage) {
      params.push(stage)
      clauses.push(`lower(a.stage) = $${params.length}`)
    }

    if (providerSource) {
      params.push(providerSource)
      clauses.push(`lower(COALESCE(a.provider_source, '')) = $${params.length}`)
    }

    if (city) {
      params.push(city)
      clauses.push(`(
        lower(COALESCE(agent_listing.city_hint, '')) = $${params.length}
        OR lower(COALESCE(agent_listing.district, '')) = $${params.length}
        OR lower(COALESCE(ap.base_city, '')) = $${params.length}
      )`)
    }

    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(`(
        lower(COALESCE(agent_listing.title, '')) LIKE $${idx}
        OR lower(COALESCE(agent_listing.address, '')) LIKE $${idx}
        OR lower(COALESCE(u.email, '')) LIKE $${idx}
        OR lower(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) LIKE $${idx}
      )`)
    }

    const result = await query(
      `SELECT a.id, a.user_id, a.property_id, a.status, a.cover_message, a.source_channel,
              a.provider_source, a.provider_expose_id, a.provider_conversation_id,
              a.assigned_agent_id, a.stage, a.stage_updated_at, a.last_message_at,
              a.last_message_preview, a.unread_count, a.conversation_state,
              a.created_at, a.updated_at,
              u.email AS client_email,
              COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), u.name, u.email) AS client_name,
              p.phone AS client_phone,
              p.current_city AS client_city,
              p.max_budget AS client_budget,
              p.move_in_date AS client_move_in_date,
              p.preferred_districts AS client_preferred_districts,
              agent_listing.source AS listing_source,
              agent_listing.external_id AS listing_external_id,
              agent_listing.slug AS listing_slug,
              agent_listing.title AS listing_title,
              agent_listing.address AS listing_address,
              agent_listing.postcode AS listing_postcode,
              agent_listing.district AS listing_district,
              agent_listing.price AS listing_price,
              agent_listing.price_label AS listing_price_label,
              agent_listing.rooms AS listing_rooms,
              agent_listing.area_sqm AS listing_area_sqm,
              agent_listing.image_url AS listing_image_url,
              agent_listing.source_url AS listing_source_url,
              agent_listing.listing_type AS listing_type,
              agent_listing.city_hint AS listing_city_hint,
              apt.provider_listing_address,
              apt.counterparty_name,
              apt.counterparty_role,
              apt.account_label
       FROM public.applications a
       JOIN public.app_users u ON u.id = a.user_id
       LEFT JOIN public.profiles p ON p.user_id = u.id
       LEFT JOIN public.agent_profiles ap ON ap.user_id = a.assigned_agent_id
       LEFT JOIN public.application_provider_threads apt
         ON apt.application_id = a.id
        AND apt.provider_source = COALESCE(a.provider_source, apt.provider_source)
       LEFT JOIN LATERAL (
         SELECT lc.source, lc.external_id, lc.slug, lc.title, lc.address, lc.postcode,
                lc.district, lc.price, lc.price_label, lc.rooms, lc.area_sqm,
                lc.image_url, lc.source_url, lc.listing_type,
                split_part(COALESCE(lc.address, ''), ',', 3) AS city_hint
         FROM public.listings_cache lc
         WHERE (
           COALESCE(a.provider_source, '') <> ''
           AND lower(lc.source) = lower(a.provider_source)
           AND lc.external_id = COALESCE(a.provider_expose_id, a.property_id)
         ) OR (
           COALESCE(a.provider_source, '') = ''
           AND lc.external_id = a.property_id
         )
         ORDER BY lc.imported_at DESC
         LIMIT 1
       ) agent_listing ON TRUE
       WHERE ${clauses.join(' AND ')}
       ORDER BY COALESCE(a.last_message_at, a.updated_at) DESC, a.updated_at DESC`,
      params,
    )

    return res.status(200).json({ items: result.rows })
  }

  if (req.method === 'PUT') {
    const {
      id,
      stage = null,
      status = null,
      conversationState = null,
      unreadCount = null,
      agentNote = null,
    } = req.body || {}

    if (!id) return res.status(400).json({ error: 'id is required' })

    const updateResult = await query(
      `UPDATE public.applications
       SET stage = COALESCE($3, stage),
           stage_updated_at = CASE WHEN $3 IS NOT NULL THEN NOW() ELSE stage_updated_at END,
           status = COALESCE($4, status),
           conversation_state = COALESCE($5, conversation_state),
           unread_count = COALESCE($6, unread_count),
           updated_at = NOW()
       WHERE id = $1 AND assigned_agent_id = $2
       RETURNING id`,
      [
        String(id),
        agent.id,
        normalizeStage(stage),
        status ? String(status).trim().toLowerCase() : null,
        conversationState ? String(conversationState).trim().toLowerCase() : null,
        Number.isFinite(Number(unreadCount)) ? Number(unreadCount) : null,
      ],
    )

    if (!updateResult.rows[0]) {
      return res.status(404).json({ error: 'Application not found' })
    }

    if (agentNote && String(agentNote).trim()) {
      await query(
        `INSERT INTO public.application_events (
           id, application_id, event_type, event_source, actor_role,
           title, body, payload, occurred_at, created_at
         )
         VALUES ($1, $2, 'agent_note', 'agent_workspace', 'bookimmo_agent',
                 $3, $4, '{}'::jsonb, NOW(), NOW())`,
        [
          newId(),
          String(id),
          'Agent note',
          String(agentNote).trim(),
        ],
      )
    }

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

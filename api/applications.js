import { requireUser } from './_lib/auth.js'
import { pickAssignedAgent } from './_lib/agent-routing.js'
import { proxyToBridge } from './_lib/bridge.js'
import { newId, query } from './_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  const user = await requireUser(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const result = await query(
      `SELECT id, property_id, status, cover_message, source_channel,
              provider_source, provider_expose_id, provider_conversation_id,
              assigned_agent_id, stage, stage_updated_at, last_message_at,
              last_message_preview, unread_count, conversation_state,
              created_at, updated_at
       FROM public.applications
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [user.id],
    )
    return res.status(200).json({ items: result.rows })
  }

  if (req.method === 'POST') {
    const {
      propertyId,
      status = 'draft',
      coverMessage = null,
      sourceChannel = 'client_cabinet_search',
      providerSource = null,
      providerExposeId = null,
      providerConversationId = null,
      assignedAgentId = null,
      stage = 'draft',
    } = req.body || {}
    if (!propertyId) return res.status(400).json({ error: 'propertyId is required' })

    const normalizedPropertyId = String(propertyId)
    const normalizedProviderSource = providerSource ? String(providerSource).trim().toLowerCase() : null
    const normalizedProviderExposeId = providerExposeId
      ? String(providerExposeId).trim()
      : (normalizedProviderSource === 'is24' || normalizedProviderSource === 'immowelt' ? normalizedPropertyId : null)

    const routedAgent = assignedAgentId
      ? { userId: String(assignedAgentId) }
      : await pickAssignedAgent({
          providerSource: normalizedProviderSource || '',
          providerExposeId: normalizedProviderExposeId || '',
          propertyId: normalizedPropertyId,
        })

    const resolvedAssignedAgentId = routedAgent?.userId || null
    const initialStage = stage === 'draft' && resolvedAssignedAgentId ? 'queued_for_agent' : stage
    const id = newId()
    await query(
      `INSERT INTO public.applications (
         id, user_id, property_id, status, cover_message, source_channel,
         provider_source, provider_expose_id, provider_conversation_id,
         assigned_agent_id, stage, stage_updated_at, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), NOW())
       ON CONFLICT (user_id, property_id) DO UPDATE SET
         status = EXCLUDED.status,
         cover_message = EXCLUDED.cover_message,
         source_channel = EXCLUDED.source_channel,
         provider_source = COALESCE(EXCLUDED.provider_source, public.applications.provider_source),
         provider_expose_id = COALESCE(EXCLUDED.provider_expose_id, public.applications.provider_expose_id),
         provider_conversation_id = COALESCE(EXCLUDED.provider_conversation_id, public.applications.provider_conversation_id),
         assigned_agent_id = COALESCE(EXCLUDED.assigned_agent_id, public.applications.assigned_agent_id),
         stage = COALESCE(EXCLUDED.stage, public.applications.stage),
         stage_updated_at = CASE
           WHEN EXCLUDED.stage IS DISTINCT FROM public.applications.stage THEN NOW()
           ELSE public.applications.stage_updated_at
         END,
         updated_at = NOW()`,
      [
        id,
        user.id,
        normalizedPropertyId,
        status,
        coverMessage,
        sourceChannel,
        normalizedProviderSource,
        normalizedProviderExposeId,
        providerConversationId,
        resolvedAssignedAgentId,
        initialStage,
      ],
    )
    const result = await query(
      `SELECT id, property_id, status, cover_message, source_channel,
              provider_source, provider_expose_id, provider_conversation_id,
              assigned_agent_id, stage, stage_updated_at, last_message_at,
              last_message_preview, unread_count, conversation_state,
              created_at, updated_at
       FROM public.applications
       WHERE user_id = $1 AND property_id = $2
       LIMIT 1`,
      [user.id, normalizedPropertyId],
    )
    return res.status(200).json({ item: result.rows[0] })
  }

  if (req.method === 'PUT') {
    const {
      id,
      status,
      coverMessage,
      providerSource,
      providerExposeId,
      providerConversationId,
      assignedAgentId,
      stage,
      lastMessageAt,
      lastMessagePreview,
      unreadCount,
      conversationState,
    } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id is required' })

    await query(
      `UPDATE public.applications
       SET status = COALESCE($3, status),
           cover_message = COALESCE($4, cover_message),
           provider_source = COALESCE($5, provider_source),
           provider_expose_id = COALESCE($6, provider_expose_id),
           provider_conversation_id = COALESCE($7, provider_conversation_id),
           assigned_agent_id = COALESCE($8, assigned_agent_id),
           stage = COALESCE($9, stage),
           stage_updated_at = CASE WHEN $9 IS NOT NULL THEN NOW() ELSE stage_updated_at END,
           last_message_at = COALESCE($10, last_message_at),
           last_message_preview = COALESCE($11, last_message_preview),
           unread_count = COALESCE($12, unread_count),
           conversation_state = COALESCE($13, conversation_state),
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [
        String(id),
        user.id,
        status ?? null,
        coverMessage ?? null,
        providerSource ?? null,
        providerExposeId ?? null,
        providerConversationId ?? null,
        assignedAgentId ?? null,
        stage ?? null,
        lastMessageAt ?? null,
        lastMessagePreview ?? null,
        unreadCount ?? null,
        conversationState ?? null,
      ],
    )
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

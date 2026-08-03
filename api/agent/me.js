import { requireAgent } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { query } from '../_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const agent = await requireAgent(req, res)
  if (!agent) return

  const [coverageResult, providerAccountsResult, statsResult] = await Promise.all([
    query(
      `SELECT id, city_slug, district_slug, priority, active, created_at, updated_at
       FROM public.agent_city_coverage
       WHERE agent_id = $1
       ORDER BY priority ASC, city_slug ASC, district_slug ASC NULLS FIRST`,
      [agent.agentProfile.id],
    ),
    query(
      `SELECT id, provider_source, account_label, external_account_ref,
              browser_profile_key, session_state, last_sync_at,
              health_status, metadata, is_active, created_at, updated_at
       FROM public.agent_provider_accounts
       WHERE agent_id = $1
       ORDER BY provider_source ASC, account_label ASC`,
      [agent.agentProfile.id],
    ),
    query(
      `SELECT COUNT(*)::int AS assigned_count,
              COUNT(*) FILTER (WHERE stage IN ('reply_received', 'viewing_requested', 'documents_requested'))::int AS needs_attention_count,
              COUNT(*) FILTER (WHERE provider_source = 'is24')::int AS is24_count,
              COUNT(*) FILTER (WHERE source_channel = 'agency_crm')::int AS crm_count
       FROM public.applications
       WHERE assigned_agent_id = $1`,
      [agent.id],
    ),
  ])

  return res.status(200).json({
    agent: {
      id: agent.agentProfile.id,
      userId: agent.id,
      email: agent.email,
      displayName: agent.agentProfile.display_name || agent.name || agent.email,
      phone: agent.agentProfile.phone || '',
      avatarUrl: agent.agentProfile.avatar_url || '',
      baseCity: agent.agentProfile.base_city || '',
      serviceRegions: Array.isArray(agent.agentProfile.service_regions) ? agent.agentProfile.service_regions : [],
      bio: agent.agentProfile.bio || '',
      capacityLimit: agent.agentProfile.capacity_limit || null,
      isActive: agent.agentProfile.is_active !== false,
      coverage: coverageResult.rows,
      providerAccounts: providerAccountsResult.rows,
      stats: statsResult.rows[0] || {
        assigned_count: 0,
        needs_attention_count: 0,
        is24_count: 0,
        crm_count: 0,
      },
    },
  })
}

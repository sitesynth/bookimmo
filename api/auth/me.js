import { getAgentProfileByUserId, getSessionUser } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { query } from '../_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getSessionUser(req)
  if (!user) {
    return res.status(200).json({ user: null })
  }

  const [agentProfile, providerAccounts] = await Promise.all([
    getAgentProfileByUserId(user.id),
    query(
      `SELECT apa.id, apa.provider_source, apa.account_label, apa.browser_profile_key,
              apa.session_state, apa.health_status, apa.is_active, apa.last_sync_at
       FROM public.agent_provider_accounts apa
       JOIN public.agent_profiles ap ON ap.id = apa.agent_id
       WHERE ap.user_id = $1
       ORDER BY apa.provider_source ASC, apa.account_label ASC`,
      [user.id],
    ),
  ])

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      role: agentProfile ? 'agent' : (user.role || 'client'),
      isAgent: Boolean(agentProfile),
      agent_profile: agentProfile ? {
        id: agentProfile.id,
        displayName: agentProfile.display_name || user.name || user.email,
        baseCity: agentProfile.base_city || '',
        phone: agentProfile.phone || '',
        serviceRegions: Array.isArray(agentProfile.service_regions) ? agentProfile.service_regions : [],
        capacityLimit: agentProfile.capacity_limit || null,
      } : null,
      provider_accounts: providerAccounts.rows.map((row) => ({
        id: row.id,
        providerSource: row.provider_source,
        accountLabel: row.account_label,
        browserProfileKey: row.browser_profile_key,
        sessionState: row.session_state,
        healthStatus: row.health_status,
        isActive: row.is_active,
        lastSyncAt: row.last_sync_at,
      })),
      user_metadata: {
        profile: {
          preferredLanguage: user.preferred_language || 'en',
        },
      },
    },
  })
}

import { createSession, setSessionCookie } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { query, sha256, withClient } from '../_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token = '' } = req.body || {}
  if (!token) return res.status(400).json({ error: 'Verification token is required.' })

  const tokenHash = sha256(String(token))

  try {
    const result = await withClient(async (client) => {
      await client.query('BEGIN')
      const lookup = await client.query(
        `SELECT user_id
         FROM public.email_verification_tokens
         WHERE token_hash = $1
           AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash],
      )
      const row = lookup.rows[0]
      if (!row) {
        await client.query('ROLLBACK')
        return null
      }

      await client.query(
        `UPDATE public.app_users
         SET email_verified = TRUE, updated_at = NOW()
         WHERE id = $1`,
        [row.user_id],
      )
      await client.query('DELETE FROM public.email_verification_tokens WHERE token_hash = $1', [tokenHash])
      await client.query('COMMIT')
      return row.user_id
    })

    if (!result) {
      return res.status(400).json({ error: 'This confirmation link is invalid or has expired.' })
    }

    const [userResult, agentProfileResult] = await Promise.all([
      query(
        `SELECT id, email, role
         FROM public.app_users
         WHERE id = $1
         LIMIT 1`,
        [result],
      ),
      query(
        `SELECT id, display_name, is_active
         FROM public.agent_profiles
         WHERE user_id = $1
         LIMIT 1`,
        [result],
      ),
    ])

    const signedInUser = userResult.rows[0] || null
    const agentProfile = agentProfileResult.rows[0] || null
    const isAgent = signedInUser?.role === 'agent' || Boolean(agentProfile)

    const rawToken = await createSession(result)
    setSessionCookie(res, rawToken)
    return res.status(200).json({
      ok: true,
      user: signedInUser ? {
        id: signedInUser.id,
        email: signedInUser.email,
        role: isAgent ? 'agent' : (signedInUser.role || 'client'),
        isAgent,
        agentProfile: agentProfile ? {
          id: agentProfile.id,
          displayName: agentProfile.display_name || signedInUser.email,
        } : null,
      } : null,
    })
  } catch (error) {
    console.error('verify_email_failed', error)
    return res.status(500).json({ error: 'Could not verify this email link.' })
  }
}

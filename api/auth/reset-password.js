import { hashPassword } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { query, sha256, withClient } from '../_lib/db.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token = '', password = '' } = req.body || {}
  if (!token) return res.status(400).json({ error: 'Reset token is required.' })
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })

  const tokenHash = sha256(String(token))

  try {
    const updated = await withClient(async (client) => {
      await client.query('BEGIN')
      const lookup = await client.query(
        `SELECT user_id
         FROM public.password_reset_tokens
         WHERE token_hash = $1
           AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash],
      )
      const row = lookup.rows[0]
      if (!row) {
        await client.query('ROLLBACK')
        return false
      }

      await client.query(
        `UPDATE public.app_users
         SET password_hash = $2, updated_at = NOW()
         WHERE id = $1`,
        [row.user_id, hashPassword(String(password))],
      )
      await client.query('DELETE FROM public.password_reset_tokens WHERE token_hash = $1', [tokenHash])
      await client.query('DELETE FROM public.auth_sessions WHERE user_id = $1', [row.user_id])
      await client.query('COMMIT')
      return true
    })

    if (!updated) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('reset_password_failed', error)
    return res.status(500).json({ error: 'Could not reset the password.' })
  }
}

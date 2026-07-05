import crypto from 'node:crypto'
import { proxyToBridge } from '../_lib/bridge.js'
import { query, sha256, withClient } from '../_lib/db.js'
import { sendPasswordResetEmail } from '../_lib/email-auth.js'

function alwaysSuccess(res) {
  return res.status(200).json({ ok: true })
}

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email = '', preferredLanguage = 'en' } = req.body || {}
  const normalizedEmail = String(email).trim().toLowerCase()
  if (!normalizedEmail) return alwaysSuccess(res)

  const userResult = await query(
    'SELECT id, email, preferred_language, email_verified FROM public.app_users WHERE email = $1 LIMIT 1',
    [normalizedEmail],
  )
  const user = userResult.rows[0]
  if (!user || !user.email_verified) return alwaysSuccess(res)

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')

  try {
    await withClient(async (client) => {
      await client.query('BEGIN')
      await client.query('DELETE FROM public.password_reset_tokens WHERE user_id = $1', [user.id])
      await client.query(
        `INSERT INTO public.password_reset_tokens (token_hash, user_id, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [sha256(token), user.id],
      )
      await client.query('COMMIT')
    })

    await sendPasswordResetEmail({
      email: user.email,
      language: user.preferred_language || preferredLanguage || 'en',
      token,
    })
  } catch (error) {
    console.error('forgot_password_failed', error)
  }

  return alwaysSuccess(res)
}

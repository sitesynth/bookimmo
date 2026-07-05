import { createSession, hashPassword, setSessionCookie } from '../_lib/auth.js'
import { newId, query, sha256, withClient } from '../_lib/db.js'
import { sendVerifyEmail } from '../_lib/email-auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email = '', password = '', preferredLanguage = 'en', name = '' } = req.body || {}
  const normalizedEmail = String(email).trim().toLowerCase()

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }

  const existing = await query('SELECT id, email_verified FROM public.app_users WHERE email = $1 LIMIT 1', [normalizedEmail])
  if (existing.rows[0]) {
    return res.status(409).json({ error: 'This email is already registered.' })
  }

  const userId = newId()
  const verifyToken = newId().replace(/-/g, '') + newId().replace(/-/g, '')

  try {
    await withClient(async (client) => {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO public.app_users (id, email, password_hash, name, preferred_language, email_verified)
         VALUES ($1, $2, $3, $4, $5, FALSE)`,
        [userId, normalizedEmail, hashPassword(String(password)), String(name || normalizedEmail.split('@')[0]), preferredLanguage, preferredLanguage],
      )
      await client.query(
        `INSERT INTO public.email_verification_tokens (token_hash, user_id, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [sha256(verifyToken), userId],
      )
      await client.query('COMMIT')
    })

    await sendVerifyEmail({
      email: normalizedEmail,
      language: preferredLanguage === 'de' ? 'de' : 'en',
      token: verifyToken,
    })

    return res.status(202).json({ ok: true, pending: true, email: normalizedEmail })
  } catch (error) {
    console.error('register_failed', error)
    return res.status(500).json({ error: 'Could not create the account.' })
  }
}

import { createSession, setSessionCookie, verifyPassword } from '../_lib/auth.js'
import { query } from '../_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email = '', password = '' } = req.body || {}
  const normalizedEmail = String(email).trim().toLowerCase()

  const result = await query(
    'SELECT id, email, password_hash, email_verified FROM public.app_users WHERE email = $1 LIMIT 1',
    [normalizedEmail],
  )
  const user = result.rows[0]

  if (!user || !verifyPassword(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }
  if (!user.email_verified) {
    return res.status(409).json({ error: 'Please confirm your email before signing in.' })
  }

  const rawToken = await createSession(user.id)
  setSessionCookie(res, rawToken)
  return res.status(200).json({ ok: true })
}

import { clearSessionCookie, deleteSession, getCookieValue } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rawToken = getCookieValue(req, 'bookimmo_session')
    await deleteSession(rawToken)
  } catch (error) {
    console.error('logout_failed', error)
  }

  clearSessionCookie(res)
  return res.status(200).json({ ok: true })
}

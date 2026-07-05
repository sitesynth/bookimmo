import { getSessionUser } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getSessionUser(req)
  if (!user) {
    return res.status(200).json({ user: null })
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        profile: {
          preferredLanguage: user.preferred_language || 'en',
        },
      },
    },
  })
}

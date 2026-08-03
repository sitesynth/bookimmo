import { requireUser } from './_lib/auth.js'
import { proxyToBridge } from './_lib/bridge.js'
import { syncApplicationMessagingForUser } from './_lib/application-sync.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  const user = await requireUser(req, res)
  if (!user) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    applicationId = null,
    providerSource = 'is24',
  } = req.body || {}

  try {
    const summary = await syncApplicationMessagingForUser({
      userId: user.id,
      applicationId,
      providerSource,
    })

    return res.status(200).json(summary)
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to sync application messaging',
      detail: String(error?.message || error),
    })
  }
}

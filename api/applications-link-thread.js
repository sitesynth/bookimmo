import { requireUser } from './_lib/auth.js'
import { proxyToBridge } from './_lib/bridge.js'
import { linkProviderThreadForApplication } from './_lib/application-sync.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  const user = await requireUser(req, res)
  if (!user) return

  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    applicationId,
    providerSource = 'is24',
    providerConversationId = null,
    providerExposeId = null,
    providerListingAddress = null,
    counterpartyName = null,
    counterpartyRole = null,
    accountLabel = null,
    lastMessageAt = null,
    lastMessagePreview = null,
    rawPayload = {},
  } = req.body || {}

  if (!applicationId) {
    return res.status(400).json({ error: 'applicationId is required' })
  }

  try {
    const item = await linkProviderThreadForApplication({
      applicationId,
      userId: user.id,
      providerSource,
      providerConversationId,
      providerExposeId,
      providerListingAddress,
      counterpartyName,
      counterpartyRole,
      accountLabel,
      lastMessageAt,
      lastMessagePreview,
      rawPayload,
    })

    return res.status(200).json({ item })
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500)
    return res.status(statusCode).json({
      error: statusCode === 404 ? 'Application not found' : 'Failed to link provider thread',
      detail: String(error?.message || error),
    })
  }
}

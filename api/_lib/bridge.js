const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'transfer-encoding',
])

const STRIP_REQUEST_HEADERS = new Set([
  'accept-encoding',
])

const STRIP_RESPONSE_HEADERS = new Set([
  'content-encoding',
])

function getBridgeBaseUrl() {
  const value = String(process.env.BOOKIMMO_BRIDGE_URL || '').trim()
  return value ? value.replace(/\/$/, '') : ''
}

export function hasBridgeTarget() {
  return Boolean(getBridgeBaseUrl())
}

export async function proxyToBridge(req, res) {
  const baseUrl = getBridgeBaseUrl()
  if (!baseUrl) return false

  const url = new URL(`${baseUrl}${req.url}`)
  const headers = { ...req.headers }
  Object.keys(headers).forEach((key) => {
    const lower = key.toLowerCase()
    if (lower === 'host' || STRIP_REQUEST_HEADERS.has(lower)) {
      delete headers[key]
    }
  })

  const init = {
    method: req.method,
    headers,
    redirect: 'manual',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
    if (!headers['content-type']) {
      init.headers['content-type'] = 'application/json'
    }
  }

  const upstream = await fetch(url, init)

  res.status(upstream.status)

  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return
    if (STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) return
    if (key.toLowerCase() === 'set-cookie') return
    res.setHeader(key, value)
  })

  const setCookie = upstream.headers.getSetCookie?.() || []
  if (setCookie.length) {
    res.setHeader('Set-Cookie', setCookie)
  }

  const body = Buffer.from(await upstream.arrayBuffer())
  res.send(body)
  return true
}

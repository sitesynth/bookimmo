const COOKIE_NAME = 'bookimmo_plan'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const password = process.env.PLAN_PASSWORD || 'bookimmo2026'
  const { password: input, redirect } = req.body || {}
  const target = typeof redirect === 'string' && redirect.startsWith('/plan') ? redirect : '/plan/'

  if (input === password) {
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(password)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    )
    res.writeHead(302, { Location: target })
    return res.end()
  }

  res.writeHead(302, { Location: `${target}?err=1` })
  res.end()
}

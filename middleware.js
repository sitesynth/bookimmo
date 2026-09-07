export const config = { matcher: '/plan/:path*' }

export default function middleware(req) {
  const auth = req.headers.get('authorization') || ''
  const password = process.env.PLAN_PASSWORD || 'bookimmo2026'
  if (auth === 'Basic ' + btoa('investor:' + password)) return
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="book.immo plan"' },
  })
}

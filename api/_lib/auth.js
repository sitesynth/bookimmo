import crypto from 'node:crypto'
import { query, sha256 } from './db.js'

const SESSION_COOKIE = 'bookimmo_session'
const SESSION_DAYS = 14

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'))
}

export function createRawToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function createSession(userId) {
  const rawToken = createRawToken()
  const tokenHash = sha256(rawToken)
  await query(
    `INSERT INTO public.auth_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '${SESSION_DAYS} days')`,
    [tokenHash, userId],
  )
  return rawToken
}

export function getCookieValue(req, name) {
  const raw = req.headers.cookie || ''
  const parts = raw.split(';').map((item) => item.trim())
  const match = parts.find((item) => item.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : ''
}

export function setSessionCookie(res, rawToken) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60
  const secure = process.env.NODE_ENV === 'production'
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(rawToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`)
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production'
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`)
}

export async function deleteSession(rawToken) {
  if (!rawToken) return
  await query('DELETE FROM public.auth_sessions WHERE token_hash = $1', [sha256(rawToken)])
}

export async function getSessionUser(req) {
  const rawToken = getCookieValue(req, SESSION_COOKIE)
  if (!rawToken) return null

  const { rows } = await query(
    `SELECT u.id, u.email, u.name, u.role, u.email_verified, u.preferred_language, u.created_at, u.updated_at
     FROM public.auth_sessions s
     JOIN public.app_users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
    [sha256(rawToken)],
  )

  if (!rows[0]) return null
  return rows[0]
}

export async function requireUser(req, res) {
  const user = await getSessionUser(req)
  if (!user) {
    res.status(401).json({ error: 'Authentication required' })
    return null
  }
  return user
}

export async function getAgentProfileByUserId(userId) {
  if (!userId) return null

  const { rows } = await query(
    `SELECT ap.id, ap.user_id, ap.display_name, ap.phone, ap.avatar_url,
            ap.account_type, ap.organization_id, ap.country_code, ap.base_city_id,
            ap.base_city, ap.service_regions, ap.bio, ap.capacity_limit,
            ap.is_active, ap.created_at, ap.updated_at,
            org.name AS organization_name,
            org.website AS organization_website,
            c.name AS country_name,
            city.name AS city_name,
            city.region AS city_region
     FROM public.agent_profiles ap
     LEFT JOIN public.organizations org ON org.id = ap.organization_id
     LEFT JOIN public.countries c ON c.code = ap.country_code
     LEFT JOIN public.cities city ON city.id = ap.base_city_id
     WHERE ap.user_id = $1
     LIMIT 1`,
    [userId],
  )

  return rows[0] || null
}

export async function requireAgent(req, res) {
  const user = await requireUser(req, res)
  if (!user) return null

  const agentProfile = await getAgentProfileByUserId(user.id)
  const isAgent = user.role === 'agent' || Boolean(agentProfile)

  if (!isAgent || !agentProfile || agentProfile.is_active === false) {
    res.status(403).json({ error: 'Agent access required' })
    return null
  }

  return {
    ...user,
    role: 'agent',
    agentProfile,
  }
}

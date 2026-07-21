import { loadLocalEnv } from './env.js'
import { hashPassword } from './auth.js'
import { newId } from './db.js'

loadLocalEnv()

function getLegacyConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const apiKey =
    process.env.SUPABASE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || ''

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_ROLE
    || process.env.SUPABASE_KEY
    || ''

  if (!url || !apiKey) return null
  return {
    url: url.replace(/\/$/, ''),
    apiKey,
    serviceRoleKey,
  }
}

function asNullableText(value) {
  const text = String(value ?? '').trim()
  return text || null
}

function asNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeLegacyProfile(profile = {}, preferredLanguage = 'en') {
  return {
    id: asNullableText(profile.id) || newId(),
    first_name: asNullableText(profile.firstName),
    last_name: asNullableText(profile.lastName),
    phone: asNullableText(profile.phone),
    preferred_language: asNullableText(profile.preferredLanguage) || preferredLanguage,
    current_city: asNullableText(profile.currentCity),
    current_address: asNullableText(profile.currentAddress),
    move_in_date: asNullableText(profile.moveInDate),
    max_budget: asNullableNumber(profile.maxBudget),
    about_me: asNullableText(profile.aboutMe),
    occupation: asNullableText(profile.occupation),
    employment_status: asNullableText(profile.employmentStatus),
    monthly_net_income: asNullableText(profile.monthlyNetIncome),
    adults_count: asNullableNumber(profile.adultsCount),
    children_count: asNullableNumber(profile.childrenCount),
    pets: asNullableText(profile.pets),
    shared_apartment: asNullableText(profile.sharedApartment),
    nationality: asNullableText(profile.nationality),
    profile_image: asNullableText(profile.profileImage),
    preferred_districts: asNullableText(profile.preferredDistricts),
    cover_letter_template: asNullableText(profile.coverLetterTemplate),
    documents: Array.isArray(profile.documents) ? profile.documents : [],
  }
}

export async function authenticateLegacySupabase(email, password) {
  const config = getLegacyConfig()
  if (!config) return null

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) return null

  const json = await response.json().catch(() => null)
  if (!json?.user?.id || !json?.user?.email) return null

  const preferredLanguage = json.user.user_metadata?.profile?.preferredLanguage || 'en'
  const profile = normalizeLegacyProfile(json.user.user_metadata?.profile || {}, preferredLanguage)

  return {
    id: String(json.user.id),
    email: String(json.user.email).trim().toLowerCase(),
    emailVerified: Boolean(
      json.user.email_confirmed_at
      || json.user.confirmed_at
      || json.user.user_metadata?.email_verified,
    ),
    preferredLanguage,
    name: asNullableText(json.user.user_metadata?.name)
      || `${asNullableText(profile.first_name) || ''} ${asNullableText(profile.last_name) || ''}`.trim()
      || String(json.user.email).split('@')[0],
    profile,
    passwordHash: hashPassword(String(password)),
  }
}

export async function findLegacySupabaseUserByEmail(email) {
  const config = getLegacyConfig()
  if (!config?.serviceRoleKey) return null

  const url = new URL(`${config.url}/auth/v1/admin/users`)
  url.searchParams.set('email', String(email).trim().toLowerCase())

  const response = await fetch(url, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) return null

  const json = await response.json().catch(() => null)
  const user = json?.users?.[0]
  if (!user?.id || !user?.email) return null

  const preferredLanguage = user.user_metadata?.profile?.preferredLanguage || 'en'
  const profile = normalizeLegacyProfile(user.user_metadata?.profile || {}, preferredLanguage)

  return {
    id: String(user.id),
    email: String(user.email).trim().toLowerCase(),
    emailVerified: Boolean(
      user.email_confirmed_at
      || user.confirmed_at
      || user.user_metadata?.email_verified,
    ),
    preferredLanguage,
    name: asNullableText(user.user_metadata?.name)
      || `${asNullableText(profile.first_name) || ''} ${asNullableText(profile.last_name) || ''}`.trim()
      || String(user.email).split('@')[0],
    profile,
  }
}

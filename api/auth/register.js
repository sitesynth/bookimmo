import { hashPassword } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { newId, query, sha256, withClient } from '../_lib/db.js'
import { sendAgentVerifyEmail, sendVerifyEmail } from '../_lib/email-auth.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    email = '',
    password = '',
    preferredLanguage = 'en',
    name = '',
    portal = 'client',
    phone = '',
    accountType = 'independent',
    countryCode = 'DE',
    baseCity = '',
    baseCityId = '',
    serviceRegions = [],
    bio = '',
    companyName = '',
    companyWebsite = '',
  } = req.body || {}
  const normalizedEmail = String(email).trim().toLowerCase()
  const normalizedPortal = String(portal || 'client').trim().toLowerCase() === 'agent' ? 'agent' : 'client'
  const normalizedAccountType = String(accountType || 'independent').trim().toLowerCase() === 'company' ? 'company' : 'independent'
  const normalizedName = String(name || normalizedEmail.split('@')[0]).trim()
  const normalizedPhone = String(phone || '').trim()
  const normalizedCountryCode = String(countryCode || 'DE').trim().toUpperCase()
  const normalizedBaseCity = String(baseCity || '').trim()
  const normalizedBaseCityId = String(baseCityId || '').trim()
  const normalizedBio = String(bio || '').trim()
  const normalizedCompanyName = String(companyName || '').trim()
  const normalizedCompanyWebsite = String(companyWebsite || '').trim()
  const normalizedRegions = Array.isArray(serviceRegions)
    ? serviceRegions.map((item) => String(item || '').trim()).filter(Boolean)
    : String(serviceRegions || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' })
  }
  if (normalizedPortal === 'agent') {
    if (!normalizedName) {
      return res.status(400).json({ error: 'Enter the agent full name.' })
    }
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Enter the agent phone number.' })
    }
    if (!normalizedCountryCode) {
      return res.status(400).json({ error: 'Choose the operating country.' })
    }
    if (!normalizedBaseCityId) {
      return res.status(400).json({ error: 'Choose the base city from the directory.' })
    }
    if (normalizedAccountType === 'company' && !normalizedCompanyName) {
      return res.status(400).json({ error: 'Enter the company or agency name.' })
    }
  }

  const existing = await query('SELECT id, email_verified FROM public.app_users WHERE email = $1 LIMIT 1', [normalizedEmail])
  if (existing.rows[0]) {
    return res.status(409).json({ error: 'This email is already registered.' })
  }

  const userId = newId()
  const agentProfileId = newId()
  const verifyToken = newId().replace(/-/g, '') + newId().replace(/-/g, '')

  let resolvedCity = null
  if (normalizedPortal === 'agent') {
    const cityLookup = await query(
      `SELECT id, country_code, name, region
       FROM public.cities
       WHERE id = $1
         AND country_code = $2
         AND is_active = TRUE
       LIMIT 1`,
      [normalizedBaseCityId, normalizedCountryCode],
    )
    resolvedCity = cityLookup.rows[0] || null

    if (!resolvedCity) {
      return res.status(400).json({ error: 'The selected base city is no longer available. Please choose it again.' })
    }
  }

  try {
    await withClient(async (client) => {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO public.app_users (id, email, password_hash, name, role, preferred_language, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
        [userId, normalizedEmail, hashPassword(String(password)), normalizedName, normalizedPortal, preferredLanguage],
      )
      if (normalizedPortal === 'agent') {
        let organizationId = null

        if (normalizedAccountType === 'company') {
          organizationId = newId()
          await client.query(
            `INSERT INTO public.organizations (
               id, name, country_code, website, kind, metadata
             ) VALUES ($1, $2, $3, $4, 'agency', '{}'::jsonb)`,
            [organizationId, normalizedCompanyName, normalizedCountryCode, normalizedCompanyWebsite || null],
          )

          await client.query(
            `INSERT INTO public.organization_members (
               id, organization_id, user_id, role
             ) VALUES ($1, $2, $3, 'owner')`,
            [newId(), organizationId, userId],
          )
        }

        await client.query(
          `INSERT INTO public.agent_profiles (
             id, user_id, display_name, phone, account_type, organization_id,
             country_code, base_city_id, base_city, service_regions, bio, is_active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, TRUE)`,
          [
            agentProfileId,
            userId,
            normalizedName,
            normalizedPhone,
            normalizedAccountType,
            organizationId,
            normalizedCountryCode,
            resolvedCity.id,
            resolvedCity.name,
            JSON.stringify(normalizedRegions),
            normalizedBio,
          ],
        )
      }
      await client.query(
        `INSERT INTO public.email_verification_tokens (token_hash, user_id, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [sha256(verifyToken), userId],
      )
      await client.query('COMMIT')
    })

    const language = preferredLanguage === 'de' ? 'de' : 'en'

    if (normalizedPortal === 'agent') {
      await sendAgentVerifyEmail({
        email: normalizedEmail,
        language,
        token: verifyToken,
      })
    } else {
      await sendVerifyEmail({
        email: normalizedEmail,
        language,
        token: verifyToken,
      })
    }

    return res.status(202).json({ ok: true, pending: true, email: normalizedEmail })
  } catch (error) {
    console.error('register_failed', error)
    return res.status(500).json({ error: 'Could not create the account.' })
  }
}

import { createSession, setSessionCookie, verifyPassword } from '../_lib/auth.js'
import { proxyToBridge } from '../_lib/bridge.js'
import { newId, query, withClient } from '../_lib/db.js'
import { authenticateLegacySupabase } from '../_lib/legacy-supabase-auth.js'

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email = '', password = '' } = req.body || {}
  const normalizedEmail = String(email).trim().toLowerCase()

  const result = await query(
    'SELECT id, email, password_hash, email_verified FROM public.app_users WHERE email = $1 LIMIT 1',
    [normalizedEmail],
  )
  let user = result.rows[0]

  const localPasswordOk = user && verifyPassword(String(password), user.password_hash)

  if (!localPasswordOk) {
    const legacyUser = await authenticateLegacySupabase(normalizedEmail, String(password))

    if (!legacyUser) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    await withClient(async (client) => {
      await client.query('BEGIN')

      const userId = user?.id || legacyUser.id || newId()
      await client.query(
        `INSERT INTO public.app_users (id, email, password_hash, name, preferred_language, email_verified, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           preferred_language = EXCLUDED.preferred_language,
           email_verified = EXCLUDED.email_verified,
           updated_at = NOW()`,
        [
          userId,
          legacyUser.email,
          legacyUser.passwordHash,
          legacyUser.name,
          legacyUser.preferredLanguage,
          legacyUser.emailVerified,
        ],
      )

      await client.query(
        `INSERT INTO public.profiles (
          id, user_id, first_name, last_name, phone, preferred_language, current_city, current_address,
          move_in_date, max_budget, about_me, occupation, employment_status, monthly_net_income,
          adults_count, children_count, pets, shared_apartment, nationality, profile_image,
          preferred_districts, cover_letter_template, documents, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23::jsonb, NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
          first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
          last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name),
          phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
          preferred_language = COALESCE(public.profiles.preferred_language, EXCLUDED.preferred_language),
          current_city = COALESCE(public.profiles.current_city, EXCLUDED.current_city),
          current_address = COALESCE(public.profiles.current_address, EXCLUDED.current_address),
          move_in_date = COALESCE(public.profiles.move_in_date, EXCLUDED.move_in_date),
          max_budget = COALESCE(public.profiles.max_budget, EXCLUDED.max_budget),
          about_me = COALESCE(public.profiles.about_me, EXCLUDED.about_me),
          occupation = COALESCE(public.profiles.occupation, EXCLUDED.occupation),
          employment_status = COALESCE(public.profiles.employment_status, EXCLUDED.employment_status),
          monthly_net_income = COALESCE(public.profiles.monthly_net_income, EXCLUDED.monthly_net_income),
          adults_count = COALESCE(public.profiles.adults_count, EXCLUDED.adults_count),
          children_count = COALESCE(public.profiles.children_count, EXCLUDED.children_count),
          pets = COALESCE(public.profiles.pets, EXCLUDED.pets),
          shared_apartment = COALESCE(public.profiles.shared_apartment, EXCLUDED.shared_apartment),
          nationality = COALESCE(public.profiles.nationality, EXCLUDED.nationality),
          profile_image = COALESCE(public.profiles.profile_image, EXCLUDED.profile_image),
          preferred_districts = COALESCE(public.profiles.preferred_districts, EXCLUDED.preferred_districts),
          cover_letter_template = COALESCE(public.profiles.cover_letter_template, EXCLUDED.cover_letter_template),
          documents = CASE
            WHEN public.profiles.documents = '[]'::jsonb THEN EXCLUDED.documents
            ELSE public.profiles.documents
          END,
          updated_at = NOW()`,
        [
          legacyUser.profile.id,
          userId,
          legacyUser.profile.first_name,
          legacyUser.profile.last_name,
          legacyUser.profile.phone,
          legacyUser.profile.preferred_language,
          legacyUser.profile.current_city,
          legacyUser.profile.current_address,
          legacyUser.profile.move_in_date,
          legacyUser.profile.max_budget,
          legacyUser.profile.about_me,
          legacyUser.profile.occupation,
          legacyUser.profile.employment_status,
          legacyUser.profile.monthly_net_income,
          legacyUser.profile.adults_count,
          legacyUser.profile.children_count,
          legacyUser.profile.pets,
          legacyUser.profile.shared_apartment,
          legacyUser.profile.nationality,
          legacyUser.profile.profile_image,
          legacyUser.profile.preferred_districts,
          legacyUser.profile.cover_letter_template,
          JSON.stringify(legacyUser.profile.documents),
        ],
      )

      await client.query('COMMIT')
    })

    const refreshed = await query(
      'SELECT id, email, password_hash, email_verified FROM public.app_users WHERE email = $1 LIMIT 1',
      [normalizedEmail],
    )
    user = refreshed.rows[0]
  }

  if (!user.email_verified) {
    return res.status(409).json({ error: 'Please confirm your email before signing in.' })
  }

  const rawToken = await createSession(user.id)
  setSessionCookie(res, rawToken)
  return res.status(200).json({ ok: true })
}

import { requireUser } from './_lib/auth.js'
import { proxyToBridge } from './_lib/bridge.js'
import { newId, query } from './_lib/db.js'
import { normalizePhoneToE164 } from '../shared/phone.js'

function normalizeProfileRow(row = {}) {
  return {
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    phone: row.phone ? normalizePhoneToE164(row.phone, 'DE') : null,
    preferred_language: row.preferred_language ?? 'en',
    current_city: row.current_city ?? null,
    current_address: row.current_address ?? null,
    move_in_date: row.move_in_date ?? null,
    max_budget: row.max_budget ?? null,
    about_me: row.about_me ?? null,
    occupation: row.occupation ?? null,
    employment_status: row.employment_status ?? null,
    monthly_net_income: row.monthly_net_income ?? null,
    adults_count: row.adults_count ?? null,
    children_count: row.children_count ?? null,
    pets: row.pets ?? null,
    shared_apartment: row.shared_apartment ?? null,
    nationality: row.nationality ?? null,
    profile_image: row.profile_image ?? null,
    preferred_districts: row.preferred_districts ?? null,
    cover_letter_template: row.cover_letter_template ?? null,
    documents: Array.isArray(row.documents) ? row.documents : [],
  }
}

export default async function handler(req, res) {
  if (await proxyToBridge(req, res)) return
  const user = await requireUser(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const result = await query(
      'SELECT * FROM public.profiles WHERE user_id = $1 LIMIT 1',
      [user.id],
    )
    return res.status(200).json({ profile: result.rows[0] || null })
  }

  if (req.method === 'PUT') {
    const profile = normalizeProfileRow(req.body?.profile || {})
    const id = req.body?.id || user.id

    await query(
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
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        preferred_language = EXCLUDED.preferred_language,
        current_city = EXCLUDED.current_city,
        current_address = EXCLUDED.current_address,
        move_in_date = EXCLUDED.move_in_date,
        max_budget = EXCLUDED.max_budget,
        about_me = EXCLUDED.about_me,
        occupation = EXCLUDED.occupation,
        employment_status = EXCLUDED.employment_status,
        monthly_net_income = EXCLUDED.monthly_net_income,
        adults_count = EXCLUDED.adults_count,
        children_count = EXCLUDED.children_count,
        pets = EXCLUDED.pets,
        shared_apartment = EXCLUDED.shared_apartment,
        nationality = EXCLUDED.nationality,
        profile_image = EXCLUDED.profile_image,
        preferred_districts = EXCLUDED.preferred_districts,
        cover_letter_template = EXCLUDED.cover_letter_template,
        documents = EXCLUDED.documents,
        updated_at = NOW()`,
      [
        id || newId(),
        user.id,
        profile.first_name,
        profile.last_name,
        profile.phone,
        profile.preferred_language,
        profile.current_city,
        profile.current_address,
        profile.move_in_date,
        profile.max_budget,
        profile.about_me,
        profile.occupation,
        profile.employment_status,
        profile.monthly_net_income,
        profile.adults_count,
        profile.children_count,
        profile.pets,
        profile.shared_apartment,
        profile.nationality,
        profile.profile_image,
        profile.preferred_districts,
        profile.cover_letter_template,
        JSON.stringify(profile.documents),
      ],
    )

    await query(
      `UPDATE public.app_users
       SET preferred_language = COALESCE($2, preferred_language), updated_at = NOW()
       WHERE id = $1`,
      [user.id, profile.preferred_language],
    )

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

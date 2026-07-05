import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuthUser } from './useAuthUser.js'

const DEFAULT_PROFILE = {
  firstName: '',
  lastName: '',
  phone: '',
  preferredLanguage: 'en',
  currentCity: '',
  currentAddress: '',
  moveInDate: '',
  maxBudget: '',
  aboutMe: '',
  occupation: '',
  employmentStatus: '',
  monthlyNetIncome: '',
  adultsCount: '1',
  childrenCount: '0',
  pets: 'no',
  sharedApartment: 'no',
  nationality: '',
  profileImage: '',
  preferredDistricts: '',
  coverLetterTemplate: '',
  documents: [],
}

function normalizeDocuments(value) {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => ({
      id: item?.id || `doc-${index}-${item?.name || 'file'}`,
      category: item?.category || 'extra',
      name: item?.name || 'Document',
      size: item?.size || 0,
      type: item?.type || 'application/octet-stream',
      uploadedAt: item?.uploadedAt || new Date().toISOString(),
    }))
    .filter((item) => item.name)
}

function normalizeProfile(row = {}) {
  return {
    ...DEFAULT_PROFILE,
    firstName: row.first_name ?? row.firstName ?? '',
    lastName: row.last_name ?? row.lastName ?? '',
    phone: row.phone ?? '',
    preferredLanguage: row.preferred_language ?? row.preferredLanguage ?? 'en',
    currentCity: row.current_city ?? row.currentCity ?? '',
    currentAddress: row.current_address ?? row.currentAddress ?? '',
    moveInDate: row.move_in_date ?? row.moveInDate ?? '',
    maxBudget: row.max_budget ?? row.maxBudget ?? '',
    aboutMe: row.about_me ?? row.aboutMe ?? '',
    occupation: row.occupation ?? '',
    employmentStatus: row.employment_status ?? row.employmentStatus ?? '',
    monthlyNetIncome: row.monthly_net_income ?? row.monthlyNetIncome ?? '',
    adultsCount: String(row.adults_count ?? row.adultsCount ?? '1'),
    childrenCount: String(row.children_count ?? row.childrenCount ?? '0'),
    pets: row.pets ?? 'no',
    sharedApartment: row.shared_apartment ?? row.sharedApartment ?? 'no',
    nationality: row.nationality ?? '',
    profileImage: row.profile_image ?? row.profileImage ?? '',
    preferredDistricts: row.preferred_districts ?? row.preferredDistricts ?? '',
    coverLetterTemplate: row.cover_letter_template ?? row.coverLetterTemplate ?? '',
    documents: normalizeDocuments(row.documents),
  }
}

function mergeProfiles(primaryRow = {}, metadataRow = {}) {
  return normalizeProfile({
    ...metadataRow,
    ...primaryRow,
    documents: metadataRow.documents ?? primaryRow.documents ?? [],
  })
}

async function loadProfileRow(userId) {
  return supabase
    .from('profiles')
    .select('first_name,last_name,phone,preferred_language,current_city,move_in_date,max_budget,about_me')
    .eq('user_id', userId)
    .maybeSingle()
}

async function saveProfileRow(userId, profile) {
  return supabase
    .from('profiles')
    .upsert({
      id: userId,
      user_id: userId,
      first_name: profile.firstName || null,
      last_name: profile.lastName || null,
      phone: profile.phone || null,
      preferred_language: profile.preferredLanguage || null,
      current_city: profile.currentCity || null,
      move_in_date: profile.moveInDate || null,
      max_budget: profile.maxBudget ? Number(profile.maxBudget) : null,
      about_me: profile.aboutMe || null,
      updated_at: new Date().toISOString(),
    })
}

export function useProfile() {
  const { user, loading: authLoading, isAuthenticated } = useAuthUser()
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !user) {
      setProfile(DEFAULT_PROFILE)
      setLoading(false)
      setError('')
      return
    }

    let active = true
    setLoading(true)
    setError('')
    setNotice('')

    loadProfileRow(user.id)
      .then(({ data, error: dbError }) => {
        if (!active) return
        const metadataProfile = user.user_metadata?.profile || {}

        if (data) {
          setProfile(mergeProfiles(data, metadataProfile))
          setLoading(false)
          return
        }

        if (dbError) {
          setProfile(normalizeProfile(metadataProfile))
          setLoading(false)
          return
        }

        setProfile(normalizeProfile(metadataProfile))
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        const metadataProfile = user.user_metadata?.profile || {}
        setProfile(normalizeProfile(metadataProfile))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authLoading, isAuthenticated, user])

  const documentStats = useMemo(() => {
    const requiredCategories = ['schufa', 'income', 'identity', 'rent_proof', 'recommendation']
    const categorySet = new Set(profile.documents.map((item) => item.category))
    const readyCategories = requiredCategories.filter((category) => categorySet.has(category))

    return {
      total: profile.documents.length,
      readyCount: readyCategories.length,
      requiredCount: requiredCategories.length,
      requiredCategories,
      missingCategories: requiredCategories.filter((category) => !categorySet.has(category)),
      isReady: readyCategories.length >= 3,
    }
  }, [profile.documents])

  const completionPercent = useMemo(() => {
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.phone,
      profile.preferredLanguage,
      profile.currentCity,
      profile.currentAddress,
      profile.moveInDate,
      profile.maxBudget,
      profile.aboutMe,
      profile.occupation,
      profile.employmentStatus,
      profile.monthlyNetIncome,
      profile.adultsCount,
      profile.childrenCount,
      profile.pets,
      profile.sharedApartment,
      profile.nationality,
      profile.preferredDistricts,
      profile.coverLetterTemplate,
    ]
    const filled = fields.filter((value) => String(value || '').trim() !== '').length
    const documentsWeight = Math.min(documentStats.readyCount, 4)
    return Math.round(((filled + documentsWeight) / (fields.length + 4)) * 100)
  }, [documentStats.readyCount, profile])

  async function save() {
    if (!user) return false

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const { error: dbError } = await saveProfileRow(user.id, profile)

      const { error: authError } = await supabase.auth.updateUser({
        data: { profile },
      })

      if (dbError && authError) {
        throw authError
      }

      setNotice(dbError ? 'Profile saved to auth metadata.' : 'Bewerbermappe profile saved.')
      setSaving(false)
      return true
    } catch (err) {
      setError(err?.message || 'Could not save profile.')
      setSaving(false)
      return false
    }
  }

  return {
    profile,
    setProfile,
    loading: loading || authLoading,
    saving,
    error,
    notice,
    completionPercent,
    documentStats,
    isAuthenticated,
    user,
    save,
  }
}

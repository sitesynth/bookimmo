export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr', 'it', 'nl']

export function normalizeLanguage(value, fallback = 'en') {
  return SUPPORTED_LANGUAGES.includes(value) ? value : fallback
}

export function getPathLanguage(pathname) {
  const match = /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname || '')
  return match ? match[1] : null
}

export function getBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en'

  const candidates = [
    navigator.language,
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const base = String(candidate).toLowerCase().split('-')[0]
    if (SUPPORTED_LANGUAGES.includes(base)) {
      return base
    }
  }

  return 'en'
}

export async function detectPreferredLanguage() {
  try {
    const response = await fetch('/api/geo-language', {
      headers: { Accept: 'application/json' },
    })

    if (response.ok) {
      const data = await response.json()
      return normalizeLanguage(data?.language, 'en')
    }
  } catch {
    // Fall back to browser language when geo detection is unavailable.
  }

  const browserLanguage = getBrowserLanguage()
  return browserLanguage === 'de' ? 'de' : 'en'
}

function normalizeLanguage(language) {
  return language === 'de' ? 'de' : 'en'
}

function parseAcceptLanguage(header = '') {
  const primary = String(header)
    .split(',')
    .map((part) => part.trim().split(';')[0]?.toLowerCase())
    .filter(Boolean)[0]

  if (!primary) return 'en'

  return primary.startsWith('de') ? 'de' : 'en'
}

export default async function handler(req, res) {
  const country =
    String(req.headers['x-vercel-ip-country'] || req.headers['x-country-code'] || '')
      .trim()
      .toUpperCase()

  const language =
    country === 'DE'
      ? 'de'
      : parseAcceptLanguage(req.headers['accept-language'])

  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return res.status(200).json({
    language: normalizeLanguage(language),
    country: country || null,
  })
}

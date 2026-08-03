export const PHONE_COUNTRIES = [
  { code: 'DE', label: 'Germany', dialCode: '+49', trunkPrefix: '0', format: [3, 3, 4, 4] },
  { code: 'AT', label: 'Austria', dialCode: '+43', trunkPrefix: '0', format: [3, 3, 4, 4] },
  { code: 'CH', label: 'Switzerland', dialCode: '+41', trunkPrefix: '0', format: [2, 3, 2, 2] },
  { code: 'NL', label: 'Netherlands', dialCode: '+31', trunkPrefix: '0', format: [2, 3, 4] },
  { code: 'BE', label: 'Belgium', dialCode: '+32', trunkPrefix: '0', format: [3, 2, 2, 2] },
  { code: 'FR', label: 'France', dialCode: '+33', trunkPrefix: '0', format: [1, 2, 2, 2, 2] },
  { code: 'IT', label: 'Italy', dialCode: '+39', trunkPrefix: '', format: [3, 3, 4, 4], keepLeadingZero: true },
  { code: 'ES', label: 'Spain', dialCode: '+34', trunkPrefix: '', format: [3, 3, 3] },
  { code: 'PT', label: 'Portugal', dialCode: '+351', trunkPrefix: '', format: [3, 3, 3] },
  { code: 'PL', label: 'Poland', dialCode: '+48', trunkPrefix: '', format: [3, 3, 3] },
  { code: 'CZ', label: 'Czechia', dialCode: '+420', trunkPrefix: '', format: [3, 3, 3] },
  { code: 'DK', label: 'Denmark', dialCode: '+45', trunkPrefix: '', format: [2, 2, 2, 2] },
  { code: 'SE', label: 'Sweden', dialCode: '+46', trunkPrefix: '0', format: [3, 3, 2, 2] },
  { code: 'NO', label: 'Norway', dialCode: '+47', trunkPrefix: '', format: [3, 2, 3] },
  { code: 'FI', label: 'Finland', dialCode: '+358', trunkPrefix: '0', format: [2, 3, 3, 3] },
  { code: 'GB', label: 'United Kingdom', dialCode: '+44', trunkPrefix: '0', format: [4, 3, 4] },
  { code: 'IE', label: 'Ireland', dialCode: '+353', trunkPrefix: '0', format: [2, 3, 4] },
  { code: 'LU', label: 'Luxembourg', dialCode: '+352', trunkPrefix: '', format: [3, 3, 3] },
  { code: 'US', label: 'United States', dialCode: '+1', trunkPrefix: '', format: [3, 3, 4] },
  { code: 'CA', label: 'Canada', dialCode: '+1', trunkPrefix: '', format: [3, 3, 4] },
  { code: 'AE', label: 'United Arab Emirates', dialCode: '+971', trunkPrefix: '0', format: [2, 3, 4] },
  { code: 'TR', label: 'Turkey', dialCode: '+90', trunkPrefix: '0', format: [3, 3, 2, 2] },
]

export function getPhoneCountry(code = 'DE') {
  return PHONE_COUNTRIES.find((item) => item.code === code) || PHONE_COUNTRIES[0]
}

export function sanitizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

export function sanitizePhoneInput(value) {
  return String(value || '').replace(/[^\d\s\-()]/g, '')
}

export function applyPhoneMask(countryCode, value) {
  const digits = sanitizePhoneDigits(value)
  const country = getPhoneCountry(countryCode)
  const groups = []
  let cursor = 0

  for (const size of country.format || []) {
    if (cursor >= digits.length) break
    groups.push(digits.slice(cursor, cursor + size))
    cursor += size
  }

  if (cursor < digits.length) {
    groups.push(digits.slice(cursor))
  }

  if (country.code === 'US' || country.code === 'CA') {
    const [area = '', prefix = '', line = '', extra = ''] = groups
    const head = area ? `(${area}` : ''
    const closed = area.length === 3 ? `${head})` : head
    const core = [closed, prefix, line].filter(Boolean).join(closed && prefix ? ' ' : '')
    return [core, extra].filter(Boolean).join(' ')
  }

  return groups.join(' ').trim()
}

export function splitPhoneValue(value, fallbackCode = 'DE') {
  const rawValue = String(value || '').trim()
  const fallback = getPhoneCountry(fallbackCode)

  if (!rawValue) {
    return {
      countryCode: fallback.code,
      localNumber: '',
    }
  }

  if (!rawValue.startsWith('+')) {
    return {
      countryCode: fallback.code,
      localNumber: applyPhoneMask(fallback.code, rawValue),
    }
  }

  const matched = [...PHONE_COUNTRIES]
    .sort((left, right) => right.dialCode.length - left.dialCode.length)
    .find((item) => rawValue.startsWith(item.dialCode))

  if (!matched) {
    return {
      countryCode: fallback.code,
      localNumber: applyPhoneMask(fallback.code, rawValue.replace(/^\+\d+\s*/, '')),
    }
  }

  return {
    countryCode: matched.code,
    localNumber: applyPhoneMask(matched.code, rawValue.slice(matched.dialCode.length).trim()),
  }
}

export function buildPhoneDisplayValue(countryCode, localNumber) {
  const country = getPhoneCountry(countryCode)
  const maskedLocalNumber = applyPhoneMask(country.code, localNumber).trim()
  if (!maskedLocalNumber) return ''
  return `${country.dialCode} ${maskedLocalNumber}`.trim()
}

export function normalizePhoneToE164(value, fallbackCode = 'DE') {
  const rawValue = String(value || '').trim()
  const fallback = getPhoneCountry(fallbackCode)

  if (!rawValue) return ''

  if (rawValue.startsWith('+')) {
    const digits = sanitizePhoneDigits(rawValue)
    return digits ? `+${digits}` : ''
  }

  let nationalDigits = sanitizePhoneDigits(rawValue)
  const country = getPhoneCountry(fallback.code)

  if (!country.keepLeadingZero && country.trunkPrefix && nationalDigits.startsWith(country.trunkPrefix)) {
    nationalDigits = nationalDigits.slice(country.trunkPrefix.length)
  }

  if (!nationalDigits) return ''
  return `${country.dialCode}${nationalDigits}`.replace(/\s+/g, '')
}

export function isReasonablePhoneNumber(value, fallbackCode = 'DE') {
  const e164 = normalizePhoneToE164(value, fallbackCode)
  const digits = sanitizePhoneDigits(e164)
  return digits.length >= 8 && digits.length <= 15
}

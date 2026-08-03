import React, { useEffect, useMemo, useState } from 'react'
import {
  PHONE_COUNTRIES,
  applyPhoneMask,
  buildPhoneDisplayValue,
  splitPhoneValue,
} from '../../shared/phone.js'

const WRAPPER_STYLE = {
  display: 'grid',
  gridTemplateColumns: '144px minmax(0, 1fr)',
  gap: '10px',
  width: '100%',
}

export default function PhoneField({
  value,
  onChange,
  countryCodeHint = 'DE',
  required = false,
  disabled = false,
  placeholder = 'Phone number',
  style = {},
}) {
  const [selectedCode, setSelectedCode] = useState(countryCodeHint || 'DE')
  const [localNumber, setLocalNumber] = useState('')

  useEffect(() => {
    const parsed = splitPhoneValue(value, selectedCode || countryCodeHint || 'DE')
    setSelectedCode(parsed.countryCode)
    setLocalNumber(parsed.localNumber)
  }, [countryCodeHint, value])

  useEffect(() => {
    if (String(value || '').trim()) return
    if (countryCodeHint && countryCodeHint !== selectedCode) {
      setSelectedCode(countryCodeHint)
    }
  }, [countryCodeHint, selectedCode, value])

  const selectOptions = useMemo(() => PHONE_COUNTRIES, [])

  function emit(nextCode, nextLocalNumber) {
    onChange(buildPhoneDisplayValue(nextCode, nextLocalNumber))
  }

  return (
    <div style={WRAPPER_STYLE}>
      <select
        value={selectedCode}
        onChange={(event) => {
          const nextCode = event.target.value
          setSelectedCode(nextCode)
          emit(nextCode, localNumber)
        }}
        required={required}
        disabled={disabled}
        style={style}
      >
        {selectOptions.map((item) => (
          <option key={`${item.code}-${item.dialCode}`} value={item.code}>
            {item.code} {item.dialCode}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={localNumber}
        onChange={(event) => {
          const nextLocalNumber = applyPhoneMask(selectedCode, event.target.value)
          setLocalNumber(nextLocalNumber)
          emit(selectedCode, nextLocalNumber)
        }}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="tel-national"
        style={style}
      />
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { detectPreferredLanguage, getPathLanguage, normalizeLanguage } from '../lib/language.js'
import { apiRequest } from '../lib/api.js'
import PhoneField from './PhoneField.jsx'

const INPUT_STYLE = {
  width: '100%', padding: '12px 16px', borderRadius: '8px',
  border: '1px solid rgba(25,26,32,0.15)', fontSize: '16px',
  fontFamily: '"Lexend", sans-serif', outline: 'none',
  boxSizing: 'border-box', color: 'rgb(25,26,32)', background: '#fff',
}
const BTN_STYLE = {
  width: '100%', padding: '12px 24px', borderRadius: '8px',
  backgroundColor: 'rgb(25,26,32)', color: 'rgb(245,245,245)',
  border: 'none', fontSize: '16px', fontFamily: '"Lexend", sans-serif',
  cursor: 'pointer', marginTop: '4px',
}
const MSG_STYLE = (isError) => ({
  fontSize: '14px', fontFamily: '"Lexend", sans-serif',
  color: isError ? '#c0392b' : '#27ae60',
  padding: '8px 12px', borderRadius: '6px',
  background: isError ? 'rgba(192,57,43,0.08)' : 'rgba(39,174,96,0.08)',
})
const PASSWORD_INPUT_STYLE = {
  ...INPUT_STYLE,
  paddingRight: '52px',
}
const PASSWORD_FIELD_STYLE = {
  position: 'relative',
  width: '100%',
}
const TOGGLE_BUTTON_STYLE = {
  position: 'absolute',
  top: '50%',
  right: '14px',
  transform: 'translateY(-50%)',
  width: '28px',
  height: '28px',
  border: 'none',
  background: 'transparent',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(25,26,32,0.58)',
  cursor: 'pointer',
  padding: 0,
}
const SEGMENTED_GROUP_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '8px',
  width: '100%',
}
const SEGMENT_BUTTON_STYLE = (active) => ({
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: `1px solid ${active ? 'rgb(25,26,32)' : 'rgba(25,26,32,0.15)'}`,
  background: active ? 'rgb(25,26,32)' : '#fff',
  color: active ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
  fontSize: '14px',
  fontFamily: '"Lexend", sans-serif',
  cursor: 'pointer',
})

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2 12C3.73 7.61 7.52 5 12 5C16.48 5 20.27 7.61 22 12C20.27 16.39 16.48 19 12 19C7.52 19 3.73 16.39 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15.25C13.79 15.25 15.25 13.79 15.25 12C15.25 10.21 13.79 8.75 12 8.75C10.21 8.75 8.75 10.21 8.75 12C8.75 13.79 10.21 15.25 12 15.25Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.88 5.09C10.56 4.95 11.27 4.88 12 4.88C16.48 4.88 20.27 7.49 22 11.88C21.37 13.49 20.43 14.89 19.26 16.06" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.23 6.23C4.46 7.49 3.01 9.43 2 11.88C3.73 16.27 7.52 18.88 12 18.88C13.88 18.88 15.65 18.42 17.22 17.61" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PasswordField({
  value,
  onChange,
  placeholder,
  autoComplete,
  visible,
  onToggle,
}) {
  return (
    <div style={PASSWORD_FIELD_STYLE}>
      <input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        required
        value={value}
        onChange={onChange}
        style={PASSWORD_INPUT_STYLE}
        autoComplete={autoComplete}
        minLength={8}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        style={TOGGLE_BUTTON_STYLE}
      >
        <EyeIcon visible={visible} />
      </button>
    </div>
  )
}

// mode: 'signup' | 'login' | 'reset' | 'update'
export default function AuthForm({ mode = 'signup', portal = 'client' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [accountType, setAccountType] = useState('independent')
  const [countryCode, setCountryCode] = useState('DE')
  const [baseCityId, setBaseCityId] = useState('')
  const [baseCity, setBaseCity] = useState('')
  const [serviceRegions, setServiceRegions] = useState('')
  const [bio, setBio]           = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [referenceLoading, setReferenceLoading] = useState(false)
  const [status, setStatus]     = useState('idle')
  const [message, setMessage]   = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const pathLanguage = getPathLanguage(location.pathname)
  const lang = normalizeLanguage(pathLanguage, 'en')
  const dashboardHref = `/${lang}/dashboard-home`
  const agentWorkspaceHref = `/${lang}/agent-workspace`

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const authError = params.get('authError')
    const authNotice = params.get('authNotice')

    if (authError) {
      setStatus('error')
      setMessage(authError)
      return
    }

    if (authNotice) {
      setStatus('success')
      setMessage(authNotice)
    }
  }, [location.search])

  useEffect(() => {
    if (!(mode === 'signup' && portal === 'agent')) return

    let cancelled = false

    async function loadCountries() {
      try {
        const result = await apiRequest('/api/reference/countries')
        if (cancelled) return
        setCountries(Array.isArray(result?.countries) ? result.countries : [])
      } catch (error) {
        if (cancelled) return
        setCountries([])
      }
    }

    loadCountries()
    return () => { cancelled = true }
  }, [mode, portal])

  useEffect(() => {
    if (!(mode === 'signup' && portal === 'agent')) return

    let cancelled = false

    async function loadCities() {
      setReferenceLoading(true)
      try {
        const result = await apiRequest(`/api/reference/cities?countryCode=${encodeURIComponent(countryCode)}&limit=120`)
        if (cancelled) return
        const nextCities = Array.isArray(result?.cities) ? result.cities : []
        setCities(nextCities)

        if (!nextCities.some((item) => item.id === baseCityId)) {
          setBaseCityId('')
          setBaseCity('')
        }
      } catch (error) {
        if (cancelled) return
        setCities([])
        setBaseCityId('')
        setBaseCity('')
      } finally {
        if (!cancelled) setReferenceLoading(false)
      }
    }

    loadCities()
    return () => { cancelled = true }
  }, [baseCityId, countryCode, mode, portal])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    if (mode === 'signup') {
      if (password !== confirm) {
        setStatus('error'); setMessage('Passwords do not match.'); return
      }
      if (portal === 'agent') {
        if (!name.trim() || !phone.trim() || !countryCode || !baseCityId) {
          setStatus('error'); setMessage('Fill in your full name, phone number, country and base city.'); return
        }
        if (phone.replace(/\D/g, '').length < 6) {
          setStatus('error'); setMessage('Enter a valid phone number.'); return
        }
        if (accountType === 'company' && !companyName.trim()) {
          setStatus('error'); setMessage('Add the company or agency name.'); return
        }
      }
      const preferredLanguage = await detectPreferredLanguage()
      const authLanguage = normalizeLanguage(pathLanguage || preferredLanguage, 'en')
      try {
        await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            preferredLanguage: authLanguage,
            name,
            portal,
            phone,
            accountType,
            countryCode,
            baseCityId,
            baseCity,
            serviceRegions,
            bio,
            companyName,
            companyWebsite,
          }),
        })
        setStatus('success'); setMessage(portal === 'agent' ? 'Check your email to confirm your agent account.' : 'Check your email to confirm your account.')
      } catch (error) {
        setStatus('error'); setMessage(error.message)
      }

    } else if (mode === 'login') {
      try {
        const result = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, portal }),
        })
        window.dispatchEvent(new Event('bookimmo-auth-changed'))
        const destination = result?.user?.isAgent || result?.user?.role === 'agent'
          ? agentWorkspaceHref
          : dashboardHref
        setStatus('success'); setMessage('Signed in! Redirecting…'); setTimeout(() => navigate(destination), 700)
      } catch (error) {
        setStatus('error'); setMessage(error.message)
      }

    } else if (mode === 'reset') {
      try {
        await apiRequest('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email, preferredLanguage: lang }),
        })
        setStatus('success'); setMessage('Password reset email sent. Check your inbox.')
      } catch (error) {
        setStatus('error'); setMessage(error.message)
      }

    } else if (mode === 'update') {
      if (password !== confirm) {
        setStatus('error'); setMessage('Passwords do not match.'); return
      }
      const resetToken = new URLSearchParams(location.search).get('token') || ''
      try {
        await apiRequest('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: resetToken, password }),
        })
        setStatus('success'); setMessage('Password updated! Redirecting…'); setTimeout(() => navigate(`/${lang}/log-in?authNotice=${encodeURIComponent('Password updated. You can sign in now.')}`), 900)
      } catch (error) {
        setStatus('error'); setMessage(error.message)
      }
    }
  }

  const isLoading = status === 'loading'
  const showEmail   = mode !== 'update'
  const showPass    = mode !== 'reset'
  const showConfirm = mode === 'signup' || mode === 'update'
  const showAgentFields = mode === 'signup' && portal === 'agent'
  const showCompanyFields = showAgentFields && accountType === 'company'

  function handleCityChange(event) {
    const nextId = event.target.value
    const nextCity = cities.find((item) => item.id === nextId) || null
    setBaseCityId(nextId)
    setBaseCity(nextCity ? nextCity.name : '')
  }

  return (
    <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'12px', width:'100%'}}>
      {showAgentFields && (
        <>
          <div style={SEGMENTED_GROUP_STYLE}>
            <button
              type="button"
              onClick={() => setAccountType('independent')}
              style={SEGMENT_BUTTON_STYLE(accountType === 'independent')}
            >
              Independent agent
            </button>
            <button
              type="button"
              onClick={() => setAccountType('company')}
              style={SEGMENT_BUTTON_STYLE(accountType === 'company')}
            >
              Company / agency
            </button>
          </div>
          <input
            type="text"
            placeholder="Full name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            style={INPUT_STYLE}
            autoComplete="name"
          />
          <PhoneField
            value={phone}
            onChange={setPhone}
            countryCodeHint={countryCode}
            required
            placeholder="Phone number"
            style={INPUT_STYLE}
          />
          {showCompanyFields ? (
            <>
              <input
                type="text"
                placeholder="Company or agency name"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                style={INPUT_STYLE}
                autoComplete="organization"
              />
              <input
                type="url"
                placeholder="Company website (optional)"
                value={companyWebsite}
                onChange={e => setCompanyWebsite(e.target.value)}
                style={INPUT_STYLE}
                autoComplete="url"
              />
            </>
          ) : null}
          <select
            required
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            style={INPUT_STYLE}
          >
            <option value="">Select country</option>
            {countries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            required
            value={baseCityId}
            onChange={handleCityChange}
            style={INPUT_STYLE}
            disabled={!countryCode || referenceLoading}
          >
            <option value="">
              {referenceLoading ? 'Loading cities…' : 'Select base city'}
            </option>
            {cities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.region ? `${item.name}, ${item.region}` : item.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Service regions (comma separated)"
            value={serviceRegions}
            onChange={e => setServiceRegions(e.target.value)}
            style={INPUT_STYLE}
          />
          <textarea
            placeholder="Short bio or service focus"
            value={bio}
            onChange={e => setBio(e.target.value)}
            style={{ ...INPUT_STYLE, minHeight: '112px', resize: 'vertical' }}
          />
        </>
      )}
      {showEmail && (
        <input
          type="email" placeholder="Email address" required
          value={email} onChange={e => setEmail(e.target.value)}
          style={INPUT_STYLE} autoComplete="email"
        />
      )}
      {showPass && (
        <PasswordField
          placeholder={mode === 'update' ? 'New password' : 'Password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          visible={passwordVisible}
          onToggle={() => setPasswordVisible((current) => !current)}
        />
      )}
      {showConfirm && (
        <PasswordField
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
          visible={confirmVisible}
          onToggle={() => setConfirmVisible((current) => !current)}
        />
      )}
      <button type="submit" disabled={isLoading} style={{...BTN_STYLE, opacity: isLoading ? 0.6 : 1}}>
        {isLoading ? 'Please wait…'
          : mode === 'signup' ? (portal === 'agent' ? 'Create Agent Account' : 'Create Account')
          : mode === 'login'  ? (portal === 'agent' ? 'Sign In As Agent' : 'Sign In')
          : mode === 'reset'  ? 'Send Reset Link'
          : 'Update Password'}
      </button>
      {message && <p style={MSG_STYLE(status === 'error')}>{message}</p>}
    </form>
  )
}

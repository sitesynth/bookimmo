import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { detectPreferredLanguage, getPathLanguage, normalizeLanguage } from '../lib/language.js'
import { apiRequest } from '../lib/api.js'

const INPUT_STYLE = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '16px',
  border: '1px solid rgba(25,26,32,0.14)',
  fontSize: '16px',
  fontFamily: '"Lexend", sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  color: 'rgb(25,26,32)',
  background: '#fff',
  minHeight: '56px',
}

const BTN_STYLE = {
  width: '100%',
  padding: '14px 24px',
  borderRadius: '18px',
  backgroundColor: 'rgb(25,26,32)',
  color: 'rgb(245,245,245)',
  border: 'none',
  fontSize: '16px',
  fontFamily: '"Lexend", sans-serif',
  fontWeight: 500,
  cursor: 'pointer',
  marginTop: '4px',
  minHeight: '58px',
}

const MSG_STYLE = (isError) => ({
  fontSize: '14px',
  fontFamily: '"Lexend", sans-serif',
  color: isError ? '#c0392b' : '#1f8a5b',
  padding: '10px 12px',
  borderRadius: '12px',
  background: isError ? 'rgba(192,57,43,0.08)' : 'rgba(31,138,91,0.08)',
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
  gap: '10px',
  width: '100%',
}

const SEGMENT_BUTTON_STYLE = (active) => ({
  width: '100%',
  padding: '14px 16px',
  borderRadius: '18px',
  border: `1px solid ${active ? 'rgb(25,26,32)' : 'rgba(25,26,32,0.15)'}`,
  background: active ? 'rgb(25,26,32)' : '#fff',
  color: active ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
  fontSize: '16px',
  fontFamily: '"Lexend", sans-serif',
  fontWeight: 500,
  cursor: 'pointer',
  minHeight: '56px',
})

const LABEL_STYLE = {
  display: 'block',
  marginBottom: '8px',
  color: 'rgba(25,26,32,0.72)',
  fontSize: '13px',
  fontFamily: '"Lexend", sans-serif',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const HELP_STYLE = {
  fontSize: '13px',
  lineHeight: 1.55,
  color: 'rgba(25,26,32,0.58)',
  fontFamily: '"Lexend", sans-serif',
}

const ERROR_STYLE = {
  fontSize: '13px',
  lineHeight: 1.45,
  color: '#c0392b',
  fontFamily: '"Lexend", sans-serif',
}

const DROPDOWN_STYLE = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  right: 0,
  zIndex: 20,
  borderRadius: '18px',
  border: '1px solid rgba(25,26,32,0.1)',
  background: '#fff',
  boxShadow: '0 18px 42px rgba(25,26,32,0.12)',
  padding: '8px',
  maxHeight: '240px',
  overflowY: 'auto',
}

const DROPDOWN_ITEM_STYLE = (active) => ({
  width: '100%',
  textAlign: 'left',
  padding: '11px 12px',
  borderRadius: '12px',
  border: 'none',
  background: active ? 'rgba(255, 162, 22, 0.12)' : 'transparent',
  color: 'rgb(25,26,32)',
  fontSize: '15px',
  fontFamily: '"Lexend", sans-serif',
  cursor: 'pointer',
})

const PHONE_WRAPPER_STYLE = {
  width: '100%',
}

const PHONE_INPUT_STYLE = {
  ...INPUT_STYLE,
  borderLeft: '1px solid rgba(25,26,32,0.14)',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
}

const PHONE_SELECTOR_STYLE_PROPS = {
  buttonStyle: {
    minHeight: '56px',
    borderRadius: '16px 0 0 16px',
    border: '1px solid rgba(25,26,32,0.14)',
    borderRight: 'none',
    background: '#fff',
    paddingInline: '12px',
  },
  dropdownArrowStyle: {
    color: 'rgba(25,26,32,0.58)',
  },
  buttonContentWrapperStyle: {
    gap: '8px',
  },
  dropdownStyleProps: {
    style: {
      borderRadius: '18px',
      border: '1px solid rgba(25,26,32,0.1)',
      boxShadow: '0 18px 42px rgba(25,26,32,0.12)',
    },
  },
}

const agentSignupSchema = z.object({
  accountType: z.enum(['independent', 'company']),
  name: z.string().trim().min(2, 'Enter your full name.'),
  phone: z.string().trim().min(1, 'Enter your phone number.'),
  countryCode: z.string().trim().min(2, 'Choose the operating country.'),
  baseCityId: z.string().trim().min(1, 'Choose the base city from the directory.'),
  baseCity: z.string().trim().min(1, 'Choose the base city from the directory.'),
  serviceRegions: z.string().trim().min(2, 'Add at least one service region.'),
  bio: z.string().trim().min(16, 'Add a short service focus so clients know what you cover.').max(700, 'Keep the service focus under 700 characters.'),
  companyName: z.string().optional().default(''),
  companyWebsite: z.string().optional().default(''),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirm: z.string().min(8, 'Confirm your password.'),
}).superRefine((data, ctx) => {
  const parsedPhone = parsePhoneNumberFromString(data.phone || '')

  if (!parsedPhone || !parsedPhone.isValid()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phone'],
      message: 'Enter a valid phone number.',
    })
  }

  if (data.accountType === 'company' && !String(data.companyName || '').trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['companyName'],
      message: 'Enter the company or agency name.',
    })
  }

  if (String(data.companyWebsite || '').trim()) {
    const websiteResult = z.string().url('Enter a valid company website URL.').safeParse(data.companyWebsite)
    if (!websiteResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyWebsite'],
        message: 'Enter a valid company website URL.',
      })
    }
  }

  if (data.password !== data.confirm) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirm'],
      message: 'Passwords do not match.',
    })
  }
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

function FieldError({ message }) {
  if (!message) return null
  return <p style={ERROR_STYLE}>{message}</p>
}

function formatDirectoryOption(option) {
  if (!option) return ''
  return option.region ? `${option.name}, ${option.region}` : option.name
}

function DirectoryCombobox({
  label,
  placeholder,
  value,
  options,
  onChange,
  onSelect,
  error,
  disabled = false,
  loading = false,
  emptyMessage = 'No matches found.',
}) {
  const [open, setOpen] = useState(false)

  const filteredOptions = useMemo(() => {
    const needle = String(value || '').trim().toLowerCase()
    if (!needle) return options.slice(0, 10)

    return options
      .filter((option) => formatDirectoryOption(option).toLowerCase().includes(needle))
      .slice(0, 10)
  }, [options, value])

  return (
    <div style={{ position: 'relative' }}>
      <label style={LABEL_STYLE}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...INPUT_STYLE,
          borderColor: error ? 'rgba(192,57,43,0.42)' : INPUT_STYLE.border,
          background: disabled ? 'rgba(25,26,32,0.04)' : '#fff',
        }}
      />
      <div style={{ marginTop: '6px' }}>
        <FieldError message={error} />
      </div>
      {open && !disabled ? (
        <div style={DROPDOWN_STYLE}>
          {loading ? (
            <p style={{ ...HELP_STYLE, padding: '8px 10px' }}>Loading directory…</p>
          ) : filteredOptions.length ? (
            filteredOptions.map((option) => {
              const labelValue = formatDirectoryOption(option)
              const active = labelValue === value

              return (
                <button
                  key={option.id || option.code}
                  type="button"
                  style={DROPDOWN_ITEM_STYLE(active)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onSelect(option)
                    setOpen(false)
                  }}
                >
                  {labelValue}
                </button>
              )
            })
          ) : (
            <p style={{ ...HELP_STYLE, padding: '8px 10px' }}>{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

// mode: 'signup' | 'login' | 'reset' | 'update'
export default function AuthForm({ mode = 'signup', portal = 'client' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const phoneInputRef = useRef(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [referenceLoading, setReferenceLoading] = useState(false)
  const [countryQuery, setCountryQuery] = useState('Germany')
  const [cityQuery, setCityQuery] = useState('')
  const [agentStep, setAgentStep] = useState(1)

  const pathLanguage = getPathLanguage(location.pathname)
  const lang = normalizeLanguage(pathLanguage, 'en')
  const dashboardHref = `/${lang}/dashboard-home`
  const agentWorkspaceHref = `/${lang}/agent-workspace`

  const agentForm = useForm({
    resolver: zodResolver(agentSignupSchema),
    mode: 'onBlur',
    defaultValues: {
      accountType: 'independent',
      name: '',
      phone: '',
      countryCode: 'DE',
      baseCityId: '',
      baseCity: '',
      serviceRegions: '',
      bio: '',
      companyName: '',
      companyWebsite: '',
      email: '',
      password: '',
      confirm: '',
    },
  })

  const showAgentFields = mode === 'signup' && portal === 'agent'
  const showCompanyFields = showAgentFields && agentForm.watch('accountType') === 'company'
  const agentCountryCode = agentForm.watch('countryCode')

  const agentStepOneFields = [
    'accountType',
    'name',
    'phone',
    'countryCode',
    'baseCityId',
    'baseCity',
    'serviceRegions',
    'bio',
    ...(showCompanyFields ? ['companyName', 'companyWebsite'] : []),
  ]

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
    if (!showAgentFields) return undefined

    let cancelled = false

    async function loadCountries() {
      try {
        const result = await apiRequest('/api/reference/countries')
        if (cancelled) return
        const nextCountries = Array.isArray(result?.countries) ? result.countries : []
        setCountries(nextCountries)

        const matched = nextCountries.find((item) => item.code === agentForm.getValues('countryCode'))
        if (matched) setCountryQuery(matched.name)
      } catch (error) {
        if (!cancelled) setCountries([])
      }
    }

    loadCountries()
    return () => { cancelled = true }
  }, [agentForm, showAgentFields])

  useEffect(() => {
    if (!showAgentFields) return undefined

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setReferenceLoading(true)
      try {
        const search = cityQuery.trim()
        const q = search ? `&q=${encodeURIComponent(search)}` : ''
        const result = await apiRequest(`/api/reference/cities?countryCode=${encodeURIComponent(agentCountryCode)}&limit=120${q}`)
        if (cancelled) return
        setCities(Array.isArray(result?.cities) ? result.cities : [])
      } catch (error) {
        if (!cancelled) setCities([])
      } finally {
        if (!cancelled) setReferenceLoading(false)
      }
    }, 160)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [agentCountryCode, cityQuery, showAgentFields])

  function syncCountryLabel(nextCode) {
    const matched = countries.find((item) => item.code === nextCode)
    if (matched) setCountryQuery(matched.name)
  }

  function applyCountrySelection(nextCode) {
    const currentCode = agentForm.getValues('countryCode')
    if (currentCode !== nextCode) {
      agentForm.setValue('countryCode', nextCode, { shouldDirty: true, shouldValidate: true })
      agentForm.setValue('baseCityId', '', { shouldDirty: true, shouldValidate: true })
      agentForm.setValue('baseCity', '', { shouldDirty: true, shouldValidate: true })
      setCityQuery('')
      setCities([])
    }

    syncCountryLabel(nextCode)
    phoneInputRef.current?.setCountry?.(nextCode.toLowerCase(), { focusOnInput: false })
  }

  async function handleLegacySubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    if (mode === 'signup') {
      if (password !== confirm) {
        setStatus('error')
        setMessage('Passwords do not match.')
        return
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
            portal,
          }),
        })
        setStatus('success')
        setMessage('Check your email to confirm your account.')
      } catch (error) {
        setStatus('error')
        setMessage(error.message)
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
        setStatus('success')
        setMessage('Signed in! Redirecting…')
        setTimeout(() => navigate(destination), 700)
      } catch (error) {
        setStatus('error')
        setMessage(error.message)
      }
    } else if (mode === 'reset') {
      try {
        await apiRequest('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email, preferredLanguage: lang }),
        })
        setStatus('success')
        setMessage('Password reset email sent. Check your inbox.')
      } catch (error) {
        setStatus('error')
        setMessage(error.message)
      }
    } else if (mode === 'update') {
      if (password !== confirm) {
        setStatus('error')
        setMessage('Passwords do not match.')
        return
      }

      const resetToken = new URLSearchParams(location.search).get('token') || ''
      try {
        await apiRequest('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: resetToken, password }),
        })
        setStatus('success')
        setMessage('Password updated! Redirecting…')
        setTimeout(() => navigate(`/${lang}/log-in?authNotice=${encodeURIComponent('Password updated. You can sign in now.')}`), 900)
      } catch (error) {
        setStatus('error')
        setMessage(error.message)
      }
    }
  }

  async function handleAgentSignupSubmit(values) {
    setStatus('loading')
    setMessage('')

    const preferredLanguage = await detectPreferredLanguage()
    const authLanguage = normalizeLanguage(pathLanguage || preferredLanguage, 'en')

    try {
      await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          preferredLanguage: authLanguage,
          name: values.name,
          portal,
          phone: values.phone,
          accountType: values.accountType,
          countryCode: values.countryCode,
          baseCityId: values.baseCityId,
          baseCity: values.baseCity,
          serviceRegions: values.serviceRegions,
          bio: values.bio,
          companyName: values.companyName,
          companyWebsite: values.companyWebsite,
        }),
      })

      setStatus('success')
      setMessage('Check your email to confirm your agent account.')
      agentForm.reset({
        accountType: 'independent',
        name: '',
        phone: '',
        countryCode: values.countryCode,
        baseCityId: '',
        baseCity: '',
        serviceRegions: '',
        bio: '',
        companyName: '',
        companyWebsite: '',
        email: '',
        password: '',
        confirm: '',
      })
      syncCountryLabel(values.countryCode)
      setCityQuery('')
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  async function continueAgentSignup() {
    const isValid = await agentForm.trigger(agentStepOneFields)
    if (isValid) {
      setAgentStep(2)
      window.requestAnimationFrame(() => {
        document.querySelector('[data-agent-signup-step="2"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const isLoading = status === 'loading'
  const showEmail = mode !== 'update'
  const showPass = mode !== 'reset'
  const showConfirm = mode === 'signup' || mode === 'update'
  const onSubmit = showAgentFields ? agentForm.handleSubmit(handleAgentSignupSubmit) : handleLegacySubmit

  const selectedCountryOptions = useMemo(() => countries, [countries])
  const cityOptions = useMemo(() => cities, [cities])

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {showAgentFields ? (
        <>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '4px' }} aria-label="Registration progress">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <p style={{ ...LABEL_STYLE, marginBottom: 0 }}>Registration</p>
              <p style={{ ...HELP_STYLE, margin: 0 }}>Step {agentStep} of 2</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
              {[1, 2].map((step) => (
                <span
                  key={step}
                  aria-current={agentStep === step ? 'step' : undefined}
                  style={{ height: '4px', borderRadius: '999px', background: step <= agentStep ? 'rgb(25,26,32)' : 'rgba(25,26,32,0.12)' }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {agentStep === 1 ? (+              <>
            <div>
              <label style={LABEL_STYLE}>Account type</label>
              <div style={SEGMENTED_GROUP_STYLE}>
                <button
                  type="button"
                  onClick={() => agentForm.setValue('accountType', 'independent', { shouldDirty: true, shouldValidate: true })}
                  style={SEGMENT_BUTTON_STYLE(agentForm.watch('accountType') === 'independent')}
                >
                  Independent agent
                </button>
                <button
                  type="button"
                  onClick={() => agentForm.setValue('accountType', 'company', { shouldDirty: true, shouldValidate: true })}
                  style={SEGMENT_BUTTON_STYLE(agentForm.watch('accountType') === 'company')}
                >
                  Company / agency
                </button>
              </div>
            </div>

            <div>
              <label style={LABEL_STYLE}>Full name</label>
              <input
                type="text"
                placeholder="Full name"
                autoComplete="name"
                style={{
                  ...INPUT_STYLE,
                  borderColor: agentForm.formState.errors.name ? 'rgba(192,57,43,0.42)' : INPUT_STYLE.border,
                }}
                {...agentForm.register('name')}
              />
              <FieldError message={agentForm.formState.errors.name?.message} />
            </div>

            {showCompanyFields ? (
              <>
                <div>
                  <label style={LABEL_STYLE}>Company / agency</label>
                  <input
                    type="text"
                    placeholder="Company or agency name"
                    autoComplete="organization"
                    style={{
                      ...INPUT_STYLE,
                      borderColor: agentForm.formState.errors.companyName ? 'rgba(192,57,43,0.42)' : INPUT_STYLE.border,
                    }}
                    {...agentForm.register('companyName')}
                  />
                  <FieldError message={agentForm.formState.errors.companyName?.message} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Website</label>
                  <input
                    type="url"
                    placeholder="Company website (optional)"
                    autoComplete="url"
                    style={{
                      ...INPUT_STYLE,
                      borderColor: agentForm.formState.errors.companyWebsite ? 'rgba(192,57,43,0.42)' : INPUT_STYLE.border,
                    }}
                    {...agentForm.register('companyWebsite')}
                  />
                  <FieldError message={agentForm.formState.errors.companyWebsite?.message} />
                </div>
              </>
            ) : null}

            <div>
              <label style={LABEL_STYLE}>Phone number</label>
              <Controller
                control={agentForm.control}
                name="phone"
                render={({ field }) => (
                  <div style={PHONE_WRAPPER_STYLE}>
                    <PhoneInput
                      ref={phoneInputRef}
                      defaultCountry={String(agentForm.getValues('countryCode') || 'DE').toLowerCase()}
                      value={field.value}
                      forceDialCode
                      disableCountryGuess={false}
                      placeholder="Phone number"
                      style={{ width: '100%' }}
                      inputStyle={{
                        ...PHONE_INPUT_STYLE,
                        borderColor: agentForm.formState.errors.phone ? 'rgba(192,57,43,0.42)' : 'rgba(25,26,32,0.14)',
                      }}
                      countrySelectorStyleProps={PHONE_SELECTOR_STYLE_PROPS}
                      onChange={(nextPhone, meta) => {
                        field.onChange(nextPhone)
                        const nextCode = String(meta.country.iso2 || agentForm.getValues('countryCode') || 'DE').toUpperCase()
                        if (nextCode !== agentForm.getValues('countryCode')) {
                          applyCountrySelection(nextCode)
                        }
                      }}
                    />
                  </div>
                )}
              />
              <FieldError message={agentForm.formState.errors.phone?.message} />
            </div>

            <DirectoryCombobox
              label="Operating country"
              placeholder="Select country"
              value={countryQuery}
              options={selectedCountryOptions}
              loading={false}
              error={agentForm.formState.errors.countryCode?.message}
              onChange={(nextQuery) => {
                setCountryQuery(nextQuery)
                agentForm.setValue('countryCode', '', { shouldDirty: true, shouldValidate: true })
                agentForm.setValue('baseCityId', '', { shouldDirty: true, shouldValidate: true })
                agentForm.setValue('baseCity', '', { shouldDirty: true, shouldValidate: true })
                setCityQuery('')
              }}
              onSelect={(option) => {
                applyCountrySelection(option.code)
              }}
              emptyMessage="No matching countries in the directory yet."
            />

            <DirectoryCombobox
              label="Base city"
              placeholder={agentCountryCode ? 'Start typing a city name' : 'Choose the country first'}
              value={cityQuery}
              options={cityOptions}
              loading={referenceLoading}
              disabled={!agentCountryCode}
              error={agentForm.formState.errors.baseCityId?.message}
              onChange={(nextQuery) => {
                setCityQuery(nextQuery)
                agentForm.setValue('baseCityId', '', { shouldDirty: true, shouldValidate: true })
                agentForm.setValue('baseCity', '', { shouldDirty: true, shouldValidate: true })
              }}
              onSelect={(option) => {
                agentForm.setValue('baseCityId', option.id, { shouldDirty: true, shouldValidate: true })
                agentForm.setValue('baseCity', option.name, { shouldDirty: true, shouldValidate: true })
                setCityQuery(formatDirectoryOption(option))
              }}
              emptyMessage="No matching cities found."
            />
            <p style={HELP_STYLE}>
              Country and city come from the Bookimmo reference directory, so agents and companies can route work consistently.
            </p>

            <div>
              <label style={LABEL_STYLE}>Service regions</label>
              <input
                type="text"
                placeholder="Cities, districts or regions you cover"
                style={{
                  ...INPUT_STYLE,
                  borderColor: agentForm.formState.errors.serviceRegions ? 'rgba(192,57,43,0.42)' : INPUT_STYLE.border,
                }}
                {...agentForm.register('serviceRegions')}
              />
              <FieldError message={agentForm.formState.errors.serviceRegions?.message} />
            </div>

            <div>
              <label style={LABEL_STYLE}>Service focus</label>
              <textarea
                placeholder="Tell clients what you specialize in, which cities you cover, and how you usually help with rentals or sales."
                style={{
                  ...INPUT_STYLE,
                  minHeight: '132px',
                  resize: 'vertical',
                  borderColor: agentForm.formState.errors.bio ? 'rgba(192,57,43,0.42)' : INPUT_STYLE.border,
                }}
                {...agentForm.register('bio')}
              />
              <FieldError message={agentForm.formState.errors.bio?.message} />
            </div>

            <button type="button" onClick={continueAgentSignup} style={BTN_STYLE}>
              Continue to account details
            </button>
              </>
            ) : (
              <div data-agent-signup-step="2" style={{ display: 'grid', gap: '10px' }}>

            <div>
              <label style={LABEL_STYLE}>Email</label>
              <input
                type="email"
                placeholder="Email address"
                autoComplete="email"
                style={{
                  ...INPUT_STYLE,
                  borderColor: agentForm.formState.errors.email ? 'rgba(192,57,43,0.42)' : INPUT_STYLE.border,
                }}
                {...agentForm.register('email')}
              />
              <FieldError message={agentForm.formState.errors.email?.message} />
            </div>

            <div>
              <label style={LABEL_STYLE}>Password</label>
              <Controller
                control={agentForm.control}
                name="password"
                render={({ field }) => (
                  <PasswordField
                    placeholder="Password"
                    value={field.value}
                    onChange={field.onChange}
                    autoComplete="new-password"
                    visible={passwordVisible}
                    onToggle={() => setPasswordVisible((current) => !current)}
                  />
                )}
              />
              <FieldError message={agentForm.formState.errors.password?.message} />
            </div>

            <div>
              <label style={LABEL_STYLE}>Confirm password</label>
              <Controller
                control={agentForm.control}
                name="confirm"
                render={({ field }) => (
                  <PasswordField
                    placeholder="Confirm password"
                    value={field.value}
                    onChange={field.onChange}
                    autoComplete="new-password"
                    visible={confirmVisible}
                    onToggle={() => setConfirmVisible((current) => !current)}
                  />
                )}
              />
              <FieldError message={agentForm.formState.errors.confirm?.message} />
            </div>
                <button type="submit" disabled={isLoading} style={{ ...BTN_STYLE, opacity: isLoading ? 0.6 : 1 }}>
                  {isLoading ? 'Please wait…' : 'Create Agent Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setAgentStep(1)}
                  disabled={isLoading}
                  style={{ ...BTN_STYLE, marginTop: 0, background: '#fff', color: 'rgb(25,26,32)', border: '1px solid rgba(25,26,32,0.14)' }}
                >
                  Back to profile
                </button>
              </div>
            )}
          </div>
        </>
      ) : null}

      {!showAgentFields && showEmail ? (
        <input
          type="email"
          placeholder="Email address"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={INPUT_STYLE}
          autoComplete="email"
        />
      ) : null}

      {!showAgentFields && showPass ? (
        <PasswordField
          placeholder={mode === 'update' ? 'New password' : 'Password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          visible={passwordVisible}
          onToggle={() => setPasswordVisible((current) => !current)}
        />
      ) : null}

      {!showAgentFields && showConfirm ? (
        <PasswordField
          placeholder="Confirm password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          visible={confirmVisible}
          onToggle={() => setConfirmVisible((current) => !current)}
        />
      ) : null}

      {!showAgentFields ? (
        <button type="submit" disabled={isLoading} style={{ ...BTN_STYLE, opacity: isLoading ? 0.6 : 1 }}>
          {isLoading ? 'Please wait…'
            : mode === 'signup' ? 'Create Account'
            : mode === 'login' ? (portal === 'agent' ? 'Sign In As Agent' : 'Sign In')
            : mode === 'reset' ? 'Send Reset Link'
            : 'Update Password'}
        </button>
      ) : null}

      {message ? <p style={MSG_STYLE(status === 'error')}>{message}</p> : null}
    </form>
  )
}

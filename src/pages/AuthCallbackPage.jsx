import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPathLanguage, normalizeLanguage } from '../lib/language.js'
import { apiRequest } from '../lib/api.js'

function describeAuthError(errorCode, fallbackDescription) {
  if (errorCode === 'otp_expired') return 'This email link has expired. Request a fresh one and try again.'
  if (errorCode === 'access_denied') return 'This confirmation link is no longer valid. Please request a new one.'
  return fallbackDescription || 'We could not complete this sign-in link.'
}

function readToken(search, hash) {
  const tokenKeys = ['token', 'verification_token', 'confirmation_token', 'token_hash', 'code']

  for (const key of tokenKeys) {
    const searchValue = search.get(key)
    if (searchValue) return searchValue

    const hashValue = hash.get(key)
    if (hashValue) return hashValue
  }

  return ''
}

export default function AuthCallbackPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [message, setMessage] = useState('Confirming your secure link…')
  const lang = normalizeLanguage(getPathLanguage(location.pathname), 'en')

  useEffect(() => {
    let active = true
    const search = new URLSearchParams(location.search)
    const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))

    const hashErrorCode = hash.get('error_code') || hash.get('error')
    const hashErrorDescription = hash.get('error_description')
    if (hashErrorCode) {
      const authError = describeAuthError(hashErrorCode, hashErrorDescription)
      navigate(`/${lang}/log-in?authError=${encodeURIComponent(authError)}`, { replace: true })
      return () => {
        active = false
      }
    }

    const token = readToken(search, hash)
    if (!token) {
      navigate(`/${lang}/log-in?authError=${encodeURIComponent('This confirmation link is incomplete. Please request a new one.')}`, { replace: true })
      return () => {
        active = false
      }
    }

    const requestedPortal = search.get('portal') || hash.get('portal')

    apiRequest('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }).then((result) => {
      if (!active) return
      window.dispatchEvent(new Event('bookimmo-auth-changed'))
      const destination = requestedPortal === 'agent' || result?.user?.isAgent || result?.user?.role === 'agent'
        ? `/${lang}/agent-workspace`
        : `/${lang}/dashboard-home`
      navigate(destination, { replace: true })
    }).catch((error) => {
      if (!active) return
      const authError = describeAuthError('', String(error))
      navigate(`/${lang}/log-in?authError=${encodeURIComponent(authError)}`, { replace: true })
    })

    return () => {
      active = false
    }
  }, [lang, location.pathname, location.search, navigate])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', background: '#f5f2ea' }}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', border: '1px solid rgba(25,26,32,0.08)', borderRadius: 24, padding: '32px', boxShadow: '0 24px 64px rgba(25,26,32,0.08)' }}>
        <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Bookimmo
        </p>
        <h1 style={{ margin: '12px 0 10px', fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 34, lineHeight: 1.05, color: 'rgb(25,26,32)' }}>
          Confirming your access
        </h1>
        <p style={{ margin: 0, fontFamily: '"Lexend", sans-serif', fontSize: 16, lineHeight: 1.7, color: 'rgba(25,26,32,0.72)' }}>
          {message}
        </p>
      </div>
    </div>
  )
}

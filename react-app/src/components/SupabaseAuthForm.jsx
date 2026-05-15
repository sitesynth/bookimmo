import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

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

// mode: 'signup' | 'login' | 'reset' | 'update'
export default function SupabaseAuthForm({ mode = 'signup' }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [status, setStatus]     = useState('idle')
  const [message, setMessage]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    if (mode === 'signup') {
      if (password !== confirm) {
        setStatus('error'); setMessage('Passwords do not match.'); return
      }
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setStatus('error'); setMessage(error.message) }
      else { setStatus('success'); setMessage('Check your email to confirm your account.') }

    } else if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setStatus('error'); setMessage(error.message) }
      else { setStatus('success'); setMessage('Signed in!'); setTimeout(() => window.location.href = '/', 800) }

    } else if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/update-password',
      })
      if (error) { setStatus('error'); setMessage(error.message) }
      else { setStatus('success'); setMessage('Password reset email sent. Check your inbox.') }

    } else if (mode === 'update') {
      if (password !== confirm) {
        setStatus('error'); setMessage('Passwords do not match.'); return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setStatus('error'); setMessage(error.message) }
      else { setStatus('success'); setMessage('Password updated! Redirecting…'); setTimeout(() => window.location.href = '/', 1200) }
    }
  }

  const isLoading = status === 'loading'
  const showEmail   = mode !== 'update'
  const showPass    = mode !== 'reset'
  const showConfirm = mode === 'signup' || mode === 'update'

  return (
    <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'12px', width:'100%'}}>
      {showEmail && (
        <input
          type="email" placeholder="Email address" required
          value={email} onChange={e => setEmail(e.target.value)}
          style={INPUT_STYLE} autoComplete="email"
        />
      )}
      {showPass && (
        <input
          type="password"
          placeholder={mode === 'update' ? 'New password' : 'Password'}
          required value={password} onChange={e => setPassword(e.target.value)}
          style={INPUT_STYLE} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          minLength={8}
        />
      )}
      {showConfirm && (
        <input
          type="password" placeholder="Confirm password" required
          value={confirm} onChange={e => setConfirm(e.target.value)}
          style={INPUT_STYLE} autoComplete="new-password" minLength={8}
        />
      )}
      <button type="submit" disabled={isLoading} style={{...BTN_STYLE, opacity: isLoading ? 0.6 : 1}}>
        {isLoading ? 'Please wait…'
          : mode === 'signup' ? 'Create Account'
          : mode === 'login'  ? 'Sign In'
          : mode === 'reset'  ? 'Send Reset Link'
          : 'Update Password'}
      </button>
      {message && <p style={MSG_STYLE(status === 'error')}>{message}</p>}
    </form>
  )
}

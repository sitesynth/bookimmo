import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

/**
 * FramerForm — universal wrapper for Framer-generated forms.
 * Collects all named inputs (skips honeypots), submits to Supabase.
 *
 * Props:
 *   tableName  — Supabase table to insert into (default: 'leads')
 *   children   — the Framer form fields / buttons
 *   ...rest    — forwarded to <form> (className, style, etc.)
 */
export default function FramerForm({ tableName = 'leads', children, ...rest }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')

    const formData = new FormData(e.target)
    const data = {}
    for (const [key, value] of formData.entries()) {
      // Skip Framer honeypot fields
      if (['website', 'company', 'subject', 'title', 'description',
           'feedback', 'notes', 'details', 'remarks', 'comments'].includes(key)) continue
      if (value) data[key] = value
    }

    const { error } = await supabase.from(tableName).insert([data])

    if (error) {
      console.error('Form submit error:', error)
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  if (status === 'success') {
    return (
      <form {...rest}>
        <div style={{
          padding: '32px',
          textAlign: 'center',
          fontFamily: 'var(--framer-font-family, sans-serif)',
          fontSize: '18px',
          color: 'var(--token-3991cae2-fa00-4648-803b-711c24c1718d, #191a20)',
        }}>
          ✓ Thank you! We'll be in touch soon.
        </div>
      </form>
    )
  }

  return (
    <form {...rest} onSubmit={handleSubmit}>
      {children}
      {status === 'error' && (
        <p style={{ color: 'red', marginTop: '8px', fontSize: '14px' }}>
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  )
}

import React, { useEffect } from 'react'

export default function WaitlistModal({ onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,15,20,0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        background: 'rgb(25, 26, 32)',
        border: '1px solid rgba(255,102,37,0.25)',
        borderRadius: 20,
        padding: '40px 36px 36px',
        width: '100%',
        maxWidth: 420,
        position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(245,245,245,0.4)', fontSize: 20, lineHeight: 1,
            padding: '4px 8px', transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = 'rgba(245,245,245,0.9)'}
          onMouseLeave={e => e.target.style.color = 'rgba(245,245,245,0.4)'}
        >×</button>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,102,37,0.12)',
            border: '1px solid rgba(255,102,37,0.3)',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 11, fontFamily: '"Lexend", sans-serif',
            color: 'rgb(255,102,37)', letterSpacing: '0.06em',
            textTransform: 'uppercase', fontWeight: 600,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'rgb(255,102,37)',
              animation: 'barDotPulse 1.4s ease-in-out infinite',
            }} />
            Launching July 2026
          </span>
        </div>

        <h2 style={{
          margin: '12px 0 8px',
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontSize: 26, fontWeight: 700,
          color: '#fff', lineHeight: 1.2,
        }}>
          Get early access
        </h2>
        <p style={{
          margin: '0 0 28px',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 14, color: 'rgba(245,245,245,0.55)',
          lineHeight: 1.6,
        }}>
          First 200 users get <strong style={{ color: 'rgba(245,245,245,0.85)' }}>free apartment matching</strong>. No spam, unsubscribe anytime.
        </p>

        {/* LaunchList form */}
        <form
          className="launchlist-form"
          action="https://getlaunchlist.com/s/whpPRq"
          method="POST"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <input
            name="name"
            type="text"
            placeholder="Your name"
            required
            style={inputStyle}
          />
          <input
            name="email"
            type="email"
            placeholder="Your email"
            required
            style={inputStyle}
          />
          <button
            type="submit"
            style={{
              marginTop: 4,
              padding: '13px 0',
              background: 'rgb(255,102,37)',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: '"Lexend", sans-serif',
              fontSize: 14, fontWeight: 600,
              color: '#fff',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Join the waitlist →
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  fontFamily: '"Lexend", sans-serif',
  fontSize: 14,
  color: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

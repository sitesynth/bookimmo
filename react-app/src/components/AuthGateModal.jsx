import React, { useEffect } from 'react'

export default function AuthGateModal({ onClose, guestHref }) {
  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(25,26,32,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          backgroundColor: 'rgb(245,245,245)',
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: 'rgba(255,102,37,0.12) 0px -2px 2px 0px inset, rgb(255,255,255) 0px 2px 2px 0px inset',
          overflow: 'hidden',
        }}
      >
        {/* Header — logo + title */}
        <div style={{ padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <svg width="120" height="20" viewBox="0 0 158 25" xmlns="http://www.w3.org/2000/svg">
            <use href="#svg-1511956643_7697" />
          </svg>
          <p style={{
            fontFamily: '"Lexend", sans-serif',
            fontSize: 15, fontWeight: 600,
            color: 'rgb(25,26,32)',
            margin: 0, textAlign: 'center',
          }}>
            Select any option to continue
          </p>
        </div>

        {/* CTA block */}
        <div style={{
          margin: '0 16px 16px',
          backgroundColor: 'white',
          borderRadius: 12,
          border: '1px solid rgba(84,84,84,0.08)',
          boxShadow: 'rgba(0,0,0,0.08) 0px 20px 36px -4px, rgba(0,0,0,0.08) 0px -2px 4px 0px inset, rgb(255,255,255) 0px 2px 2px 0px inset',
          padding: '20px 20px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>

          {/* Sign up + Log in row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="./sign-up" style={{
              flex: 1, textAlign: 'center', textDecoration: 'none',
              padding: '10px 0',
              background: 'linear-gradient(rgb(255,130,77) 0%, rgb(255,102,37) 100%)',
              borderRadius: 4,
              border: '1px solid rgb(255,102,37)',
              boxShadow: 'rgba(255,255,255,0.4) 0px 1px 1px 1px inset, rgba(255,102,37,0.85) 0px 4px 12px -4px',
              fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600,
              color: 'rgb(245,245,245)',
            }}>
              Sign up
            </a>
            <a href="./log-in" style={{
              flex: 1, textAlign: 'center', textDecoration: 'none',
              padding: '10px 0',
              backgroundColor: 'rgb(25,26,32)',
              borderRadius: 4,
              fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600,
              color: 'rgb(245,245,245)',
            }}>
              Sign in
            </a>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.32 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgb(25,26,32)' }} />
            <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgb(25,26,32)' }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgb(25,26,32)' }} />
          </div>

          {/* Continue as guest */}
          <a href={guestHref || './search'} style={{
            textAlign: 'center', textDecoration: 'none',
            padding: '10px 0',
            borderRadius: 4,
            border: '1px solid rgb(25,26,32)',
            fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 500,
            color: 'rgb(25,26,32)',
          }}>
            Continue as guest
          </a>
        </div>
      </div>
    </div>
  )
}

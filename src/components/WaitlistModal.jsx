import React, { useEffect } from 'react'
import FramerForm from './FramerForm.jsx'

const PANEL = {
  width: '100%',
  maxWidth: 560,
  borderRadius: 32,
  background: 'rgba(255,255,255,0.96)',
  border: '1px solid rgba(25,26,32,0.08)',
  boxShadow: '0 32px 80px rgba(25,26,32,0.18)',
  overflow: 'hidden',
}

const INPUT = {
  width: '100%',
  padding: '16px 18px',
  borderRadius: 18,
  border: '1px solid rgba(25,26,32,0.12)',
  background: 'rgb(255,255,255)',
  fontFamily: '"Lexend", sans-serif',
  fontSize: 16,
  color: 'rgb(25,26,32)',
  outline: 'none',
  boxSizing: 'border-box',
}

const PRIMARY_BUTTON = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: 18,
  border: 'none',
  background: 'rgb(25,26,32)',
  color: 'rgb(245,245,245)',
  fontFamily: '"Lexend", sans-serif',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
}

function RocketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 280.291 280.291" aria-hidden="true" style={{ flexShrink: 0 }}>
      <g>
        <path fill="#EFC75E" d="M84.373,195.442c13.083,13.03,17.02,34.461,3.947,47.5c-13.083,13.03-52.514,27.548-65.596,14.518c-13.074-13.03,1.505-52.321,14.579-65.351C50.384,179.078,71.299,182.403,84.373,195.442z" />
        <path fill="#E2574C" d="M205.178,166.468c19.698,40.84-28.37,135.901-50.597,109.001c-9.013-10.904-8.418-28.3-31.949-50.702c-0.035,0.14,8.567,1.523,18.639-7.596C164.513,199.266,205.178,166.617,205.178,166.468z" />
        <path fill="#E2574C" d="M122.404,75.004C78.256,54.999-23.998,102.753,5.143,125.216c11.814,9.11,30.558,8.611,54.842,32.369c-0.149,0.035-1.68-8.611,8.103-18.683C87.243,115.643,122.238,75.004,122.404,75.004z" />
        <path fill="#CF5349" d="M102.96,70.471l-1.908-0.096c-9.687,11.831-33.358,40.998-47.788,59.453c-5.916,6.423-7.517,12.26-7.858,15.708c2.827,1.943,5.741,4.183,8.751,6.756c0.735-3.483,2.669-8.34,7.508-13.599c18.421-23.575,52.05-64.791,52.208-64.783C110.573,72.335,106.862,71.259,102.96,70.471z" />
        <path fill="#CF5349" d="M205.45,167.115c-5.758,4.848-42.249,34.767-63.934,51.84c-7.167,6.633-13.529,7.876-16.705,7.998c3.115,3.133,5.811,6.169,8.103,9.101c2.853,0.044,9.722-0.858,17.475-8.025c18.149-14.299,46.572-37.497,58.762-47.57C208.495,175.63,207.287,171.123,205.45,167.115z" />
        <path fill="#D7B354" d="M53.412,184.232c1.82,8.156,7.412,17.878,16.119,26.568c8.663,8.646,18.351,14.211,26.498,16.067c1.383-10.956-3.15-22.953-11.656-31.424C75.911,187.006,64.185,182.736,53.412,184.232z" />
        <path fill="#EBEBEB" d="M278.528,1.532c6.581,6.222-3.107,98.596-66.244,161.313c-39.09,38.836-65.019,53.87-71.223,59.252c-17.16,7.78-28.545,11.962-62.551-21.833c-33.927-33.708-27.399-43.054-19.873-59.2c5.583-6.266,21.046-32.299,60.145-71.144C181.892,7.211,271.641-4.576,278.528,1.532z" />
        <path fill="#324D5B" d="M199.604,80.316c13.608,13.634,13.608,35.738,0,49.381c-13.616,13.634-35.677,13.634-49.294,0c-13.608-13.643-13.608-35.747,0-49.381C163.927,66.673,185.988,66.673,199.604,80.316z" />
        <path fill="#CCD0D2" d="M187.397,92.689c6.861,6.817,6.861,17.869,0,24.686c-6.852,6.817-17.983,6.817-24.852,0c-6.852-6.817-6.852-17.869,0-24.686C169.422,85.872,180.545,85.872,187.397,92.689z" />
      </g>
    </svg>
  )
}

export default function WaitlistModal({ onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(20,22,28,0.48)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div style={PANEL}>
        <div style={{ padding: '28px 28px 24px', position: 'relative' }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(25,26,32,0.42)',
              fontSize: 28,
              lineHeight: 1,
              padding: '4px 8px',
            }}
          >
            ×
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,102,37,0.18)',
              background: 'rgba(255,102,37,0.08)',
              color: 'rgb(255,102,37)',
              fontFamily: '"Fragment Mono", monospace',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <RocketIcon />
            Launching August 2026
          </div>

          <h2
            style={{
              margin: '18px 0 10px',
              fontFamily: '"Bricolage Grotesque", sans-serif',
              fontSize: 48,
              lineHeight: 0.98,
              letterSpacing: '-0.04em',
              color: 'rgb(25,26,32)',
            }}
          >
            Get early access
          </h2>

          <p
            style={{
              margin: 0,
              maxWidth: 420,
              fontFamily: '"Lexend", sans-serif',
              fontSize: 17,
              lineHeight: 1.65,
              color: 'rgba(25,26,32,0.62)',
            }}
          >
            Join the first wave and get free apartment matching when Bookimmo opens in August.
          </p>

          <div style={{ marginTop: 24 }}>
            <FramerForm
              tableName="newsletter_leads"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <input
                name="name"
                type="text"
                placeholder="Your name"
                required
                style={INPUT}
              />
              <input
                name="email"
                type="email"
                placeholder="Your email"
                required
                style={INPUT}
              />
              <input
                type="hidden"
                name="source"
                value="homepage_waitlist_modal"
              />
              <button type="submit" style={PRIMARY_BUTTON}>
                Join the waitlist
              </button>
            </FramerForm>
          </div>
        </div>

        <div
          style={{
            padding: '18px 28px 24px',
            borderTop: '1px solid rgba(25,26,32,0.08)',
            background: 'linear-gradient(180deg, rgba(245,241,234,0.62) 0%, rgba(255,255,255,0.9) 100%)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 14,
          }}
        >
          <div>
            <p style={{ margin: 0, fontFamily: '"Fragment Mono", monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(25,26,32,0.46)' }}>
              Benefit
            </p>
            <p style={{ margin: '8px 0 0', fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.55, color: 'rgb(25,26,32)' }}>
              Free apartment matching for the first 200 users.
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: '"Fragment Mono", monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(25,26,32,0.46)' }}>
              Stored in
            </p>
            <p style={{ margin: '8px 0 0', fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.55, color: 'rgb(25,26,32)' }}>
              Your signup goes into the Bookimmo waitlist CRM, not a temporary external widget.
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontFamily: '"Fragment Mono", monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(25,26,32,0.46)' }}>
              Privacy
            </p>
            <p style={{ margin: '8px 0 0', fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.55, color: 'rgb(25,26,32)' }}>
              No spam. You can unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

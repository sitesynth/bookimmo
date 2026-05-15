import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const LANGS = ['de', 'en', 'fr', 'it', 'nl']
const BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

export default function LanguageToggle() {
  const navigate = useNavigate()
  const location = useLocation()
  const lang = LANGS.find(l => location.pathname.startsWith(`/${l}`)) || 'en'
  const [open, setOpen] = useState(false)
  const [rotateY, setRotateY] = useState(0)

  const activeIndex = LANGS.indexOf(lang)

  const handleSelect = (l, i) => {
    if (l === lang) return
    const dir = i > activeIndex ? 1 : -1
    setRotateY(dir * 25)
    setTimeout(() => setRotateY(0), 300)
    navigate(`/${l}`)
  }

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
    >
      {/* Globe SVG */}
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={open ? 'rgba(244,244,244,0.9)' : 'rgba(244,244,244,0.55)'}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, transition: 'stroke 0.2s' }}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>

      {/* Pill toggle */}
      <div style={{
        overflow: 'hidden',
        maxWidth: open ? '240px' : '0px',
        opacity: open ? 1 : 0,
        transition: 'max-width 0.35s ease, opacity 0.25s ease',
      }}>
        <ul style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: `repeat(${LANGS.length}, 1fr)`,
          height: '30px',
          width: '220px',
          borderRadius: '45px',
          background: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          perspective: '1000px',
          transform: `rotateY(${rotateY}deg)`,
          transition: `transform 0.3s ease`,
        }}>
          {/* Sliding indicator */}
          <li style={{
            position: 'absolute',
            top: 0,
            left: `${(activeIndex / LANGS.length) * 100}%`,
            width: `${100 / LANGS.length}%`,
            height: '100%',
            borderRadius: '45px',
            background: 'rgba(255,255,255,0.28)',
            transition: `left 0.55s ${BOUNCE}`,
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          {LANGS.map((l, i) => (
            <li
              key={l}
              onMouseDown={() => handleSelect(l, i)}
              style={{
                display: 'grid',
                placeItems: 'center',
                fontSize: '11px',
                fontFamily: '"Lexend", sans-serif',
                fontWeight: l === lang ? 600 : 400,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: l === lang ? '#fff' : 'rgba(244,244,244,0.55)',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'color 0.25s',
                userSelect: 'none',
              }}
            >
              {l.toUpperCase()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

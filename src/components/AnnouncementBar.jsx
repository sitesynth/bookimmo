import React, { useState, useEffect, useRef } from 'react'

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  const [barHeight, setBarHeight] = useState(41)
  const innerRef = useRef(null)

  useEffect(() => {
    document.body.classList.toggle('bar-visible', visible)
    return () => document.body.classList.remove('bar-visible')
  }, [visible])

  useEffect(() => {
    if (!innerRef.current) return
    const measure = () => setBarHeight(innerRef.current.getBoundingClientRect().height)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <>
      {/* Spacer matches actual bar height so content below isn't hidden under the fixed bar */}
      <div style={{
        maxHeight: visible ? `${barHeight}px` : '0px',
        transition: 'max-height 0.4s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }} />

      {/* Fixed bar — scrolls with nav, not with page */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1999,
        overflow: 'hidden',
        maxHeight: visible ? '80px' : '0px',
        opacity: visible ? 1 : 0,
        transition: 'max-height 0.4s ease, opacity 0.35s ease',
      }}>
      <div ref={innerRef} className="bar-inner" style={{
        width: '100%',
        backgroundColor: 'rgb(25, 26, 32)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '9px 48px',
        position: 'relative',
      }}>
        <p style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'nowrap',
          gap: '4px 12px',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          lineHeight: 1.4,
          color: 'rgba(245,245,245,0.9)',
          textAlign: 'center',
        }}>
          <span className="bar-tag" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(255,102,37)', padding: '3px 9px', borderRadius: 999, backgroundColor: 'rgba(255,102,37,0.14)' }}>
            Founding members
          </span>
          <span><span className="bar-long">First month free, no card needed</span><span className="bar-short">First month free</span></span>
          <a href="./sign-up" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Join the club <span aria-hidden="true">→</span>
          </a>
        </p>

        <style>{`
          .bar-short { display: none; }
          @media (max-width: 640px) { .bar-tag { display: none; } .bar-long { display: none; } .bar-short { display: inline; } .bar-inner { padding: 9px 40px !important; } }
        `}</style>

        <button
          onClick={() => setVisible(false)}
          aria-label="Close"
          style={{
            position: 'absolute',
            right: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(245,245,245,0.5)',
            fontSize: 18,
            lineHeight: 1,
            padding: '4px 8px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.target.style.color = 'rgba(245,245,245,0.9)'}
          onMouseLeave={e => e.target.style.color = 'rgba(245,245,245,0.5)'}
        >
          ×
        </button>
      </div>
      </div>

    </>
  )
}

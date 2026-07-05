import React, { useState, useEffect, useRef } from 'react'
import WaitlistModal from './WaitlistModal.jsx'

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
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
        borderBottom: '1px solid rgba(255,102,37,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 48px',
        gap: 12,
        position: 'relative',
      }}>
        <span className="bar-dot" style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: 'rgb(255,102,37)',
          flexShrink: 0,
          boxShadow: '0 0 6px rgba(255,102,37,0.7)',
          animation: 'barDotPulse 1.4s ease-in-out infinite',
        }} />

        <p style={{
          margin: 0,
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          fontWeight: 400,
          color: 'rgba(245,245,245,0.9)',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {/* Desktop */}
          <span className="bar-text-desktop">
            🚀 <strong style={{ color: 'rgb(255,102,37)', fontWeight: 600 }}>Launching in July!</strong>
            {' '}The first <strong style={{ color: '#fff', fontWeight: 600 }}>200 users</strong> get free apartment matching —{' '}
            <button onClick={() => setModalOpen(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'rgb(255,102,37)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>join now</button>.
          </span>
          {/* Mobile — one line */}
          <span className="bar-text-mobile">
            🚀 <strong style={{ color: 'rgb(255,102,37)', fontWeight: 600 }}>Launching July!</strong>
            {' '}<strong style={{ color: '#fff', fontWeight: 600 }}>200</strong> free spots —{' '}
            <button onClick={() => setModalOpen(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'rgb(255,102,37)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>join now</button>.
          </span>
        </p>

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

      {modalOpen && <WaitlistModal onClose={() => setModalOpen(false)} />}
    </>
  )
}

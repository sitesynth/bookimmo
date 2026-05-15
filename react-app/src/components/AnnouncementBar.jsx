import React, { useState, useEffect } from 'react'

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    document.body.classList.toggle('bar-visible', visible)
    return () => document.body.classList.remove('bar-visible')
  }, [visible])

  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: visible ? '80px' : '0px',
      opacity: visible ? 1 : 0,
      transition: 'max-height 0.4s ease, opacity 0.35s ease',
      width: '100%',
    }}>
      <div style={{
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
        <span style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: 'rgb(255,102,37)',
          flexShrink: 0,
          boxShadow: '0 0 6px rgba(255,102,37,0.7)',
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
          🚀 <strong style={{ color: 'rgb(255,102,37)', fontWeight: 600 }}>Launching in June!</strong>
          {' '}The first <strong style={{ color: '#fff', fontWeight: 600 }}>200 users</strong> get free apartment matching — join now.
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
  )
}

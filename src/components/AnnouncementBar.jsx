import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 2000,
            width: '100%',
            backgroundColor: 'rgb(25, 26, 32)',
            borderBottom: '1px solid rgba(255,102,37,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 48px',
            gap: 12,
          }}
        >
          {/* Orange accent dot */}
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
            🚀 <strong style={{ color: 'rgb(255,102,37)', fontWeight: 600 }}>Запуск в июне!</strong>
            {' '}Первым <strong style={{ color: '#fff', fontWeight: 600 }}>200 пользователям</strong> бесплатно поможем найти квартиру — присоединяйтесь сейчас.
          </p>

          {/* Close button */}
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}

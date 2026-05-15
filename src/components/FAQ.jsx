import React, { useState } from 'react'

const FAQS = [
  {
    q: 'How does automatic viewing booking work?',
    a: 'Once you set your criteria, BookImmo monitors every listing source in real time. The moment a matching property appears, we secure a viewing slot on your behalf — before most buyers even see the listing.',
  },
  {
    q: 'Does BookImmo work for both buying and renting?',
    a: 'Yes. You can search and book viewings for properties for sale or for rent. Set your budget, type, and location once — we handle the rest.',
  },
  {
    q: 'What happens if I miss a viewing that was booked for me?',
    a: 'No problem. You can reschedule directly through the platform. We also notify the agent immediately so the slot can be offered to someone else.',
  },
  {
    q: 'Are there any fees to use BookImmo?',
    a: 'Browsing and booking viewings is completely free for buyers and renters. We work with agencies and landlords who pay for premium placement.',
  },
  {
    q: 'How quickly can I get a viewing after a new listing goes live?',
    a: 'Typically within minutes. Our system processes new listings as they are published and submits viewing requests automatically — giving you a head start over everyone searching manually.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)

  return (
    <section style={{
      width: '100%',
      backgroundColor: 'rgb(245, 245, 245)',
      padding: '80px 40px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontSize: 40,
            fontWeight: 700,
            color: 'rgb(255,102,37)',
            margin: '0 0 12px',
            lineHeight: 1.2,
          }}>
            Frequently asked questions
          </h2>
          <p style={{
            fontFamily: '"Lexend", sans-serif',
            fontSize: 16,
            fontWeight: 400,
            color: 'rgb(25,26,32)',
            margin: 0,
          }}>
            Everything you need to know about BookImmo.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{
                backgroundColor: 'white',
                borderRadius: 12,
                overflow: 'hidden',
                border: isOpen ? '1px solid rgba(255,102,37,0.3)' : '1px solid rgba(25,26,32,0.08)',
                transition: 'border-color 0.2s',
              }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '18px 24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    color: isOpen ? 'rgb(255,102,37)' : 'rgb(25,26,32)',
                    transition: 'color 0.2s',
                    lineHeight: 1.4,
                  }}>
                    {item.q}
                  </span>
                  <span style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: isOpen ? 'rgb(255,102,37)' : 'rgba(25,26,32,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s, transform 0.25s',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1v8M1 5h8" stroke={isOpen ? 'white' : 'rgb(25,26,32)'} strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>

                <div style={{
                  maxHeight: isOpen ? 400 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}>
                  <p style={{
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 14,
                    color: 'rgba(25,26,32,0.65)',
                    lineHeight: 1.7,
                    margin: 0,
                    padding: '0 24px 20px',
                  }}>
                    {item.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

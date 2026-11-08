import React, { useState } from 'react'

const FAQS = [
  {
    q: 'Who is the club for?',
    a: 'People moving to a new country who rent through agencies and want someone to handle the local paperwork, letters and follow-ups. We start in Germany, in Berlin, Munich, Frankfurt, Hamburg and Cologne, with more European cities to follow.',
  },
  {
    q: 'What does verification involve?',
    a: 'You upload the documents local landlords ask for: ID, proof of income, a credit report such as Schufa or an equivalent from your country, and a short self-disclosure. The AI assembles the pack, a person checks it, and from then on it is attached to every application.',
  },
  {
    q: 'Does the AI really send applications for me?',
    a: 'Yes. It writes a letter for each flat in the agency\'s language, attaches your verified pack and sends it. You approve your criteria once and can pause at any time.',
  },
  {
    q: 'Is anything deducted when I sign a lease?',
    a: 'No. There is no success fee and no share of your rent. Your membership simply ends when you sign.',
  },
  {
    q: 'What do agencies pay?',
    a: 'Nothing for listing. When a lease is signed with a candidate we introduced, the agency shares part of the commission it receives from the owner. Tenants are never charged for this.',
  },
  {
    q: 'Can I use the search without joining?',
    a: 'Yes. The live search and map are open to everyone. Membership adds verification, automatic applications and partner exclusives.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)

  return (
    <section data-framer-appear-id="faq-section" style={{
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
            fontWeight: 500,
            color: 'rgb(255,102,37)',
            margin: '0 0 12px',
            lineHeight: 1.2,
            letterSpacing: '-1px',
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
            Everything you need to know about the club.
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

import React from 'react'

// One short line under the headline plus a looping horizontal strip of club facts.
const PHRASES = [
  'Verify your documents once',
  'AI writes to agencies in their language',
  'Applications sent within minutes',
  'Viewings lined up for you',
  'Partner exclusives before the portals',
  'Berlin · Munich · Frankfurt · Hamburg · Cologne',
  'No success fee, ever',
  'First month free',
]

export default function HeroTicker() {
  const items = [...PHRASES, ...PHRASES]
  return (
    <div style={{ width: '100%', maxWidth: 820, margin: '0 auto' }}>
      <p
        className="framer-text framer-styles-preset-14npl34"
        style={{ '--framer-text-alignment': 'center', margin: 0 }}
      >
        The rental club for expats. Verified once, the AI does the rest.
      </p>

      <div
        className="hero-ticker"
        aria-label={PHRASES.join('. ')}
        style={{
          marginTop: 22,
          overflow: 'hidden',
          maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
        }}
      >
        <div className="hero-ticker-track" style={{ display: 'flex', width: 'max-content', gap: 0 }}>
          {items.map((phrase, index) => (
            <span
              key={`${phrase}-${index}`}
              aria-hidden={index >= PHRASES.length}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 18,
                paddingRight: 18,
                fontFamily: '"Lexend", sans-serif',
                fontSize: 15,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                color: 'rgb(25,26,32)',
              }}
            >
              {phrase}
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgb(255,102,37)', flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .hero-ticker-track { animation: heroTicker 38s linear infinite; }
        .hero-ticker:hover .hero-ticker-track { animation-play-state: paused; }
        @keyframes heroTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .hero-ticker-track { animation: none; flex-wrap: wrap; width: auto; justify-content: center; row-gap: 8px; } }
      `}</style>
    </div>
  )
}

import React from 'react'

// The headline pill rebuilt from its own layers: four nested bands (each 14px
// thinner per side) and the building cut out of the original artwork on top.
// The light flash is the bands themselves lightening in turn, from the inner
// band outwards, three times after load, then they rest.
const START = 1.2
const BAND_STEP = 0.14
const CYCLE = 1.7

// x/y inset, width, height, gradient id
const BANDS = [
  { inset: 0, from: '#ffab87', to: '#ff9a6e' },
  { inset: 14, from: '#ffc2a8', to: '#ffb394' },
  { inset: 28, from: '#ffdaca', to: '#ffcdb8' },
  { inset: 42, from: '#ffeae1', to: '#ffe3d8' },
]

export default function HeroPill() {
  return (
    <svg
      className="hero-pill"
      viewBox="0 0 286 150"
      width="100%"
      height="100%"
      role="img"
      aria-label="book.immo"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {BANDS.map((band, index) => (
          <linearGradient key={index} id={`hpBand${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={band.from} />
            <stop offset="1" stopColor={band.to} />
          </linearGradient>
        ))}
        <filter id="hpGlow" x="-25%" y="-40%" width="150%" height="190%">
          <feDropShadow dx="0" dy="6" stdDeviation="9" floodColor="#ff8a55" floodOpacity="0.28" />
        </filter>
        <filter id="hpBuildingShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#c4521c" floodOpacity="0.22" />
        </filter>
      </defs>

      {BANDS.map((band, index) => {
        const width = 286 - band.inset * 2
        const height = 150 - band.inset * 2
        // light flashes inward-out: the inner band lights first
        const delay = START + (BANDS.length - 1 - index) * BAND_STEP
        return (
          <g key={index} filter={index === 0 ? 'url(#hpGlow)' : undefined}>
            <rect x={band.inset} y={band.inset} width={width} height={height} rx={height / 2} fill={`url(#hpBand${index})`} />
            <rect
              className="hero-pill-lit"
              x={band.inset} y={band.inset} width={width} height={height} rx={height / 2}
              fill="#fff6f0"
              style={{ animationDelay: `${delay}s` }}
            />
          </g>
        )
      })}

      <image
        href="/assets/images/pill-building.png"
        x="0" y="0" width="286" height="150"
        filter="url(#hpBuildingShadow)"
      />

      <style>{`
        .hero-pill-lit {
          opacity: 0;
          animation: heroPillLit ${CYCLE}s ease-in-out 3;
        }
        @keyframes heroPillLit {
          0%   { opacity: 0; }
          18%  { opacity: 0.62; }
          46%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .hero-pill-lit { animation: none; } }
      `}</style>
    </svg>
  )
}

import React from 'react'

// The headline pill, rebuilt as layers: orange bands, light flashes that run
// inside the bands, and the building on top of everything.
// Flashes play three times after load, then rest.
const START = 1.2
const WAVES = [0, 0.4, 0.8]

export default function HeroPill() {
  return (
    <svg
      className="hero-pill"
      viewBox="0 0 286 150"
      width="100%"
      height="100%"
      role="img"
      aria-label="book.immo"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="hpBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffb08a" />
          <stop offset="1" stop-color="#ff8a55" />
        </linearGradient>
        <linearGradient id="hpBuilding" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="1" stop-color="#fff1e9" />
        </linearGradient>
        <clipPath id="hpInner">
          <rect x="30" y="20" width="226" height="110" rx="55" />
        </clipPath>
        <filter id="hpShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#c4521c" flood-opacity="0.28" />
        </filter>
      </defs>

      {/* bands, outer to inner */}
      <rect x="0" y="0" width="286" height="150" rx="75" fill="url(#hpBase)" />
      <rect x="18" y="12" width="250" height="126" rx="63" fill="#ffc2a6" />
      <rect x="36" y="24" width="214" height="102" rx="51" fill="#ffd6c3" />
      <rect x="54" y="36" width="178" height="78" rx="39" fill="#ffe6da" />
      <rect x="72" y="48" width="142" height="54" rx="27" fill="#fdf1ea" />

      {/* light flashes, clipped to the inner bands, under the building */}
      <g clipPath="url(#hpInner)" style={{ mixBlendMode: 'screen' }}>
        {WAVES.map((delay) => (
          <rect
            key={delay}
            className="hero-pill-wave"
            x="30" y="20" width="226" height="110" rx="55"
            fill="none"
            stroke="#ffffff"
            strokeWidth="7"
            style={{ animationDelay: `${START + delay}s` }}
          />
        ))}
        <rect
          className="hero-pill-sheen"
          x="-40" y="-20" width="90" height="190"
          fill="url(#hpSheen)"
          style={{ animationDelay: `${START}s` }}
        />
        <linearGradient id="hpSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
      </g>

      {/* building, always on top */}
      <g filter="url(#hpShadow)">
        <rect x="102" y="118" width="84" height="8" rx="4" fill="#fff6f1" />
        <path d="M118 46 L160 32 V118 H118 Z" fill="url(#hpBuilding)" />
        <path d="M160 72 L180 66 V118 H160 Z" fill="#fff4ee" />
      </g>
      <path d="M118 46 L160 32 V40 L118 54 Z" fill="#ffffff" opacity="0.9" />

      <style>{`
        .hero-pill-wave {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          transform: scale(0.1);
          animation: heroPillWave 1.7s cubic-bezier(0.25, 0.7, 0.3, 1) 3;
        }
        .hero-pill-sheen {
          opacity: 0;
          transform: translateX(0) skewX(-16deg);
          animation: heroPillSheen 1.7s ease-in-out 3;
        }
        @keyframes heroPillWave {
          0%   { transform: scale(0.1); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes heroPillSheen {
          0%   { transform: translateX(0) skewX(-16deg); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(330px) skewX(-16deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-pill-wave, .hero-pill-sheen { animation: none; }
        }
      `}</style>
    </svg>
  )
}

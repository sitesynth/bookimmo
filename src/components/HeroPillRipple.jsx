import React from 'react'

// Three pill-shaped rings that spread out from the headline image and fade,
// repeated three times after load, then still.
const START = 1.2
const RINGS = [0, 0.45, 0.9]

export default function HeroPillRipple() {
  return (
    <>
      {RINGS.map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="hero-pill-ring"
          style={{ animationDelay: `${START + delay}s` }}
        />
      ))}
      <style>{`
        .hero-pill-ring {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 3px solid rgba(255, 102, 37, 0.85);
          opacity: 0;
          pointer-events: none;
          transform: scale(1);
          animation: heroPillRipple 2.2s cubic-bezier(0.2, 0.6, 0.3, 1) 3;
          animation-delay: inherit;
        }
        @keyframes heroPillRipple {
          0%   { transform: scale(0.96); opacity: 0; }
          14%  { opacity: 1; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .hero-pill-ring { animation: none; } }
      `}</style>
    </>
  )
}

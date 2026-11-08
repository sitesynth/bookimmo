import React from 'react'

// Light flashes inside the headline pill: three white waves spread from the centre
// to the edge and a soft sheen sweeps across. Everything is clipped to the pill,
// nothing shows outside it. Plays three times after load, then rests.
const START = 1.2
const WAVES = [0, 0.4, 0.8]

export default function HeroPillRipple() {
  return (
    <div className="hero-pill-flash" aria-hidden="true">
      {WAVES.map((delay) => (
        <span key={delay} className="hero-pill-wave" style={{ animationDelay: `${START + delay}s` }} />
      ))}
      <span className="hero-pill-sheen" style={{ animationDelay: `${START}s` }} />
      <style>{`
        .hero-pill-flash {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          overflow: hidden;
          pointer-events: none;
          mix-blend-mode: screen;
        }
        .hero-pill-wave {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 3px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.9), inset 0 0 10px rgba(255, 255, 255, 0.7);
          opacity: 0;
          transform: scale(0.12);
          animation: heroPillWave 1.7s cubic-bezier(0.25, 0.7, 0.3, 1) 3;
        }
        .hero-pill-sheen {
          position: absolute;
          top: -40%;
          bottom: -40%;
          left: 0;
          width: 38%;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%);
          transform: translateX(-160%) skewX(-18deg);
          opacity: 0;
          animation: heroPillSheen 1.7s ease-in-out 3;
        }
        @keyframes heroPillWave {
          0%   { transform: scale(0.12); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: scale(1.08); opacity: 0; }
        }
        @keyframes heroPillSheen {
          0%   { transform: translateX(-160%) skewX(-18deg); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(380%) skewX(-18deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-pill-wave, .hero-pill-sheen { animation: none; }
        }
      `}</style>
    </div>
  )
}

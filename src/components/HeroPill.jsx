import React from 'react'

// The original headline pill image, untouched, with a light-flash layer above it.
// The flash layer is clipped to the inner pill and has the building cut out of it,
// so the waves and the sheen run behind the building and never outside the fill.
// Plays three times after load, then rests.
const START = 1.2
const WAVES = [0, 0.4, 0.8]

export default function HeroPill() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        decoding="async"
        width="286"
        height="150"
        src="/assets/images/zem5ljiIMhVZOBlOiatmZWIP3o.png"
        alt=""
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <svg
        className="hero-pill-flash"
        viewBox="0 0 286 150"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          WebkitMaskImage: 'url(/assets/images/pill-flash-mask.png)',
          maskImage: 'url(/assets/images/pill-flash-mask.png)',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
        }}
      >
        <defs>
          <clipPath id="hpInner">
            <rect x="26" y="18" width="234" height="114" rx="57" />
          </clipPath>
          <linearGradient id="hpSheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g clipPath="url(#hpInner)">
          {WAVES.map((delay) => (
            <rect
              key={delay}
              className="hero-pill-wave"
              x="26" y="18" width="234" height="114" rx="57"
              fill="none"
              stroke="#ffffff"
              strokeWidth="7"
              style={{ animationDelay: `${START + delay}s` }}
            />
          ))}
          <rect
            className="hero-pill-sheen"
            x="-60" y="-20" width="80" height="190"
            fill="url(#hpSheen)"
            style={{ animationDelay: `${START}s` }}
          />
        </g>
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
            15%  { opacity: 0.95; }
            100% { transform: scale(1); opacity: 0; }
          }
          @keyframes heroPillSheen {
            0%   { transform: translateX(0) skewX(-16deg); opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 1; }
            100% { transform: translateX(380px) skewX(-16deg); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero-pill-wave, .hero-pill-sheen { animation: none; }
          }
        `}</style>
      </svg>
    </div>
  )
}

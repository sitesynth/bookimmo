import React, { useEffect, useRef, useState } from 'react'

// One short line under the headline plus club facts on a slowly turning 3D ring:
// the phrase in front is sharp and dark, phrases on the sides shrink, blur and fade.
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

const TURN_SECONDS = 44
const STEP = (Math.PI * 2) / PHRASES.length

function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const update = () => setNarrow(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return narrow
}

function LinearTicker() {
  const items = [...PHRASES, ...PHRASES]
  return (
    <div
      className="hero-ticker"
      style={{
        overflow: 'hidden',
        maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
      }}
    >
      <div className="hero-ticker-track" style={{ display: 'flex', width: 'max-content' }}>
        {items.map((phrase, index) => (
          <span
            key={`${phrase}-${index}`}
            aria-hidden={index >= PHRASES.length}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 16, paddingRight: 16, fontFamily: '"Lexend", sans-serif', fontSize: 15, fontWeight: 500, whiteSpace: 'nowrap', color: 'rgb(25,26,32)' }}
          >
            {phrase}
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgb(255,102,37)', flexShrink: 0 }} />
          </span>
        ))}
      </div>
      <style>{`
        .hero-ticker-track { animation: heroTicker 38s linear infinite; }
        @keyframes heroTicker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  )
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}

function Ring() {
  const itemsRef = useRef([])
  const frameRef = useRef(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    let start = performance.now()
    let pausedAt = 0

    const radiusFor = () => Math.min(430, Math.max(300, window.innerWidth * 0.36))

    const render = (now) => {
      if (pausedRef.current) {
        if (!pausedAt) pausedAt = now
      } else if (pausedAt) {
        start += now - pausedAt
        pausedAt = 0
      }
      const radius = radiusFor()
      const base = ((now - start) / 1000 / TURN_SECONDS) * Math.PI * 2
      itemsRef.current.forEach((el, index) => {
        if (!el) return
        const angle = index * STEP - base
        const depth = Math.cos(angle) // 1 in front, -1 at the back
        const x = Math.sin(angle) * radius
        const z = depth * radius
        if (depth < 0.02) {
          el.style.opacity = '0'
          el.style.transform = `translate3d(${x}px, 0, ${z}px)`
          return
        }
        const eased = depth ** 1.6
        el.style.opacity = String(0.08 + 0.92 * eased)
        el.style.filter = `blur(${((1 - depth) * 3.2).toFixed(2)}px)`
        el.style.transform = `translate3d(${x}px, 0, ${z}px)`
      })
      frameRef.current = requestAnimationFrame(render)
    }

    frameRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      style={{
        position: 'relative',
        height: 56,
        width: '100%',
        overflow: 'hidden',
        perspective: 1500,
        perspectiveOrigin: '50% 50%',
        maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
        {PHRASES.map((phrase, index) => (
          <span
            key={phrase}
            ref={(el) => { itemsRef.current[index] = el }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginTop: -12,
              marginLeft: 'calc(var(--w, 0px) / -2)',
              whiteSpace: 'nowrap',
              fontFamily: '"Lexend", sans-serif',
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              color: 'rgb(25,26,32)',
              willChange: 'transform, opacity, filter',
              opacity: 0,
              transform: 'translate3d(0, 0, 0)',
            }}
          >
            <Measured>{phrase}</Measured>
          </span>
        ))}
      </div>
    </div>
  )
}

// Centres each phrase on its own width without a layout pass per frame.
function Measured({ children }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => el.parentElement?.style.setProperty('--w', `${el.getBoundingClientRect().width}px`)
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <span ref={ref} style={{ display: 'inline-block' }}>{children}</span>
}

function StaticList() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 22px' }}>
      {PHRASES.map((phrase) => (
        <span key={phrase} style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, fontWeight: 500, color: 'rgb(25,26,32)' }}>{phrase}</span>
      ))}
    </div>
  )
}

export default function HeroTicker() {
  const reduced = useReducedMotion()
  const narrow = useNarrow()
  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      <p
        style={{
          margin: '0 auto',
          maxWidth: 940,
          textAlign: 'center',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 'clamp(18px, 2.1vw, 24px)',
          fontWeight: 500,
          lineHeight: 1.4,
          color: 'rgb(25,26,32)',
        }}
      >
        The rental club for expats. <span style={{ color: 'rgba(25,26,32,0.6)' }}>Verified once, the AI does the rest.</span>
      </p>
      <div style={{ marginTop: 18 }} aria-label={PHRASES.join('. ')}>
        {reduced ? <StaticList /> : narrow ? <LinearTicker /> : <Ring />}
      </div>
    </div>
  )
}

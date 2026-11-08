import React from 'react'

const FONT = '"Lexend", sans-serif'
const INK = 'rgb(25,26,32)'
const ORANGE = 'rgb(255,102,37)'
const SOFT = 'rgba(25,26,32,0.6)'
const LINE = '1px solid rgba(25,26,32,0.08)'

const iconProps = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: ORANGE, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
const ICONS = {
  chat: (
    <svg {...iconProps}><path d="M20 12c0 4-3.6 7-8 7-1.2 0-2.3-.2-3.3-.6L4 19l1.2-3.4C4.4 14.5 4 13.3 4 12c0-4 3.6-7 8-7s8 3 8 7z" /><path d="M9 11.5h6M9 14.5h3.5" /></svg>
  ),
  file: (
    <svg {...iconProps}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 14.5l2 2 4-4.5" /></svg>
  ),
  spark: (
    <svg {...iconProps}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></svg>
  ),
}

const STATS = [
  ['10k+', 'Listings watched'],
  ['24/7', 'Watching for you'],
  ['€0', 'Success fee'],
]

const FEATURES = [
  ['chat', 'All communication, handled'],
  ['file', 'Documents, ready'],
  ['spark', 'Exclusives, first'],
]

function ClubCard() {
  return (
    <div className="framer-un23b5" data-border="true">
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: 24 }}>
        <div>
          {['Paperwork.', 'Language.', 'Timing.'].map((word) => (
            <p key={word} style={{ margin: 0, fontFamily: FONT, fontSize: 32, fontWeight: 600, lineHeight: 1.12, letterSpacing: '-0.025em', color: INK }}>{word}</p>
          ))}
          <p style={{ margin: '10px 0 0', fontFamily: FONT, fontSize: 17, fontWeight: 500, color: ORANGE }}>
            The club takes all three off your plate.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          {STATS.map(([value, label]) => (
            <div key={label}>
              <p style={{ margin: 0, fontFamily: FONT, fontSize: 30, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em', color: INK, whiteSpace: 'nowrap' }}>{value}</p>
              <p style={{ margin: '8px 0 0', fontFamily: FONT, fontSize: 13, lineHeight: 1.3, color: SOFT }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map(([icon, title]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,102,37,0.11)' }}>
                {ICONS[icon]}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: INK }}>{title}</span>
            </div>
          ))}
        </div>

        <a
          href="./search"
          style={{
            marginTop: 'auto', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '13px 20px', borderRadius: 12, backgroundColor: INK, color: 'rgb(245,245,245)',
            fontFamily: FONT, fontSize: 14, fontWeight: 500, textDecoration: 'none',
          }}
        >
          Browse live listings
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </div>
    </div>
  )
}

export default function Explore() {
  return (
    <>
      <section className="framer-ospjfn" id="explore" style={{ minHeight: 0, height: 'auto', paddingTop: 'clamp(48px, 6vw, 72px)', paddingBottom: 'clamp(48px, 6vw, 72px)' }}><div className="framer-1il8hii"><div className="framer-uu7rbx"><div className="framer-ol5pqw"><div className="framer-1j57kmt"><div className="framer-1od91ro" style={{transform: "none"}}><h2 className="framer-text framer-styles-preset-utqn72" style={{"--framer-font-size": "40px", "--framer-line-height": "1.1em", whiteSpace: "nowrap"}}>We hunt.<br /><span style={{'--framer-text-color': "var(--token-5c28b080-63a4-416d-b638-2f3867ab529e, rgb(255, 102, 37))"}} className="framer-text">You choose.</span></h2></div><div className="ssr-variant hidden-1woyh6i"><div className="framer-15xsjwz"><div style={{position: "absolute", borderRadius: "inherit", top: "0", right: "0", bottom: "0", left: "0"}}><img decoding="async" width="1176" height="1356" sizes="(min-width: 1200px) 320.5px, (min-width: 810px) and (max-width: 1199.98px) 320.5px, (max-width: 809.98px) min(100vw - 32px, 1200px)" srcSet="/assets/images/5QUUPPX8KvTI2vwKGRCYLHc7w.png 888w,/assets/images/5QUUPPX8KvTI2vwKGRCYLHc7w.png 1176w" src="/assets/images/5QUUPPX8KvTI2vwKGRCYLHc7w.png" alt="House image" style={{display: "block", width: "100%", height: "100%", borderRadius: "inherit", objectPosition: "center", objectFit: "cover"}} /></div></div></div><div className="ssr-variant hidden-olbwcu hidden-72rtr7"><div className="framer-15xsjwz"><div style={{position: "absolute", borderRadius: "inherit", top: "0", right: "0", bottom: "0", left: "0"}}><img decoding="async" width="1176" height="1356" sizes="(min-width: 1200px) 320.5px, (min-width: 810px) and (max-width: 1199.98px) 320.5px, (max-width: 809.98px) min(100vw - 32px, 1200px)" srcSet="/assets/images/5QUUPPX8KvTI2vwKGRCYLHc7w.png 888w,/assets/images/5QUUPPX8KvTI2vwKGRCYLHc7w.png 1176w" src="/assets/images/5QUUPPX8KvTI2vwKGRCYLHc7w.png" alt="House image" style={{display: "block", width: "100%", height: "100%", borderRadius: "inherit", objectPosition: "center", objectFit: "cover"}} /></div></div></div></div><div className="framer-g63xhy"><div className="framer-qit9l1-container"><video src="/assets/videos/0BVczrPw7yH6qSj2ZOLQNujmUnk.mp4" loop preload="auto" muted playsInline style={{cursor: "auto", width: "100%", height: "100%", borderRadius: "0px", display: "block", objectFit: "cover", backgroundColor: "rgba(0, 0, 0, 0)", objectPosition: "50% 50%"}} autoPlay ref={el => { if (el) { el.muted = true; el.play?.().catch(() => {}) } }}></video></div></div></div><div className="framer-1t6xdsw" style={{top: "auto", bottom: 16, left: 16, right: "auto", transform: "none", borderRadius: 999, padding: "10px 18px", boxShadow: "0 8px 24px rgba(25,26,32,0.16)"}}><div className="framer-11lf28u" style={{transform: "none"}}><p className="framer-text framer-styles-preset-ia5eoh" style={{'--framer-text-alignment': "center"}}>Wherever you move next</p></div></div></div><ClubCard /></div></section>
    </>
  )
}

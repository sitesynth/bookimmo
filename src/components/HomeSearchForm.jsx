import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const TX_TYPES = ['Buy', 'Rent']

const BUY_BUDGETS = [
  { label: 'Any',           min: null,    max: null    },
  { label: 'Up to €150k',  min: null,    max: 150000  },
  { label: '€150k–€300k',  min: 150000,  max: 300000  },
  { label: '€300k–€500k',  min: 300000,  max: 500000  },
  { label: '€500k–€800k',  min: 500000,  max: 800000  },
  { label: '€800k–€1.5M',  min: 800000,  max: 1500000 },
  { label: 'Over €1.5M',   min: 1500000, max: null    },
]

const RENT_BUDGETS = [
  { label: 'Any',               min: null,  max: null  },
  { label: 'Up to €800/mo',    min: null,  max: 800   },
  { label: '€800–€1,500/mo',   min: 800,   max: 1500  },
  { label: '€1,500–€2,500/mo', min: 1500,  max: 2500  },
  { label: '€2,500–€4,000/mo', min: 2500,  max: 4000  },
  { label: 'Over €4,000/mo',   min: 4000,  max: null  },
]

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'New property', 'Land', 'Commercial', 'Office']
const BED_OPTS  = ['Any', '1', '2', '3', '4', '5+']
const SIZE_OPTS = ['Any', '50 m²', '75 m²', '100 m²', '150 m²', '200 m²', '300 m²']

const SEP = () => (
  <div style={{width:1, alignSelf:'stretch', backgroundColor:'rgba(25,26,32,0.08)', margin:'8px 0', flexShrink:0}} />
)

function Select({ label, options, value, onChange, minWidth = 130, fullWidth = false, fs = 13 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const active = value && value !== 'Any' && value !== 'All'
  const displayLabel = active ? value : label

  return (
    <div ref={ref} style={{position:'relative', display:'flex', alignItems:'stretch', width: fullWidth ? '100%' : undefined, height: fullWidth ? '100%' : undefined}}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'0 14px',
          minWidth: fullWidth ? 0 : minWidth,
          width: fullWidth ? '100%' : undefined,
          background:'none', border:'none', cursor:'pointer',
          fontFamily:'"Lexend",sans-serif', fontSize: fullWidth ? 15 : fs,
          color: active ? 'rgb(255,102,37)' : 'rgb(25,26,32)',
          fontWeight: active ? 600 : 400,
          whiteSpace:'nowrap', height:'100%',
        }}>
        <span style={{flex:1, textAlign:'left'}}>{displayLabel}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{flexShrink:0, transition:'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none'}}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0,
          minWidth: Math.max(fullWidth ? 0 : minWidth, 180),
          width: fullWidth ? '100%' : undefined,
          backgroundColor:'white', borderRadius:12,
          boxShadow:'0 8px 32px rgba(25,26,32,0.16)',
          border:'1px solid rgba(25,26,32,0.08)',
          zIndex:300, maxHeight:260, overflowY:'auto',
        }}>
          {options.map(opt => {
            const isSelected = value === opt || (!value && (opt === 'Any' || opt === 'All'))
            return (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  width:'100%', textAlign:'left', padding:'9px 14px',
                  background:'none', border:'none', cursor:'pointer',
                  fontFamily:'"Lexend",sans-serif', fontSize:13,
                  color: isSelected ? 'rgb(255,102,37)' : 'rgb(25,26,32)',
                  fontWeight: isSelected ? 600 : 400,
                  backgroundColor: isSelected ? 'rgba(255,102,37,0.06)' : 'transparent',
                }}>
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MultiSelect({ label, options, values, onChange, minWidth = 155, fullWidth = false, fs = 13 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = (opt) => {
    if (values.includes(opt)) onChange(values.filter(v => v !== opt))
    else onChange([...values, opt])
  }

  const active = values.length > 0
  const displayLabel = active
    ? (values.length === 1 ? values[0] : `${values.length} types`)
    : label

  return (
    <div ref={ref} style={{position:'relative', display:'flex', alignItems:'stretch', width: fullWidth ? '100%' : undefined, height: fullWidth ? '100%' : undefined}}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'0 14px',
          minWidth: fullWidth ? 0 : minWidth,
          width: fullWidth ? '100%' : undefined,
          background:'none', border:'none', cursor:'pointer',
          fontFamily:'"Lexend",sans-serif', fontSize: fullWidth ? 15 : fs,
          color: active ? 'rgb(255,102,37)' : 'rgb(25,26,32)',
          fontWeight: active ? 600 : 400,
          whiteSpace:'nowrap', height:'100%',
        }}>
        <span style={{flex:1, textAlign:'left'}}>{displayLabel}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{flexShrink:0, transition:'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none'}}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0,
          minWidth: Math.max(fullWidth ? 0 : minWidth, 200),
          width: fullWidth ? '100%' : undefined,
          backgroundColor:'white', borderRadius:12,
          boxShadow:'0 8px 32px rgba(25,26,32,0.16)',
          border:'1px solid rgba(25,26,32,0.08)',
          zIndex:300,
        }}>
          {values.length > 0 && (
            <button type="button" onClick={() => onChange([])}
              style={{
                display:'flex', alignItems:'center', gap:10,
                width:'100%', textAlign:'left', padding:'9px 14px',
                background:'none', border:'none', borderBottom:'1px solid rgba(25,26,32,0.08)', cursor:'pointer',
                fontFamily:'"Lexend",sans-serif', fontSize:12,
                color:'rgba(25,26,32,0.45)', fontWeight:400,
              }}>
              All types
            </button>
          )}
          {options.map(opt => {
            const checked = values.includes(opt)
            return (
              <button key={opt} type="button" onClick={() => toggle(opt)}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  width:'100%', textAlign:'left', padding:'9px 14px',
                  background:'none', border:'none', cursor:'pointer',
                  fontFamily:'"Lexend",sans-serif', fontSize:13,
                  color: checked ? 'rgb(255,102,37)' : 'rgb(25,26,32)',
                  fontWeight: checked ? 600 : 400,
                  backgroundColor: checked ? 'rgba(255,102,37,0.06)' : 'transparent',
                }}>
                <span style={{
                  width:16, height:16, borderRadius:4, flexShrink:0,
                  border: checked ? '2px solid rgb(255,102,37)' : '1.5px solid rgba(25,26,32,0.25)',
                  backgroundColor: checked ? 'rgb(255,102,37)' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return mobile
}

const BookImmoLogo = () => (
  <svg width="22" height="20" viewBox="0 0 28.5 25" style={{flexShrink:0}} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hsf-lg0" x1="14.1" y1="3.2" x2="14.1" y2="27.1" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffb800"/><stop offset="1" stopColor="#ff8c00"/>
      </linearGradient>
      <linearGradient id="hsf-lg1" x1="7" y1="3.2" x2="7" y2="27.1" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffb800"/><stop offset="1" stopColor="#ff8c00"/>
      </linearGradient>
    </defs>
    <path d="M27.8,16.9c0,1.7-.5,3.7-1.2,5.5h0l-6-3.5v-3.4c0-.9-.7-1.5-1.5-1.5s-1.5.7-1.5,1.5v1.5l-8.3-4.9c-.2-.1-.5-.2-.8-.2h0c-.3,0-.6,0-.9.3L.5,16.3C.8,9,6.8,3.2,14.1,3.2s13.7,6.1,13.7,13.7Z" fill="url(#hsf-lg0)"/>
    <path d="M2.8,24.6c-.9-1.4-1.6-2.9-1.9-4.5l7.6-4.7,4.7,2.8-10.4,6.5h0Z" fill="url(#hsf-lg1)"/>
  </svg>
)

const ANIM_STYLE = `
  @keyframes hsf-sweep {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
`

const BORDER_WRAP = {
  padding: 1.5, borderRadius: 17,
  background: 'linear-gradient(90deg, rgba(25,26,32,0.08) 0%, rgba(255,140,0,0.7) 40%, rgba(255,184,0,0.9) 50%, rgba(255,140,0,0.7) 60%, rgba(25,26,32,0.08) 100%)',
  backgroundSize: '200% 100%',
  animation: 'hsf-sweep 3s ease-in-out infinite',
}

export default function HomeSearchForm() {
  const navigate  = useNavigate()
  const { lang }  = useParams()
  const isMobile  = useIsMobile()

  const [txType,      setTxType]      = useState('Buy')
  const [text,        setText]        = useState('')
  const [propTypes,   setPropTypes]   = useState([])
  const [budget,      setBudget]      = useState('')
  const [bedroomsMin, setBedroomsMin] = useState('')
  const [bedroomsMax, setBedroomsMax] = useState('')
  const [sizeMin,     setSizeMin]     = useState('')
  const [sizeMax,     setSizeMax]     = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleTxType = (t) => { setTxType(t); setBudget('') }
  const budgets = txType === 'Buy' ? BUY_BUDGETS : RENT_BUDGETS


  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (text) params.set('q', text)
    params.set('type', txType.toLowerCase())
    propTypes.forEach(pt => params.append('category[]', pt))
    const bObj = budgets.find(b => b.label === budget)
    if (bObj?.min != null) params.set('priceMin', bObj.min)
    if (bObj?.max != null) params.set('priceMax', bObj.max)
    if (bedroomsMin && bedroomsMin !== 'Any') params.set('bedroomsMin', bedroomsMin.replace('+',''))
    if (bedroomsMax && bedroomsMax !== 'Any') params.set('bedroomsMax', bedroomsMax.replace('+',''))
    navigate(`/${lang || 'de'}/search?${params.toString()}`)
  }

  /* ── MOBILE LAYOUT ── */
  if (isMobile) {
    return (
      <div style={{ position:'relative', width:'100%', boxSizing:'border-box' }}>
        <style>{ANIM_STYLE}</style>
        <div style={BORDER_WRAP}>
          <div style={{ backgroundColor:'white', borderRadius:16 }}>

            {/* Label row */}
            <div style={{ padding:'12px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <BookImmoLogo />
                <span style={{fontFamily:'"Lexend",sans-serif', fontSize:11, fontWeight:500, color:'rgba(25,26,32,0.4)', letterSpacing:'0.06em', textTransform:'uppercase'}}>
                  Find your property
                </span>
              </div>
            </div>

            <form onSubmit={handleSearch} style={{padding:'12px 14px 14px', display:'flex', flexDirection:'column', gap:10}}>

              {/* Buy / Rent toggle */}
              <div style={{display:'flex', gap:4, padding:4, borderRadius:14, backgroundColor:'rgba(25,26,32,0.06)'}}>
                {TX_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => handleTxType(t)}
                    style={{
                      flex:1, height:40, borderRadius:10, border:'none', cursor:'pointer',
                      fontFamily:'"Lexend",sans-serif', fontSize:14, fontWeight:600,
                      backgroundColor: txType === t ? 'rgb(25,26,32)' : 'transparent',
                      color: txType === t ? 'white' : 'rgba(25,26,32,0.7)',
                      boxShadow: txType === t ? '0 4px 12px rgba(25,26,32,0.18)' : 'none',
                      transition:'background-color 0.18s, color 0.18s, box-shadow 0.18s',
                    }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Location input */}
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'0 16px', height:52,
                border:'none', borderRadius:14,
                backgroundColor:'rgba(25,26,32,0.05)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0, opacity:0.3}}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="rgb(25,26,32)" strokeWidth="1.5"/>
                  <circle cx="12" cy="10" r="3" stroke="rgb(25,26,32)" strokeWidth="1.5"/>
                </svg>
                <input value={text} onChange={e => setText(e.target.value)}
                  placeholder="Region, municipality, locality…"
                  style={{flex:1, border:'none', outline:'none', fontFamily:'"Lexend",sans-serif', fontSize:15, color:'rgb(25,26,32)', background:'transparent'}} />
              </div>

              {/* Filters toggle */}
              <button type="button" onClick={() => setShowFilters(s => !s)}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'6px 0', border:'none',
                  background:'none', cursor:'pointer',
                  fontFamily:'"Lexend",sans-serif', fontSize:13, fontWeight:500, color:'rgba(25,26,32,0.6)',
                }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {showFilters ? 'Hide filters' : 'More filters'}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
                  style={{transition:'transform 0.15s', transform: showFilters ? 'rotate(180deg)' : 'none'}}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showFilters && (
                <>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <div style={{display:'flex', alignItems:'stretch', borderRadius:14, backgroundColor:'rgba(25,26,32,0.05)', height:52}}>
                      <MultiSelect label="Property type" options={PROPERTY_TYPES} values={propTypes} onChange={setPropTypes} fullWidth />
                    </div>
                    <div style={{display:'flex', alignItems:'stretch', borderRadius:14, backgroundColor:'rgba(25,26,32,0.05)', height:52}}>
                      <Select label="Budget" options={budgets.map(b => b.label)} value={budget} onChange={v => setBudget(v === 'Any' ? '' : v)} fullWidth />
                    </div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <div style={{display:'flex', alignItems:'stretch', borderRadius:14, backgroundColor:'rgba(25,26,32,0.05)', height:52}}>
                      <Select label="Min Beds" options={BED_OPTS} value={bedroomsMin} onChange={v => setBedroomsMin(v === 'Any' ? '' : v)} fullWidth />
                    </div>
                    <div style={{display:'flex', alignItems:'stretch', borderRadius:14, backgroundColor:'rgba(25,26,32,0.05)', height:52}}>
                      <Select label="Max Beds" options={BED_OPTS} value={bedroomsMax} onChange={v => setBedroomsMax(v === 'Any' ? '' : v)} fullWidth />
                    </div>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    <div style={{display:'flex', alignItems:'stretch', borderRadius:14, backgroundColor:'rgba(25,26,32,0.05)', height:52}}>
                      <Select label="Min Size" options={SIZE_OPTS} value={sizeMin} onChange={v => setSizeMin(v === 'Any' ? '' : v)} fullWidth />
                    </div>
                    <div style={{display:'flex', alignItems:'stretch', borderRadius:14, backgroundColor:'rgba(25,26,32,0.05)', height:52}}>
                      <Select label="Max Size" options={SIZE_OPTS} value={sizeMax} onChange={v => setSizeMax(v === 'Any' ? '' : v)} fullWidth />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn-shine" style={{
                width:'100%', height:54, borderRadius:4, border:'none', cursor:'pointer',
                backgroundColor:'rgb(255,102,37)', color:'white',
                boxShadow:'0 10px 24px rgba(255,102,37,0.28)',
                fontFamily:'"Lexend",sans-serif', fontSize:15, fontWeight:600,
              }}>
                Search
              </button>

            </form>
          </div>
        </div>
      </div>
    )
  }

  /* ── DESKTOP LAYOUT ── */
  return (
    <div style={{ position:'relative', marginTop:0, marginBottom:0, width:'min(1120px, calc(100vw - 48px))' }}>
      <div>
        <style>{ANIM_STYLE}</style>
        <div style={{ ...BORDER_WRAP, borderRadius:23, boxShadow:'0 24px 60px rgba(25,26,32,0.10)' }}>
          <div style={{ backgroundColor:'white', borderRadius:22, overflow:'visible' }}>

            <div style={{ padding:'18px 28px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <BookImmoLogo />
                <span style={{fontFamily:'"Lexend",sans-serif', fontSize:12, fontWeight:500, color:'rgba(25,26,32,0.4)', letterSpacing:'0.06em', textTransform:'uppercase'}}>
                  Find your property
                </span>
              </div>
            </div>

            <form onSubmit={handleSearch}>
              <div style={{display:'flex', alignItems:'stretch', borderBottom:'1px solid rgba(25,26,32,0.07)', minHeight:76, margin:'0 14px'}}>
                <Select label="Buy" options={TX_TYPES} value={txType} onChange={handleTxType} minWidth={96} fs={15} />
                <SEP />
                <div style={{flex:'1 1 0', display:'flex', alignItems:'center', gap:10, padding:'0 18px', minWidth:0}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{flexShrink:0, opacity:0.3}}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="rgb(25,26,32)" strokeWidth="1.5"/>
                    <circle cx="12" cy="10" r="3" stroke="rgb(25,26,32)" strokeWidth="1.5"/>
                  </svg>
                  <input value={text} onChange={e => setText(e.target.value)}
                    placeholder="Region, municipality, locality, ref…"
                    style={{flex:1, border:'none', outline:'none', fontFamily:'"Lexend",sans-serif', fontSize:16, color:'rgb(25,26,32)', background:'transparent', minWidth:0}} />
                </div>
                <SEP />
                <MultiSelect label="All property types" options={PROPERTY_TYPES} values={propTypes} onChange={setPropTypes} minWidth={180} fs={15} />
                <SEP />
                <Select label="Budget" options={budgets.map(b => b.label)} value={budget} onChange={v => setBudget(v === 'Any' ? '' : v)} minWidth={160} fs={15} />
                <SEP />
                <button type="submit" className="btn-shine" style={{
                  margin:'12px 0 12px 14px', padding:'0 44px',
                  backgroundColor:'rgb(255,102,37)', border:'none', cursor:'pointer',
                  fontFamily:'"Lexend",sans-serif', fontSize:16, fontWeight:600, color:'white',
                  flexShrink:0, borderRadius:4, transition:'background-color 0.2s, box-shadow 0.2s',
                  boxShadow:'0 10px 24px rgba(255,102,37,0.28)',
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(232,84,22)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(255,102,37)'}>
                  Search
                </button>
              </div>

              <div style={{display:'flex', alignItems:'stretch', minHeight:60, margin:'0 14px 6px'}}>
                <Select label="Min Bedrooms" options={BED_OPTS} value={bedroomsMin} onChange={v => setBedroomsMin(v === 'Any' ? '' : v)} minWidth={130} />
                <SEP />
                <Select label="Max Bedrooms" options={BED_OPTS} value={bedroomsMax} onChange={v => setBedroomsMax(v === 'Any' ? '' : v)} minWidth={130} />
                <SEP />
                <Select label="Min Size" options={SIZE_OPTS} value={sizeMin} onChange={v => setSizeMin(v === 'Any' ? '' : v)} minWidth={110} />
                <SEP />
                <Select label="Max Size" options={SIZE_OPTS} value={sizeMax} onChange={v => setSizeMax(v === 'Any' ? '' : v)} minWidth={110} />
                <div style={{flex:1}} />
                <button type="button"
                  onClick={() => navigate(`/${lang || 'de'}/search?map=1`)}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'0 22px', background:'none',
                    border:'none', borderLeft:'1px solid rgba(25,26,32,0.07)',
                    cursor:'pointer', fontFamily:'"Lexend",sans-serif',
                    fontSize:14, fontWeight:500, color:'rgba(25,26,32,0.6)', flexShrink:0,
                  }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M9 3v15M15 6v15" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Map search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

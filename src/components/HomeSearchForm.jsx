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
  { label: 'Any',             min: null,  max: null  },
  { label: 'Up to €800/mo',  min: null,  max: 800   },
  { label: '€800–€1,500/mo', min: 800,   max: 1500  },
  { label: '€1,500–€2,500/mo', min: 1500, max: 2500 },
  { label: '€2,500–€4,000/mo', min: 2500, max: 4000 },
  { label: 'Over €4,000/mo', min: 4000,  max: null  },
]

const PROPERTY_TYPES = ['All', 'Apartment', 'House', 'Villa', 'New property', 'Land', 'Commercial', 'Office']
const BED_OPTS  = ['Any', '1', '2', '3', '4', '5+']
const SIZE_OPTS = ['Any', '50 m²', '75 m²', '100 m²', '150 m²', '200 m²', '300 m²']

// Design-system divider matching BookImmo's rgba(25,26,32,0.08) borders
const SEP = () => (
  <div style={{width:1, alignSelf:'stretch', backgroundColor:'rgba(25,26,32,0.08)', margin:'8px 0', flexShrink:0}} />
)

function Select({ label, options, value, onChange, minWidth = 130 }) {
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
    <div ref={ref} style={{position:'relative', display:'flex', alignItems:'stretch'}}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'0 14px', minWidth, background:'none', border:'none', cursor:'pointer',
          fontFamily:'"Lexend",sans-serif', fontSize:13,
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
          minWidth: Math.max(minWidth, 180),
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

export default function HomeSearchForm() {
  const navigate  = useNavigate()
  const { lang }  = useParams()

  const [txType,      setTxType]      = useState('Buy')
  const [text,        setText]        = useState('')
  const [propType,    setPropType]    = useState('')
  const [budget,      setBudget]      = useState('')
  const [bedroomsMin, setBedroomsMin] = useState('')
  const [bedroomsMax, setBedroomsMax] = useState('')
  const [sizeMin,     setSizeMin]     = useState('')
  const [sizeMax,     setSizeMax]     = useState('')
  const [propCount,   setPropCount]   = useState(null)

  // Reset budget when switching Buy/Rent (price ranges are incompatible)
  const handleTxType = (t) => { setTxType(t); setBudget('') }

  const budgets = txType === 'Buy' ? BUY_BUDGETS : RENT_BUDGETS

  useEffect(() => {
    fetch('/api/directus?path=/items/properties&query=' +
      encodeURIComponent('filter[status][_eq]=published&limit=1&aggregate[count]=id'))
      .then(r => r.json())
      .then(json => {
        const c = json?.data?.[0]?.count?.id
        if (c) setPropCount(Number(c))
      }).catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (text) params.set('q', text)
    params.set('type', txType.toLowerCase())
    if (propType && propType !== 'All') params.set('category', propType)
    const bObj = budgets.find(b => b.label === budget)
    if (bObj?.min != null) params.set('priceMin', bObj.min)
    if (bObj?.max != null) params.set('priceMax', bObj.max)
    if (bedroomsMin && bedroomsMin !== 'Any') params.set('bedroomsMin', bedroomsMin.replace('+',''))
    if (bedroomsMax && bedroomsMax !== 'Any') params.set('bedroomsMax', bedroomsMax.replace('+',''))
    navigate(`/${lang || 'de'}/search?${params.toString()}`)
  }

  return (
    /*
     * Pull the form up by ~218px so it overlays the bottom of the hero image.
     * z-index:10 puts it above Framer's hero content.
     * The maxWidth container keeps it within the page's content column.
     */
    <div style={{
      position:'relative', zIndex:10,
      marginTop:-148, marginBottom:0,
      padding:'0 40px',
    }}>
      <div style={{maxWidth:1400, margin:'0 auto'}}>

        {/* Claim bar — headline + live property count */}
        <div style={{
          backgroundColor:'white',
          borderRadius:'12px 12px 0 0',
          padding:'14px 20px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          borderBottom:'1px solid rgba(25,26,32,0.08)',
        }}>
          <p style={{margin:0, fontFamily:'"Lexend",sans-serif', fontSize:15, fontWeight:600, color:'rgb(25,26,32)'}}>
            Find your perfect property with BookImmo
          </p>
          {propCount != null && (
            <span style={{fontFamily:'"Lexend",sans-serif', fontSize:13, fontWeight:600, color:'rgb(255,102,37)', whiteSpace:'nowrap', marginLeft:16}}>
              {propCount.toLocaleString()} listings
            </span>
          )}
        </div>

        {/* Card */}
        <div style={{
          backgroundColor:'white',
          border:'1px solid rgba(25,26,32,0.08)',
          borderTop:'none',
          borderRadius:'0 0 12px 12px',
          boxShadow:'0 12px 40px rgba(25,26,32,0.14)',
          overflow:'visible',
        }}>
          <form onSubmit={handleSearch}>

            {/* ── Row 1 ── */}
            <div style={{display:'flex', alignItems:'stretch', borderBottom:'1px solid rgba(25,26,32,0.08)', minHeight:52}}>

              {/* Transaction type */}
              <Select label="Buy" options={TX_TYPES} value={txType} onChange={handleTxType} minWidth={80} />
              <SEP />

              {/* Location input */}
              <div style={{flex:'1 1 0', display:'flex', alignItems:'center', gap:10, padding:'0 14px', minWidth:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0, opacity:0.35}}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="rgb(25,26,32)" strokeWidth="1.5"/>
                  <circle cx="12" cy="10" r="3" stroke="rgb(25,26,32)" strokeWidth="1.5"/>
                </svg>
                <input value={text} onChange={e => setText(e.target.value)}
                  placeholder="Region, municipality, locality, ref…"
                  style={{flex:1, border:'none', outline:'none', fontFamily:'"Lexend",sans-serif', fontSize:13, color:'rgb(25,26,32)', background:'transparent', minWidth:0}} />
              </div>
              <SEP />

              {/* Property type */}
              <Select label="All property types" options={PROPERTY_TYPES}
                value={propType} onChange={v => setPropType(v === 'All' ? '' : v)} minWidth={155} />
              <SEP />

              {/* Budget */}
              <Select label="Budget" options={budgets.map(b => b.label)}
                value={budget} onChange={v => setBudget(v === 'Any' ? '' : v)} minWidth={150} />

              {/* Search button — dark, matching BookImmo "Browse Listings" style */}
              <button type="submit" style={{
                margin:8, padding:'0 28px',
                backgroundColor:'rgb(25,26,32)',
                border:'none', cursor:'pointer',
                fontFamily:'"Lexend",sans-serif', fontSize:14, fontWeight:500, color:'white',
                flexShrink:0, borderRadius:8, transition:'background-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(25,26,32,0.82)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(25,26,32)'}>
                Search
              </button>
            </div>

            {/* ── Row 2 ── */}
            <div style={{display:'flex', alignItems:'stretch', minHeight:44}}>
              <Select label="Min Bedrooms" options={BED_OPTS}
                value={bedroomsMin} onChange={v => setBedroomsMin(v === 'Any' ? '' : v)} minWidth={130} />
              <SEP />
              <Select label="Max Bedrooms" options={BED_OPTS}
                value={bedroomsMax} onChange={v => setBedroomsMax(v === 'Any' ? '' : v)} minWidth={130} />
              <SEP />
              <Select label="Min Size" options={SIZE_OPTS}
                value={sizeMin} onChange={v => setSizeMin(v === 'Any' ? '' : v)} minWidth={110} />
              <SEP />
              <Select label="Max Size" options={SIZE_OPTS}
                value={sizeMax} onChange={v => setSizeMax(v === 'Any' ? '' : v)} minWidth={110} />

              <div style={{flex:1}} />

              {/* Map search */}
              <button type="button"
                onClick={() => navigate(`/${lang || 'de'}/search?map=1`)}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'0 20px', background:'none',
                  border:'none', borderLeft:'1px solid rgba(25,26,32,0.08)',
                  cursor:'pointer', fontFamily:'"Lexend",sans-serif',
                  fontSize:13, fontWeight:500, color:'rgb(25,26,32)', flexShrink:0,
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
  )
}

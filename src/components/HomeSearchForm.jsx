import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const PROPERTY_TYPES = ['All types', 'Apartment', 'House', 'Villa', 'Land', 'Commercial', 'Office']
const BUDGET_OPTIONS = [
  { label: 'Any budget',      min: null,    max: null    },
  { label: 'Up to €100k',    min: null,    max: 100000  },
  { label: '€100k – €300k', min: 100000,  max: 300000  },
  { label: '€300k – €500k', min: 300000,  max: 500000  },
  { label: '€500k – €1M',   min: 500000,  max: 1000000 },
  { label: '€1M – €2M',     min: 1000000, max: 2000000 },
  { label: 'Over €2M',       min: 2000000, max: null    },
]

function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} style={{position:'relative',flex:'0 0 auto'}}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{display:'flex',alignItems:'center',gap:6,padding:'0 14px',height:48,background:'none',border:'none',cursor:'pointer',fontFamily:'"Lexend",sans-serif',fontSize:14,fontWeight:500,color:'rgb(25,26,32)',whiteSpace:'nowrap'}}>
        {value || label}
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{transition:'transform 0.2s',transform:open?'rotate(180deg)':'none'}}>
          <path d="M1 1l5 5 5-5" stroke="rgb(25,26,32)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,minWidth:180,backgroundColor:'white',borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:100,overflow:'hidden'}}>
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false) }}
              style={{display:'block',width:'100%',textAlign:'left',padding:'10px 16px',background:'none',border:'none',cursor:'pointer',fontFamily:'"Lexend",sans-serif',fontSize:14,color:'rgb(25,26,32)',backgroundColor:value===opt?'rgba(255,102,37,0.08)':'transparent'}}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HomeSearchForm() {
  const navigate = useNavigate()
  const { lang } = useParams()
  const [txType, setTxType] = useState('buy')
  const [text, setText] = useState('')
  const [propType, setPropType] = useState('')
  const [budget, setBudget] = useState(BUDGET_OPTIONS[0])
  const [showMore, setShowMore] = useState(false)
  const [bedroomsMin, setBedroomsMin] = useState('')
  const [bedroomsMax, setBedroomsMax] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (text) params.set('q', text)
    params.set('type', txType)
    if (propType && propType !== 'All types') params.set('category', propType)
    if (budget.min != null) params.set('priceMin', budget.min)
    if (budget.max != null) params.set('priceMax', budget.max)
    if (bedroomsMin) params.set('bedroomsMin', bedroomsMin)
    if (bedroomsMax) params.set('bedroomsMax', bedroomsMax)
    navigate(`/${lang || 'de'}/search?${params.toString()}`)
  }

  const bedroomNums = ['1', '2', '3', '4', '5', '6+']

  return (
    <div style={{width:'100%',backgroundColor:'rgba(25,26,32,0.04)',padding:'0 0 40px'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 24px'}}>
        {/* card */}
        <div style={{backgroundColor:'white',borderRadius:16,boxShadow:'0 4px 32px rgba(25,26,32,0.10)',overflow:'visible'}}>

          {/* Buy / Rent tabs */}
          <div style={{display:'flex',borderBottom:'1px solid rgba(25,26,32,0.08)'}}>
            {['buy','rent'].map(t => (
              <button key={t} type="button" onClick={() => setTxType(t)}
                style={{padding:'14px 28px',background:'none',border:'none',cursor:'pointer',fontFamily:'"Lexend",sans-serif',fontSize:14,fontWeight:600,color:txType===t?'rgb(255,102,37)':'rgba(25,26,32,0.45)',borderBottom:txType===t?'2px solid rgb(255,102,37)':'2px solid transparent',marginBottom:-1,transition:'color 0.2s'}}>
                {t === 'buy' ? 'Buy' : 'Rent'}
              </button>
            ))}
          </div>

          {/* Main search row */}
          <form onSubmit={handleSearch}>
            <div style={{display:'flex',alignItems:'stretch',flexWrap:'wrap',gap:0}}>
              {/* Location input */}
              <div style={{flex:'1 1 260px',borderRight:'1px solid rgba(25,26,32,0.08)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 16px',height:56}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="rgba(25,26,32,0.35)" strokeWidth="1.5"/>
                    <circle cx="12" cy="10" r="3" stroke="rgba(25,26,32,0.35)" strokeWidth="1.5"/>
                  </svg>
                  <input value={text} onChange={e => setText(e.target.value)}
                    placeholder="Region, city, address or ref…"
                    style={{flex:1,border:'none',outline:'none',fontFamily:'"Lexend",sans-serif',fontSize:14,color:'rgb(25,26,32)',background:'transparent','::placeholder':{color:'rgba(25,26,32,0.35)'}}}/>
                </div>
              </div>

              {/* Property type */}
              <div style={{borderRight:'1px solid rgba(25,26,32,0.08)',display:'flex',alignItems:'center'}}>
                <Dropdown label="All property types"
                  options={PROPERTY_TYPES}
                  value={propType && propType !== 'All types' ? propType : ''}
                  onChange={v => setPropType(v === 'All types' ? '' : v)} />
              </div>

              {/* Budget */}
              <div style={{borderRight:'1px solid rgba(25,26,32,0.08)',display:'flex',alignItems:'center'}}>
                <Dropdown label="Budget"
                  options={BUDGET_OPTIONS.map(b => b.label)}
                  value={budget.label !== 'Any budget' ? budget.label : ''}
                  onChange={v => setBudget(BUDGET_OPTIONS.find(b => b.label === v) || BUDGET_OPTIONS[0])} />
              </div>

              {/* Search button */}
              <button type="submit"
                style={{padding:'0 28px',backgroundColor:'rgb(255,102,37)',border:'none',cursor:'pointer',fontFamily:'"Lexend",sans-serif',fontSize:14,fontWeight:600,color:'white',borderRadius:'0 0 0 0',flexShrink:0,minWidth:120,transition:'background-color 0.2s'}}
                onMouseEnter={e => e.currentTarget.style.backgroundColor='rgb(230,85,20)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor='rgb(255,102,37)'}>
                Search
              </button>
            </div>

            {/* More options toggle */}
            <div style={{borderTop:'1px solid rgba(25,26,32,0.08)',padding:'12px 16px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <button type="button" onClick={() => setShowMore(o => !o)}
                style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',fontFamily:'"Lexend",sans-serif',fontSize:13,color:'rgba(25,26,32,0.6)',padding:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {showMore ? 'Fewer options' : 'More options'}
              </button>

              {showMore && (
                <>
                  {/* Min bedrooms */}
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontFamily:'"Lexend",sans-serif',fontSize:13,color:'rgba(25,26,32,0.6)'}}>Bedrooms:</span>
                    <div style={{display:'flex',gap:4}}>
                      {bedroomNums.map(n => (
                        <button key={'min'+n} type="button"
                          onClick={() => setBedroomsMin(bedroomsMin === n ? '' : n)}
                          style={{width:32,height:28,border:'1px solid',borderColor:bedroomsMin===n?'rgb(255,102,37)':'rgba(25,26,32,0.15)',borderRadius:6,background:bedroomsMin===n?'rgba(255,102,37,0.08)':'none',cursor:'pointer',fontFamily:'"Lexend",sans-serif',fontSize:12,color:bedroomsMin===n?'rgb(255,102,37)':'rgb(25,26,32)'}}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

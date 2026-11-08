import React from 'react'
import { Link } from 'react-router-dom'

export default function AgentDetailPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24}}>
      <p style={{fontSize:72,opacity:0.15,fontFamily:'Bricolage Grotesque,sans-serif'}}>404</p>
      <p style={{opacity:0.5,fontFamily:'Lexend,sans-serif'}}>Agent not found</p>
      <Link to="../agent" style={{padding:'12px 24px',backgroundColor:'rgb(25,26,32)',color:'white',borderRadius:8,textDecoration:'none',fontSize:14,fontFamily:'Lexend,sans-serif'}}>Back to agents</Link>
    </div>
  )
}

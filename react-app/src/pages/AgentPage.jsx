import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import AgentSsrHidden19svg3c from '../components/AgentSsrHidden19svg3c.jsx'
import AgentSsrHidden1mb3ikt from '../components/AgentSsrHidden1mb3ikt.jsx'
import AgentMain from '../components/AgentMain.jsx'

export default function AgentPage() {
  useFramerAppear()
  return (
    <div className="framer-eLzCl framer-0RYty framer-YPkpu framer-2s1muu" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <AgentSsrHidden19svg3c />
      <AgentSsrHidden1mb3ikt />
      <AgentMain />
    </div>
  )
}

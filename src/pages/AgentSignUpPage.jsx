import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import SignUpPageDetails from '../components/SignUpPageDetails.jsx'

export default function AgentSignUpPage() {
  useFramerAppear()
  return (
    <div className="framer-Ivpik framer-0RYty framer-YPkpu framer-Xjiaj framer-152z66" style={{ minHeight: '100vh', width: 'auto' }}>
      <SvgSprites />
      <SignUpPageDetails portal="agent" />
    </div>
  )
}

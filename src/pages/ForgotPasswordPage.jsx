import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import ForgotPasswordPageDetails from '../components/ForgotPasswordPageDetails.jsx'

export default function ForgotPasswordPage() {
  useFramerAppear()
  return (
    <div className="framer-Q9aa5 framer-0RYty framer-ns4ohm" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <ForgotPasswordPageDetails />
    </div>
  )
}

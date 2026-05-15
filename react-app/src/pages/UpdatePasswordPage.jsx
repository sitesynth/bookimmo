import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import UpdatePasswordPageDetails from '../components/UpdatePasswordPageDetails.jsx'

export default function UpdatePasswordPage() {
  useFramerAppear()
  return (
    <div className="framer-w4q18 framer-0RYty framer-1m1ch5r" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <UpdatePasswordPageDetails />
    </div>
  )
}

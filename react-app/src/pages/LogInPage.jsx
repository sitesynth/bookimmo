import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import LogInPageDetails from '../components/LogInPageDetails.jsx'

export default function LogInPage() {
  useFramerAppear()
  return (
    <div className="framer-HdO7x framer-Sscx1 framer-77SxD framer-0RYty framer-YPkpu framer-Xjiaj framer-19mwsvy" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <LogInPageDetails />
    </div>
  )
}

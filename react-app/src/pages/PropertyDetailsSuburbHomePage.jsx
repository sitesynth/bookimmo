import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import PropertyDetailsSuburbHomeMain from '../components/PropertyDetailsSuburbHomeMain.jsx'

export default function PropertyDetailsSuburbHomePage() {
  useFramerAppear()
  return (
    <div className="framer-dgsvt framer-0RYty framer-YPkpu framer-z7jVh" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <PropertyDetailsSuburbHomeMain />
    </div>
  )
}

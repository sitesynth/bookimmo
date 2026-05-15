import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import _404_404Section from '../components/_404_404Section.jsx'

export default function _404Page() {
  useFramerAppear()
  return (
    <div className="framer-ZNiZn framer-LjwlF framer-YPkpu framer-1fubwms" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <_404_404Section />
    </div>
  )
}

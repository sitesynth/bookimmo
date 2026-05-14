import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import SearchSsrHidden1ox42mn from '../components/SearchSsrHidden1ox42mn.jsx'
import SearchMain from '../components/SearchMain.jsx'

export default function SearchPage() {
  useFramerAppear()
  return (
    <div className="framer-F8Qc9 framer-z7jVh framer-ksssmz" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <SearchSsrHidden1ox42mn />
      <SearchMain />
    </div>
  )
}

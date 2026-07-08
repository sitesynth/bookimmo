import React from 'react'
import SearchSsrHidden1ox42mn from '../components/SearchSsrHidden1ox42mn.jsx'
import SearchMain from '../components/SearchMain.jsx'
import SvgSprites from '../components/SvgSprites.jsx'
import { useFramerAppear } from '../hooks/useFramerAppear.js'

export default function SearchPage() {
  useFramerAppear()

  return (
    <div
      className="framer-F8Qc9 framer-ksssmz"
      style={{ minHeight: '100vh', width: 'auto' }}
    >
      <SvgSprites />
      <SearchSsrHidden1ox42mn />
      <div className="framer-1u9asl6">
        <div className="framer-14hieps">
          <SearchMain />
        </div>
      </div>
    </div>
  )
}

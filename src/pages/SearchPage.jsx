import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import AnnouncementBar from '../components/AnnouncementBar.jsx'
import Footer from '../components/Footer.jsx'
import Section0 from '../components/Section0.jsx'
import SvgSprites from '../components/SvgSprites.jsx'
import SearchMain from '../components/SearchMain.jsx'
import Variant1 from '../components/Variant1.jsx'

export default function SearchPage() {
  useFramerAppear()

  return (
    <div
      className="framer-v7ToU framer-uohivb"
      style={{ minHeight: '100vh', width: 'auto' }}
    >
      <AnnouncementBar />
      <SvgSprites />
      <Section0 />
      <div className="framer-ihu88y">
        <section className="framer-c20eij">
          <div className="framer-1icfqh" style={{ maxWidth: '1200px' }}>
            <SearchMain />
          </div>
        </section>
      </div>
      <Footer />
      <Variant1 />
    </div>
  )
}

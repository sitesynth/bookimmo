import React, { useState, useCallback } from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import AnnouncementBar from '../components/AnnouncementBar.jsx'
import Section0 from '../components/Section0.jsx'
import Hero from '../components/Hero.jsx'
import PROPERTIESINTHEAREA from '../components/PROPERTIESINTHEAREA.jsx'
import Explore from '../components/Explore.jsx'
import NewListing from '../components/NewListing.jsx'
import FeaturedProperties from '../components/FeaturedProperties.jsx'
import Pricing from '../components/Pricing.jsx'
import FAQ from '../components/FAQ.jsx'
import GETMORE from '../components/GETMORE.jsx'
import REALESTATEAGENT from '../components/REALESTATEAGENT.jsx'
import NEWSLETTER from '../components/NEWSLETTER.jsx'
import GETINTOUCH from '../components/GETINTOUCH.jsx'
import Footer from '../components/Footer.jsx'
import Variant1 from '../components/Variant1.jsx'
import AuthGateModal from '../components/AuthGateModal.jsx'

export default function HomePage() {
  useFramerAppear()
  const [gateOpen, setGateOpen]     = useState(false)
  const [guestHref, setGuestHref]   = useState('./search')

  // Intercept clicks on property cards inside New Listing / Featured Properties
  const handleClick = useCallback((e) => {
    const card = e.target.closest('div[tabindex="0"]')
    if (!card) return
    const inSection = card.closest('.framer-1bxsx5l, .framer-sc2163')
    if (!inSection) return
    e.preventDefault()
    const propLink = card.querySelector('a[href*="Property-Details"]')
    setGuestHref(propLink?.getAttribute('href') || './search')
    setGateOpen(true)
  }, [])

  return (
    <div
      className="framer-f8vvx framer-HOibb framer-77SxD framer-Sscx1 framer-YPkpu framer-43ZH4 framer-KnW9u framer-rEghC framer-72rtr7"
      style={{minHeight:'100vh',width:'auto'}}
      onClick={handleClick}
    >
      <AnnouncementBar />
      <SvgSprites />
      <Section0 />
      <Hero />
      <PROPERTIESINTHEAREA />
      <Explore />
      <NewListing />
      <FeaturedProperties />
      <Pricing />
      <FAQ />
      <GETMORE />
      <REALESTATEAGENT />
      <NEWSLETTER />
      <GETINTOUCH />
      <Footer />
      <Variant1 />

      {gateOpen && (
        <AuthGateModal
          guestHref={guestHref}
          onClose={() => setGateOpen(false)}
        />
      )}
    </div>
  )
}

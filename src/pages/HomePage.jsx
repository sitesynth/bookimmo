import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import Section0 from '../components/Section0.jsx'
import Hero from '../components/Hero.jsx'
import PROPERTIESINTHEAREA from '../components/PROPERTIESINTHEAREA.jsx'
import Explore from '../components/Explore.jsx'
import NewListing from '../components/NewListing.jsx'
import FeaturedProperties from '../components/FeaturedProperties.jsx'
import GETMORE from '../components/GETMORE.jsx'
import REALESTATEAGENT from '../components/REALESTATEAGENT.jsx'
import NEWSLETTER from '../components/NEWSLETTER.jsx'
import GETINTOUCH from '../components/GETINTOUCH.jsx'
import Footer from '../components/Footer.jsx'
import Variant1 from '../components/Variant1.jsx'

export default function HomePage() {
  useFramerAppear()
  return (
    <div className="framer-f8vvx framer-HOibb framer-77SxD framer-Sscx1 framer-YPkpu framer-43ZH4 framer-KnW9u framer-rEghC framer-72rtr7" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <Section0 />
      <Hero />
      <PROPERTIESINTHEAREA />
      <Explore />
      <NewListing />
      <FeaturedProperties />
      <GETMORE />
      <REALESTATEAGENT />
      <NEWSLETTER />
      <GETINTOUCH />
      <Footer />
      <Variant1 />
    </div>
  )
}

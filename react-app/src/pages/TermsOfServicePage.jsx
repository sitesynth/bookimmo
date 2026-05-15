import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import TermsOfServiceSection0 from '../components/TermsOfServiceSection0.jsx'
import TermsOfServiceHero from '../components/TermsOfServiceHero.jsx'
import TermsOfServiceFooter from '../components/TermsOfServiceFooter.jsx'
import TermsOfServiceVariant1 from '../components/TermsOfServiceVariant1.jsx'

export default function TermsOfServicePage() {
  useFramerAppear()
  return (
    <div className="framer-2CYZl framer-77SxD framer-Sscx1 framer-YPkpu framer-1z09nd8" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <TermsOfServiceSection0 />
      <TermsOfServiceHero />
      <TermsOfServiceFooter />
      <TermsOfServiceVariant1 />
    </div>
  )
}

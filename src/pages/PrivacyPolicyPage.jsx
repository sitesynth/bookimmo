import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import PrivacyPolicySection0 from '../components/PrivacyPolicySection0.jsx'
import PrivacyPolicyHero from '../components/PrivacyPolicyHero.jsx'
import PrivacyPolicyFooter from '../components/PrivacyPolicyFooter.jsx'
import PrivacyPolicyVariant1 from '../components/PrivacyPolicyVariant1.jsx'

export default function PrivacyPolicyPage() {
  useFramerAppear()
  return (
    <div className="framer-v7ToU framer-77SxD framer-Sscx1 framer-YPkpu framer-uohivb" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <PrivacyPolicySection0 />
      <PrivacyPolicyHero />
      <PrivacyPolicyFooter />
      <PrivacyPolicyVariant1 />
    </div>
  )
}

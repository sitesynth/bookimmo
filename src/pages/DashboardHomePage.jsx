import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import DashboardHomeSsrHidden1nymtbs from '../components/DashboardHomeSsrHidden1nymtbs.jsx'
import DashboardHomeSsrHidden1xpnfy7 from '../components/DashboardHomeSsrHidden1xpnfy7.jsx'
import DashboardHomeMain from '../components/DashboardHomeMain.jsx'

export default function DashboardHomePage() {
  useFramerAppear()
  return (
    <div className="framer-GxXJo framer-0RYty framer-z7jVh framer-1xpnfy7" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <DashboardHomeSsrHidden1nymtbs />
      <DashboardHomeSsrHidden1xpnfy7 />
      <DashboardHomeMain />
    </div>
  )
}

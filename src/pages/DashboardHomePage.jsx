import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardHomeMain from '../components/DashboardHomeMain.jsx'
import DashboardHomeSsrHidden1nymtbs from '../components/DashboardHomeSsrHidden1nymtbs.jsx'
import DashboardHomeSsrHidden1xpnfy7 from '../components/DashboardHomeSsrHidden1xpnfy7.jsx'
import SvgSprites from '../components/SvgSprites.jsx'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import { getPathLanguage, normalizeLanguage } from '../lib/language.js'

export default function DashboardHomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  useFramerAppear()

  useEffect(() => {
    const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
    const errorCode = hash.get('error_code') || hash.get('error')
    if (!errorCode) return

    const lang = normalizeLanguage(getPathLanguage(location.pathname), 'en')
    const errorDescription = hash.get('error_description') || 'This sign-in link is no longer valid.'
    navigate(`/${lang}/log-in?authError=${encodeURIComponent(errorDescription)}`, { replace: true })
  }, [location.pathname, navigate])

  return (
    <div
      className="framer-GxXJo framer-1xpnfy7"
      style={{ minHeight: '100vh', width: 'auto' }}
    >
      <SvgSprites />
      <DashboardHomeSsrHidden1nymtbs />
      <DashboardHomeSsrHidden1xpnfy7 />
      <DashboardHomeMain />
    </div>
  )
}

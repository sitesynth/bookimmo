import React, { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import CabinetLayout from '../components/cabinet/CabinetLayout.jsx'
import SearchMain from '../components/SearchMain.jsx'
import SvgSprites from '../components/SvgSprites.jsx'
import { useFramerAppear } from '../hooks/useFramerAppear.js'

const TITLES = {
  de: ['Wohnung finden', 'Suchen Sie nach Stadt, Stadtteil oder Straße und bewerben Sie sich mit einem Klick.'],
  en: ['Find a home', 'Search by city, district or street and apply in a click.'],
}

export default function SearchPage() {
  useFramerAppear()
  const { pathname } = useLocation()
  const lang = /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
  const [title, subtitle] = TITLES[lang] || TITLES.en

  useLayoutEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverflowY: html.style.overflowY,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyOverflowY: body.style.overflowY,
      bodyHeight: body.style.height,
      bodyMinHeight: body.style.minHeight,
      rootOverflow: root?.style.overflow || '',
      rootOverflowY: root?.style.overflowY || '',
      rootHeight: root?.style.height || '',
      rootMinHeight: root?.style.minHeight || '',
    }

    html.style.overflow = 'visible'
    html.style.overflowY = 'auto'
    html.style.height = 'auto'

    body.style.overflow = 'visible'
    body.style.overflowY = 'auto'
    body.style.height = 'auto'
    body.style.minHeight = '100vh'

    if (root) {
      root.style.overflow = 'visible'
      root.style.overflowY = 'visible'
      root.style.height = 'auto'
      root.style.minHeight = '100vh'
    }

    return () => {
      html.style.overflow = previous.htmlOverflow
      html.style.overflowY = previous.htmlOverflowY
      html.style.height = previous.htmlHeight

      body.style.overflow = previous.bodyOverflow
      body.style.overflowY = previous.bodyOverflowY
      body.style.height = previous.bodyHeight
      body.style.minHeight = previous.bodyMinHeight

      if (root) {
        root.style.overflow = previous.rootOverflow
        root.style.overflowY = previous.rootOverflowY
        root.style.height = previous.rootHeight
        root.style.minHeight = previous.rootMinHeight
      }
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', width: 'auto' }}>
      <SvgSprites />
      <CabinetLayout title={title} subtitle={subtitle}>
        <SearchMain />
      </CabinetLayout>
    </div>
  )
}

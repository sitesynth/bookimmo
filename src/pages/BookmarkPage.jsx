import React from 'react'
import { useLocation } from 'react-router-dom'
import SvgSprites from '../components/SvgSprites.jsx'
import CabinetLayout from '../components/cabinet/CabinetLayout.jsx'
import FavoritesShell from '../components/favorites/FavoritesShell.jsx'

const TITLES = {
  de: ['Favoriten', 'Die Wohnungen, die Sie sich merken wollen.'],
  en: ['Favorites', 'The homes you want to keep an eye on.'],
}

export default function BookmarkPage() {
  const { pathname } = useLocation()
  const lang = /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
  const [title, subtitle] = TITLES[lang] || TITLES.en
  return (
    <div style={{ minHeight: '100vh', width: 'auto' }}>
      <SvgSprites />
      <CabinetLayout
        title={title}
        subtitle={subtitle}
      >
        <FavoritesShell />
      </CabinetLayout>
    </div>
  )
}

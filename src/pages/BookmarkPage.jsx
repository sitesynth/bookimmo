import React from 'react'
import SvgSprites from '../components/SvgSprites.jsx'
import CabinetLayout from '../components/cabinet/CabinetLayout.jsx'
import FavoritesShell from '../components/favorites/FavoritesShell.jsx'

export default function BookmarkPage() {
  return (
    <div style={{ minHeight: '100vh', width: 'auto' }}>
      <SvgSprites />
      <CabinetLayout
        title="Favorites"
        subtitle="Use this space to collect the properties worth comparing, revisiting and applying to."
      >
        <FavoritesShell />
      </CabinetLayout>
    </div>
  )
}

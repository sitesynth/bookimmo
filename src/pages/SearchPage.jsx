import React from 'react'
import SvgSprites from '../components/SvgSprites.jsx'
import CabinetLayout from '../components/cabinet/CabinetLayout.jsx'
import SearchMain from '../components/SearchMain.jsx'

export default function SearchPage() {
  return (
    <div style={{ minHeight: '100vh', width: 'auto' }}>
      <SvgSprites />
      <CabinetLayout
        title="Search Workspace"
        subtitle="Browse Germany listings on a synchronized map and list, save search presets and move straight into favorites or application drafts."
      >
        <SearchMain />
      </CabinetLayout>
    </div>
  )
}

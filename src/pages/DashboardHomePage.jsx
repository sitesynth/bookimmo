import React from 'react'
import SvgSprites from '../components/SvgSprites.jsx'
import CabinetLayout from '../components/cabinet/CabinetLayout.jsx'
import DashboardOverview from '../components/dashboard/DashboardOverview.jsx'

export default function DashboardHomePage() {
  return (
    <div style={{ minHeight: '100vh', width: 'auto' }}>
      <SvgSprites />
      <CabinetLayout
        title="Dashboard"
        subtitle="A focused home base for profile progress, favorites, applications and next actions."
      >
        <DashboardOverview />
      </CabinetLayout>
    </div>
  )
}

import React from 'react'
import SvgSprites from '../components/SvgSprites.jsx'
import CabinetLayout from '../components/cabinet/CabinetLayout.jsx'
import ApplicationsShell from '../components/applications/ApplicationsShell.jsx'

export default function ApplicationsPage() {
  return (
    <div style={{ minHeight: '100vh', width: 'auto' }}>
      <SvgSprites />
      <CabinetLayout
        title="Applications"
        subtitle="Track application drafts, provider replies, agent activity and dossier readiness across your Bookimmo property flow."
      >
        <ApplicationsShell />
      </CabinetLayout>
    </div>
  )
}

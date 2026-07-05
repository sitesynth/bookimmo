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
        subtitle="Track rental request drafts, return to shortlisted properties and move your tenant profile toward submission."
      >
        <ApplicationsShell />
      </CabinetLayout>
    </div>
  )
}

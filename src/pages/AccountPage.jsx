import React from 'react'
import SvgSprites from '../components/SvgSprites.jsx'
import CabinetLayout from '../components/cabinet/CabinetLayout.jsx'
import ProfileShell from '../components/profile/ProfileShell.jsx'

export default function AccountPage() {
  return (
    <div style={{ minHeight: '100vh', width: 'auto' }}>
      <SvgSprites />
      <CabinetLayout
        title="Profile"
        subtitle="Build the renter profile that will power applications, saved searches and property matching."
      >
        <ProfileShell />
      </CabinetLayout>
    </div>
  )
}

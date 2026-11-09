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
        subtitle="The profile the club uses to apply for you."
      >
        <ProfileShell />
      </CabinetLayout>
    </div>
  )
}

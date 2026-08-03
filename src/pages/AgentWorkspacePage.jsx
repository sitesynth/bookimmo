import React from 'react'
import AgentLayout from '../components/agent/AgentLayout.jsx'
import AgentWorkspaceShell from '../components/agent/AgentWorkspaceShell.jsx'

export default function AgentWorkspacePage() {
  return (
    <AgentLayout
      title="Agent execution workspace"
      subtitle="Route client-approved applications into the correct execution lane, monitor IS24 thread sync and keep each city coverage queue moving without leaving Bookimmo."
    >
      <AgentWorkspaceShell />
    </AgentLayout>
  )
}

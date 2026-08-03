import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApplications } from '../../hooks/useApplications.js'
import { useApplicationThread } from '../../hooks/useApplicationThread.js'
import { usePropertiesByIds } from '../../hooks/usePropertiesByIds.js'
import { useProfile } from '../../hooks/useProfile.js'
import { buildListingDetailHref } from '../../lib/listingRouting.js'

const STOCK_IMGS = [
  '/assets/images/YB8HvCRaMzDFv3gr1oraLARMV10.jpg',
  '/assets/images/uJIxALexex0qutxW0BGT1e8RZU.jpg',
  '/assets/images/6tsHyqe0lsOpKgANd4B3r8lEwak.jpg',
  '/assets/images/gRIsS7b7H7QhFCmWRl88B6uVZMQ.jpg',
  '/assets/images/bmKq0zjCmV9aMdk4qbciIhZPU.jpg',
]

const INPUT = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid rgba(25,26,32,0.12)',
  backgroundColor: 'white',
  fontFamily: '"Lexend", sans-serif',
  fontSize: 14,
  color: 'rgb(25,26,32)',
  outline: 'none',
}

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

function propertyImage(property, index) {
  return property?.imageUrl
    ? property.imageUrl
    : STOCK_IMGS[index % STOCK_IMGS.length]
}

function formatStatus(status) {
  if (!status) return 'Draft'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatStage(stage) {
  if (!stage) return 'Draft'
  return String(stage)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function stageTone(stage) {
  switch (stage) {
    case 'reply_received':
    case 'viewing_requested':
    case 'viewing_confirmed':
    case 'documents_requested':
      return { background: 'rgba(255,184,0,0.14)', color: 'rgb(25,26,32)' }
    case 'accepted':
      return { background: 'rgba(39,174,96,0.12)', color: '#1f7a44' }
    case 'rejected':
      return { background: 'rgba(214,83,79,0.12)', color: '#b23d37' }
    default:
      return { background: 'rgba(25,26,32,0.08)', color: 'rgb(25,26,32)' }
  }
}

function StepPill({ active, done, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '1px solid rgb(25,26,32)' : '1px solid rgba(25,26,32,0.08)',
        borderRadius: 999,
        padding: '10px 14px',
        backgroundColor: active ? 'rgb(25,26,32)' : done ? 'rgba(255,184,0,0.14)' : 'white',
        color: active ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
        fontFamily: '"Lexend", sans-serif',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function StatusBadge({ stage }) {
  const tone = stageTone(stage)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '7px 10px',
        backgroundColor: tone.background,
        color: tone.color,
        fontFamily: '"Lexend", sans-serif',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {formatStage(stage)}
    </span>
  )
}

function UnreadPill({ count }) {
  if (!count) return null
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 24,
        height: 24,
        padding: '0 8px',
        borderRadius: 999,
        backgroundColor: 'rgb(25,26,32)',
        color: 'rgb(245,245,245)',
        fontFamily: '"Lexend", sans-serif',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {count}
    </span>
  )
}

function ThreadMetaCard({ label, value, accent = 'rgb(248,246,241)' }) {
  return (
    <div style={{ padding: 16, borderRadius: 18, backgroundColor: accent, border: '1px solid rgba(25,26,32,0.06)' }}>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 600, color: 'rgb(25,26,32)', marginTop: 8, lineHeight: 1.5 }}>{value || '—'}</p>
    </div>
  )
}

function MessageCard({ message }) {
  const inbound = message.direction === 'inbound'
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: inbound ? 'rgb(248,246,241)' : 'rgba(25,26,32,0.04)',
        border: `1px solid ${inbound ? 'rgba(25,26,32,0.08)' : 'rgba(25,26,32,0.06)'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 700, color: 'rgb(25,26,32)' }}>
            {message.senderName || (inbound ? 'Provider' : 'Bookimmo agent')}
          </p>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.54)', marginTop: 4 }}>
            {inbound ? 'Inbound' : 'Outbound'} · {formatDateTime(message.messageTimestamp)}
          </p>
        </div>
        {message.isUnreadForClient && inbound ? <UnreadPill count={1} /> : null}
      </div>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.7, color: 'rgba(25,26,32,0.76)', marginTop: 12, whiteSpace: 'pre-wrap' }}>
        {message.bodyText || 'No message text.'}
      </p>
      {message.attachments?.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {message.attachments.map((attachment, index) => (
            <span
              key={`${attachment.name || attachment.url || index}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 999,
                padding: '8px 10px',
                backgroundColor: 'white',
                border: '1px solid rgba(25,26,32,0.08)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 12,
                color: 'rgb(25,26,32)',
              }}
            >
              {attachment.name || attachment.url || `Attachment ${index + 1}`}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function EventRow({ event }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
      <p style={{ fontFamily: '"Fragment Mono", monospace', fontSize: 11, color: 'rgba(25,26,32,0.5)', marginTop: 2 }}>
        {formatDateTime(event.occurredAt)}
      </p>
      <div style={{ padding: 14, borderRadius: 16, border: '1px solid rgba(25,26,32,0.08)', backgroundColor: 'white' }}>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 700, color: 'rgb(25,26,32)' }}>
          {event.title || formatStage(event.eventType)}
        </p>
        {event.body ? (
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.6, color: 'rgba(25,26,32,0.68)', marginTop: 8 }}>
            {event.body}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function MagicWandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M4 20L14.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 4L13.8 6.2L16 7L13.8 7.8L13 10L12.2 7.8L10 7L12.2 6.2L13 4Z" fill="currentColor" />
      <path d="M18 11L18.5 12.5L20 13L18.5 13.5L18 15L17.5 13.5L16 13L17.5 12.5L18 11Z" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function ApplicationsShell() {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const query = new URLSearchParams(location.search)
  const {
    applications,
    applicationCount,
    draftCount,
    submittedCount,
    loading,
    saving,
    updateApplication,
  } = useApplications()
  const { properties, loading: propertiesLoading } = usePropertiesByIds(applications.map((item) => item.propertyId))
  const { profile, completionPercent, documentStats } = useProfile()
  const [selectedId, setSelectedId] = useState(query.get('application') || '')
  const [currentStep, setCurrentStep] = useState('profile')
  const [threadTab, setThreadTab] = useState('messages')
  const [notice, setNotice] = useState('')
  const [coverDraft, setCoverDraft] = useState('')
  const [generatingLetter, setGeneratingLetter] = useState(false)

  useEffect(() => {
    const paramId = query.get('application')
    if (paramId) {
      setSelectedId(paramId)
      return
    }
    if (!selectedId && applications[0]?.id) {
      setSelectedId(String(applications[0].id))
    }
  }, [applications, query, selectedId])

  const propertiesById = new Map(properties.map((property) => [String(property.id), property]))
  const selectedApplication = applications.find((item) => String(item.id) === String(selectedId)) || applications[0] || null
  const selectedProperty = selectedApplication ? propertiesById.get(String(selectedApplication.propertyId)) : null
  const { thread, loading: threadLoading, syncing: threadSyncing, error: threadError } = useApplicationThread(selectedApplication)

  useEffect(() => {
    if (!selectedApplication) return
    setCoverDraft(selectedApplication.coverMessage || profile.coverLetterTemplate || '')
  }, [profile.coverLetterTemplate, selectedApplication])

  const stepState = useMemo(() => {
    const profileDone = completionPercent >= 60
    const docsDone = documentStats.readyCount >= 3
    const coverDone = Boolean(selectedApplication?.coverMessage?.trim())
    const reviewDone = profileDone && coverDone && docsDone
    return { profileDone, coverDone, docsDone, reviewDone }
  }, [completionPercent, documentStats.readyCount, selectedApplication])

  const activeApplication = thread.application
    ? {
        ...selectedApplication,
        status: thread.application.status || selectedApplication?.status,
        stage: thread.application.stage || selectedApplication?.stage,
        lastMessageAt: thread.application.last_message_at || selectedApplication?.lastMessageAt,
        lastMessagePreview: thread.application.last_message_preview || selectedApplication?.lastMessagePreview,
        unreadCount: Number(thread.application.unread_count || selectedApplication?.unreadCount || 0),
        providerConversationId: thread.application.provider_conversation_id || selectedApplication?.providerConversationId,
        providerExposeId: thread.application.provider_expose_id || selectedApplication?.providerExposeId,
      }
    : selectedApplication

  async function saveCoverMessage(value) {
    if (!selectedApplication) return
    const result = await updateApplication(selectedApplication.id, { coverMessage: value })
    if (result.ok) setNotice('Application letter saved.')
  }

  async function generateCoverLetter() {
    if (!selectedApplication) return
    setGeneratingLetter(true)
    setNotice('')
    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: profile.preferredLanguage || lang,
          property: selectedProperty || { id: selectedApplication.propertyId, title: selectedApplication.title },
          profile,
          application: selectedApplication,
        }),
      })
      const json = await response.json()
      const text = json?.text || ''
      if (!text.trim()) {
        setNotice('Could not generate a cover letter.')
        setGeneratingLetter(false)
        return
      }
      setCoverDraft(text)
      await saveCoverMessage(text)
      setNotice(json?.fallback ? 'Cover letter generated from the language-aware fallback template.' : `Cover letter generated in ${profile.preferredLanguage || lang}.`)
    } catch {
      setNotice('Could not generate a cover letter.')
    }
    setGeneratingLetter(false)
  }

  async function submitApplication() {
    if (!selectedApplication) return
    const result = await updateApplication(selectedApplication.id, { status: 'submitted' })
    if (result.ok) setNotice('Application marked as submitted.')
  }

  if (!applications.length && !loading) {
    return (
      <section style={{ padding: 28, borderRadius: 28, backgroundColor: 'white', border: '1px solid rgba(25,26,32,0.08)', boxShadow: '0 18px 48px rgba(25,26,32,0.06)' }}>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applications</p>
        <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 30, color: 'rgb(25,26,32)', marginTop: 8 }}>No application drafts yet</h2>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 12, maxWidth: 760 }}>
          Start from search, click Apply on a listing and this page becomes the case file for status, messages, timeline, cover letter and documents.
        </p>
        <Link to={`/${lang}/search`} style={{ display: 'inline-flex', marginTop: 18, textDecoration: 'none', borderRadius: 14, padding: '11px 14px', backgroundColor: 'rgb(25,26,32)', color: 'rgb(245,245,245)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600 }}>
          Browse properties
        </Link>
      </section>
    )
  }

  return (
    <>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total', value: applicationCount, hint: 'All tracked applications and drafts.' },
          { label: 'Drafts', value: draftCount, hint: 'Applications still being prepared.' },
          { label: 'Submitted', value: submittedCount, hint: 'Drafts already marked as sent.' },
        ].map((item) => (
          <div key={item.label} style={{ padding: 22, borderRadius: 24, backgroundColor: 'white', border: '1px solid rgba(25,26,32,0.08)', boxShadow: '0 18px 48px rgba(25,26,32,0.06)' }}>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 34, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 8 }}>{item.value}</p>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)', marginTop: 10 }}>{item.hint}</p>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <div style={{ padding: 22, borderRadius: 24, backgroundColor: 'white', border: '1px solid rgba(25,26,32,0.08)', boxShadow: '0 18px 48px rgba(25,26,32,0.06)' }}>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Draft list</p>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {applications.map((application) => {
              const property = propertiesById.get(String(application.propertyId))
              return (
                <button
                  type="button"
                  key={application.id}
                  onClick={() => setSelectedId(String(application.id))}
                  style={{
                    textAlign: 'left',
                    padding: 14,
                    borderRadius: 18,
                    border: String(application.id) === String(selectedApplication?.id) ? '1px solid rgb(25,26,32)' : '1px solid rgba(25,26,32,0.08)',
                    backgroundColor: String(application.id) === String(selectedApplication?.id) ? 'rgb(248,246,241)' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, fontWeight: 600, color: 'rgb(25,26,32)', flex: 1 }}>
                      {property?.title || application.title || `Property #${application.propertyId}`}
                    </p>
                    <UnreadPill count={Number(application.unreadCount || 0)} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                    <StatusBadge stage={application.stage || application.status} />
                    <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.54)' }}>
                      {application.lastMessageAt ? `Last activity ${new Date(application.lastMessageAt).toLocaleDateString()}` : formatStatus(application.status)}
                    </span>
                  </div>
                  {application.lastMessagePreview ? (
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.6)', lineHeight: 1.5, marginTop: 8 }}>
                      {application.lastMessagePreview}
                    </p>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        {loading || propertiesLoading || !selectedApplication ? (
          <section style={{ padding: 24, borderRadius: 24, backgroundColor: 'white', border: '1px solid rgba(25,26,32,0.08)' }}>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.64)' }}>Loading selected application…</p>
          </section>
        ) : (
          <section style={{ padding: 24, borderRadius: 24, backgroundColor: 'white', border: '1px solid rgba(25,26,32,0.08)', boxShadow: '0 18px 48px rgba(25,26,32,0.06)' }}>
            <article style={{ display: 'flex', flexWrap: 'wrap', gap: 18, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgb(248,246,241)', border: '1px solid rgba(25,26,32,0.06)' }}>
              <div style={{ position: 'relative', minHeight: 220, flex: '0 0 260px', minWidth: 220 }}>
                <img src={propertyImage(selectedProperty, 0)} alt={selectedProperty?.title || selectedApplication.title || 'Property'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: '1 1 320px', minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusBadge stage={activeApplication?.stage || activeApplication?.status} />
                  <UnreadPill count={Number(activeApplication?.unreadCount || 0)} />
                  <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.54)' }}>
                    Updated {new Date(activeApplication?.updatedAt || activeApplication?.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                  {threadSyncing ? <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.54)' }}>Syncing IS24 thread…</span> : null}
                </div>

                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 24, fontWeight: 700, color: 'rgb(25,26,32)' }}>
                    {selectedProperty?.title || selectedApplication.title || `Property #${selectedApplication.propertyId}`}
                  </p>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.56)', marginTop: 8 }}>
                    {selectedProperty?.address || selectedProperty?.district || selectedProperty?.postcode || 'Listing details are still loading'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.72)' }}>
                  <span>{selectedProperty?.listingType || selectedProperty?.source?.toUpperCase() || 'Property'}</span>
                  <span>{selectedProperty?.roomsLabel || (selectedProperty?.rooms ? `${selectedProperty.rooms} rooms` : 'Rooms on request')}</span>
                  <span>{selectedProperty?.priceLabel || (selectedProperty?.price ? `€ ${Number(selectedProperty.price).toLocaleString()}` : 'Price on request')}</span>
                </div>
              </div>
            </article>

            <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <ThreadMetaCard label="Stage" value={formatStage(activeApplication?.stage || activeApplication?.status)} />
              <ThreadMetaCard label="Last activity" value={formatDateTime(activeApplication?.lastMessageAt)} />
              <ThreadMetaCard label="Counterparty" value={thread.providerThread?.counterpartyName || 'Not linked yet'} />
              <ThreadMetaCard label="Conversation" value={thread.providerThread?.providerConversationId || activeApplication?.providerConversationId || 'Not linked yet'} />
            </div>

            <div style={{ marginTop: 22, padding: 18, borderRadius: 20, border: '1px solid rgba(25,26,32,0.08)', backgroundColor: 'rgb(248,246,241)' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Provider sync</p>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.72)', marginTop: 6 }}>
                    {thread.providerThread?.providerSource ? `Linked to ${thread.providerThread.providerSource.toUpperCase()} thread` : 'Waiting for live thread link from the agent runtime.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeApplication?.providerExposeId ? (
                    <span style={{ display: 'inline-flex', borderRadius: 999, padding: '8px 10px', backgroundColor: 'white', border: '1px solid rgba(25,26,32,0.08)', fontFamily: '"Fragment Mono", monospace', fontSize: 11, color: 'rgba(25,26,32,0.78)' }}>
                      expose {activeApplication.providerExposeId}
                    </span>
                  ) : null}
                  {thread.providerThread?.providerConversationId ? (
                    <span style={{ display: 'inline-flex', borderRadius: 999, padding: '8px 10px', backgroundColor: 'white', border: '1px solid rgba(25,26,32,0.08)', fontFamily: '"Fragment Mono", monospace', fontSize: 11, color: 'rgba(25,26,32,0.78)' }}>
                      thread {thread.providerThread.providerConversationId.slice(0, 8)}…
                    </span>
                  ) : null}
                </div>
              </div>
              {thread.providerThread?.providerListingAddress ? (
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.64)', marginTop: 10 }}>
                  {thread.providerThread.providerListingAddress}
                </p>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
              <StepPill active={currentStep === 'profile'} done={stepState.profileDone} onClick={() => setCurrentStep('profile')}>1. Profile</StepPill>
              <StepPill active={currentStep === 'documents'} done={stepState.docsDone} onClick={() => setCurrentStep('documents')}>2. Documents</StepPill>
              <StepPill active={currentStep === 'letter'} done={stepState.coverDone} onClick={() => setCurrentStep('letter')}>3. Cover letter</StepPill>
              <StepPill active={currentStep === 'review'} done={stepState.reviewDone} onClick={() => setCurrentStep('review')}>4. Review</StepPill>
            </div>

            <div style={{ marginTop: 20 }}>
              {currentStep === 'profile' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 16, color: 'rgb(25,26,32)' }}>Profile readiness: <strong>{completionPercent}%</strong></p>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.6, color: 'rgba(25,26,32,0.68)' }}>
                    Your applicant dossier comes from the profile page. Before sending this application, make sure your household details, employment and contact information are complete.
                  </p>
                  <Link to={`/${lang}/account`} style={{ display: 'inline-flex', textDecoration: 'none', borderRadius: 14, padding: '11px 14px', backgroundColor: 'rgb(25,26,32)', color: 'rgb(245,245,245)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, width: 'fit-content' }}>
                    Open dossier
                  </Link>
                </div>
              ) : null}

              {currentStep === 'documents' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.6, color: 'rgba(25,26,32,0.68)' }}>
                    This application reuses the document package from your profile. Finish this step first so the final cover letter can reflect the full trust package.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    {documentStats.requiredCategories.map((item) => (
                      <div key={item} style={{ padding: 16, borderRadius: 18, backgroundColor: documentStats.missingCategories.includes(item) ? 'rgba(255,184,0,0.12)' : 'rgba(39,174,96,0.08)', border: '1px solid rgba(25,26,32,0.06)' }}>
                        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 600, color: 'rgb(25,26,32)', textTransform: 'capitalize' }}>{item.replace('_', ' ')}</p>
                        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.58)', marginTop: 8 }}>
                          {documentStats.missingCategories.includes(item) ? 'Missing' : 'Ready'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Link to={`/${lang}/account`} style={{ display: 'inline-flex', textDecoration: 'none', borderRadius: 14, padding: '11px 14px', border: '1px solid rgba(25,26,32,0.12)', color: 'rgb(25,26,32)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, width: 'fit-content' }}>
                    Manage documents
                  </Link>
                </div>
              ) : null}

              {currentStep === 'letter' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 18, borderRadius: 18, backgroundColor: 'rgb(248,246,241)', border: '1px solid rgba(25,26,32,0.06)' }}>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, fontWeight: 600, color: 'rgb(25,26,32)' }}>Final application letter</p>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.6, color: 'rgba(25,26,32,0.68)', marginTop: 8 }}>
                      The AI uses the property, your filled profile, household details, income data, preferred language and uploaded document context to draft a tailored message.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={generateCoverLetter}
                      disabled={generatingLetter}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 14, padding: '11px 14px', backgroundColor: 'rgb(25,26,32)', color: 'rgb(245,245,245)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, cursor: generatingLetter ? 'default' : 'pointer', opacity: generatingLetter ? 0.7 : 1 }}
                    >
                      <MagicWandIcon />
                      <span>{generatingLetter ? 'Generating…' : `Generate with AI (${profile.preferredLanguage || lang})`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverDraft(profile.coverLetterTemplate || '')}
                      style={{ border: '1px solid rgba(25,26,32,0.12)', borderRadius: 14, padding: '11px 14px', backgroundColor: 'white', color: 'rgb(25,26,32)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Use profile base
                    </button>
                  </div>
                  <textarea value={coverDraft} onChange={(e) => setCoverDraft(e.target.value)} onBlur={(e) => saveCoverMessage(e.target.value)} style={{ ...INPUT, minHeight: 220, resize: 'vertical' }} placeholder="Hello, we are very interested in this property..." />
                </div>
              ) : null}

              {currentStep === 'review' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 18, borderRadius: 18, backgroundColor: stepState.reviewDone ? 'rgba(39,174,96,0.08)' : 'rgba(255,184,0,0.12)', border: '1px solid rgba(25,26,32,0.06)' }}>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, fontWeight: 600, color: 'rgb(25,26,32)' }}>
                      {stepState.reviewDone ? 'Ready to submit' : 'Still missing parts of the package'}
                    </p>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.6, color: 'rgba(25,26,32,0.68)', marginTop: 8 }}>
                      Profile readiness: {stepState.profileDone ? 'ok' : 'needs work'}. Cover letter: {stepState.coverDone ? 'ok' : 'missing'}. Documents: {stepState.docsDone ? 'ok' : 'not enough core docs'}.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={submitApplication}
                      disabled={saving || !stepState.reviewDone}
                      style={{ border: 'none', borderRadius: 14, padding: '12px 16px', backgroundColor: 'rgb(25,26,32)', color: 'rgb(245,245,245)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600, cursor: saving || !stepState.reviewDone ? 'default' : 'pointer', opacity: saving || !stepState.reviewDone ? 0.65 : 1 }}
                    >
                      {saving ? 'Saving…' : selectedApplication.status === 'submitted' ? 'Submitted' : 'Mark as submitted'}
                    </button>
                    <Link to={selectedProperty ? buildListingDetailHref(lang, selectedProperty) : `/${lang}/search`} style={{ display: 'inline-flex', textDecoration: 'none', borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(25,26,32,0.12)', color: 'rgb(25,26,32)', fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 600 }}>
                      Open listing
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {notice ? (
              <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 14, backgroundColor: 'rgba(39,174,96,0.08)', color: '#1f7a44', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
                {notice}
              </div>
            ) : null}

            <div style={{ marginTop: 22, padding: 20, borderRadius: 24, backgroundColor: 'white', border: '1px solid rgba(25,26,32,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Application activity</p>
                  <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 24, color: 'rgb(25,26,32)', marginTop: 8 }}>History and messaging</h3>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <StepPill active={threadTab === 'messages'} done={Boolean(thread.messages.length)} onClick={() => setThreadTab('messages')}>
                    Messages {thread.messages.length ? `(${thread.messages.length})` : ''}
                  </StepPill>
                  <StepPill active={threadTab === 'timeline'} done={Boolean(thread.events.length)} onClick={() => setThreadTab('timeline')}>
                    Timeline {thread.events.length ? `(${thread.events.length})` : ''}
                  </StepPill>
                </div>
              </div>

              {threadError ? (
                <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, backgroundColor: 'rgba(214,83,79,0.08)', color: '#b23d37', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
                  {threadError}
                </div>
              ) : null}

              {threadLoading ? (
                <div style={{ marginTop: 18, padding: 18, borderRadius: 18, backgroundColor: 'rgb(248,246,241)' }}>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.64)' }}>Loading live application activity…</p>
                </div>
              ) : null}

              {!threadLoading && threadTab === 'messages' ? (
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {thread.messages.length ? thread.messages.map((message) => (
                    <MessageCard key={message.id} message={message} />
                  )) : (
                    <div style={{ padding: 18, borderRadius: 18, backgroundColor: 'rgb(248,246,241)' }}>
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.64)' }}>
                        No normalized provider messages yet. As soon as the IS24 sync sees replies, they will appear here.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}

              {!threadLoading && threadTab === 'timeline' ? (
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {thread.events.length ? thread.events.map((event) => (
                    <EventRow key={event.id} event={event} />
                  )) : (
                    <div style={{ padding: 18, borderRadius: 18, backgroundColor: 'rgb(248,246,241)' }}>
                      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.64)' }}>
                        No application timeline events yet. Contact-sent and reply-received events will show up here.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        )}
      </section>
    </>
  )
}

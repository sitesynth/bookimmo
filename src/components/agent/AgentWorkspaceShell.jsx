import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAgentWorkspace } from '../../hooks/useAgentWorkspace.js'
import { useAgentApplicationThread } from '../../hooks/useAgentApplicationThread.js'
import { buildListingDetailHref } from '../../lib/listingRouting.js'

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function formatStage(stage) {
  if (!stage) return 'Draft'
  return String(stage)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function stageTone(stage) {
  switch (stage) {
    case 'reply_received':
    case 'viewing_requested':
    case 'documents_requested':
      return { bg: 'rgba(255,184,0,0.16)', color: 'rgb(25,26,32)' }
    case 'viewing_confirmed':
    case 'accepted':
      return { bg: 'rgba(39,174,96,0.14)', color: '#1f7a44' }
    case 'rejected':
      return { bg: 'rgba(214,83,79,0.14)', color: '#b23d37' }
    default:
      return { bg: 'rgba(25,26,32,0.08)', color: 'rgb(25,26,32)' }
  }
}

function MetricCard({ label, value, hint, dark = false }) {
  return (
    <div style={{
      padding: 20,
      borderRadius: 24,
      background: dark ? 'rgb(25,26,32)' : 'rgba(255,255,255,0.78)',
      color: dark ? 'rgb(245,245,245)' : 'rgb(25,26,32)',
      border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(25,26,32,0.06)',
    }}>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: dark ? 'rgba(245,245,245,0.72)' : 'rgba(25,26,32,0.5)' }}>{label}</p>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 42, lineHeight: 1, fontWeight: 700, marginTop: 18 }}>{value}</p>
      {hint ? (
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.55, color: dark ? 'rgba(245,245,245,0.68)' : 'rgba(25,26,32,0.62)', marginTop: 14 }}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function MessageCard({ item }) {
  const inbound = item.direction === 'inbound'
  return (
    <div style={{
      padding: 16,
      borderRadius: 18,
      backgroundColor: inbound ? 'rgb(248,246,241)' : 'rgba(25,26,32,0.04)',
      border: '1px solid rgba(25,26,32,0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 700, color: 'rgb(25,26,32)' }}>
            {item.senderName || (inbound ? 'Listing side' : 'Bookimmo agent')}
          </p>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)', marginTop: 4 }}>
            {inbound ? 'Inbound' : 'Outbound'} · {formatDateTime(item.messageTimestamp)}
          </p>
        </div>
        {item.isUnreadForClient ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 24,
            height: 24,
            borderRadius: 999,
            backgroundColor: 'rgb(25,26,32)',
            color: 'rgb(245,245,245)',
            fontFamily: '"Lexend", sans-serif',
            fontSize: 12,
            fontWeight: 700,
            padding: '0 8px',
          }}>
            new
          </span>
        ) : null}
      </div>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.7, color: 'rgba(25,26,32,0.74)', marginTop: 12, whiteSpace: 'pre-wrap' }}>
        {item.bodyText || 'No message text.'}
      </p>
    </div>
  )
}

function EventCard({ item }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 18,
      backgroundColor: 'white',
      border: '1px solid rgba(25,26,32,0.08)',
    }}>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, fontWeight: 700, color: 'rgb(25,26,32)' }}>
        {item.title || formatStage(item.eventType)}
      </p>
      {item.body ? (
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 8 }}>
          {item.body}
        </p>
      ) : null}
      <p style={{ fontFamily: '"Fragment Mono", monospace', fontSize: 11, color: 'rgba(25,26,32,0.46)', marginTop: 12 }}>
        {formatDateTime(item.occurredAt)}
      </p>
    </div>
  )
}

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

export default function AgentWorkspaceShell() {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const query = new URLSearchParams(location.search)
  const view = query.get('view') || 'desk'

  const [filters, setFilters] = useState({
    stage: '',
    providerSource: '',
    city: '',
    search: '',
  })
  const [selectedId, setSelectedId] = useState('')
  const [agentNote, setAgentNote] = useState('')
  const [statusNotice, setStatusNotice] = useState('')

  const { agent, applications, loading, saving, error, updateApplication, summary } = useAgentWorkspace(filters)
  const { thread, loading: threadLoading, error: threadError } = useAgentApplicationThread(selectedId)

  useEffect(() => {
    if (!selectedId && applications[0]?.id) {
      setSelectedId(String(applications[0].id))
    }
    if (selectedId && !applications.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(applications[0]?.id ? String(applications[0].id) : '')
    }
  }, [applications, selectedId])

  const selected = applications.find((item) => String(item.id) === String(selectedId)) || applications[0] || null
  const activeApplication = thread.application || selected

  const stageOptions = useMemo(() => ([
    ['', 'All stages'],
    ['draft', 'Draft'],
    ['queued_for_agent', 'Queued'],
    ['waiting_for_reply', 'Waiting'],
    ['reply_received', 'Reply received'],
    ['viewing_requested', 'Viewing requested'],
    ['documents_requested', 'Docs requested'],
    ['viewing_confirmed', 'Viewing confirmed'],
    ['accepted', 'Accepted'],
    ['rejected', 'Rejected'],
  ]), [])

  async function applyStage(stage) {
    if (!selected) return
    const result = await updateApplication(selected.id, { stage })
    if (result.ok) setStatusNotice(`Stage updated to ${formatStage(stage)}.`)
  }

  async function saveAgentNote() {
    if (!selected || !agentNote.trim()) return
    const result = await updateApplication(selected.id, { agentNote })
    if (result.ok) {
      setStatusNotice('Agent note saved to timeline.')
      setAgentNote('')
    }
  }

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <MetricCard
        label="Coverage"
        value={agent?.coverage?.length || 0}
        hint="Cities and districts currently mapped to this agent."
      />
      <MetricCard
        label="Provider accounts"
        value={agent?.providerAccounts?.length || 0}
        hint="IS24 and CRM execution lanes available in this workspace."
      />
      <section style={{
        padding: 22,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.82)',
        border: '1px solid rgba(25,26,32,0.06)',
      }}>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(25,26,32,0.5)' }}>
          Accounts
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {(agent?.providerAccounts || []).map((account) => (
            <div key={account.id} style={{ padding: 14, borderRadius: 16, backgroundColor: 'rgb(248,246,241)', border: '1px solid rgba(25,26,32,0.06)' }}>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, fontWeight: 700, color: 'rgb(25,26,32)' }}>
                {account.account_label}
              </p>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.56)', marginTop: 4 }}>
                {String(account.provider_source || '').toUpperCase()} · {account.session_state} · {account.health_status}
              </p>
            </div>
          ))}
          {!agent?.providerAccounts?.length ? (
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.6, color: 'rgba(25,26,32,0.62)' }}>
              No provider accounts are linked to this agent yet.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )

  return (
    <>
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 16,
      }}>
        <MetricCard label="Assigned applications" value={summary.total} hint="Current queue for this agent." />
        <MetricCard label="Needs attention" value={summary.attention} hint="Replies, viewings and document requests." />
        <MetricCard label="IS24 flow" value={summary.is24} hint="Applications routed to browser automation." />
        <MetricCard label="CRM flow" value={summary.crm} hint="Applications that can stay inside agency CRM." dark />
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: 20,
        alignItems: 'start',
      }}>
        <div style={{
          padding: 24,
          borderRadius: 28,
          backgroundColor: 'white',
          border: '1px solid rgba(25,26,32,0.08)',
        }}>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(25,26,32,0.48)' }}>
            Coverage routing
          </p>
          <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 28, lineHeight: 1.08, color: 'rgb(25,26,32)', marginTop: 10 }}>
            {agent?.displayName || 'Assigned agent'}
          </h3>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 12 }}>
            Base city: {agent?.baseCity || 'Not set yet'} · Capacity {agent?.capacityLimit || '—'} · {applications.length} applications currently visible in queue.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            {(agent?.coverage || []).map((coverage) => (
              <span
                key={coverage.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 999,
                  padding: '10px 14px',
                  backgroundColor: 'rgb(248,246,241)',
                  border: '1px solid rgba(25,26,32,0.08)',
                  fontFamily: '"Lexend", sans-serif',
                  fontSize: 13,
                  color: 'rgb(25,26,32)',
                }}
              >
                {coverage.city_slug}{coverage.district_slug ? ` · ${coverage.district_slug}` : ''}
              </span>
            ))}
            {!agent?.coverage?.length ? (
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)' }}>
                No city coverage rules have been configured yet.
              </p>
            ) : null}
          </div>
        </div>

        {aside}
      </section>

      <section style={{
        padding: 24,
        borderRadius: 28,
        backgroundColor: 'rgba(255,250,242,0.92)',
        border: '1px solid rgba(25,26,32,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(25,26,32,0.48)' }}>
              Agent queue
            </p>
            <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 40, lineHeight: 1.05, color: 'rgb(25,26,32)', marginTop: 10 }}>
              {view === 'accounts' ? 'Provider account fleet' : view === 'inbox' ? 'Messaging inbox' : 'Assigned applications'}
            </h2>
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 12, maxWidth: 760 }}>
              Agent assignments are routed by city coverage, then executed either through IS24 browser automation or directly into the agency CRM lane.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={filters.stage} onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value }))} style={INPUT}>
              {stageOptions.map(([value, label]) => <option key={value || 'all'} value={value}>{label}</option>)}
            </select>
            <select value={filters.providerSource} onChange={(event) => setFilters((current) => ({ ...current, providerSource: event.target.value }))} style={INPUT}>
              <option value="">All sources</option>
              <option value="is24">IS24</option>
              <option value="immowelt">Immowelt</option>
              <option value="agency_crm">Agency CRM</option>
            </select>
            <input value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))} placeholder="City or district" style={INPUT} />
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Client or listing search" style={INPUT} />
          </div>
        </div>

        {statusNotice ? (
          <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 14, backgroundColor: 'rgba(39,174,96,0.12)', color: '#1f7a44', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
            {statusNotice}
          </div>
        ) : null}
        {error ? (
          <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 14, backgroundColor: 'rgba(214,83,79,0.12)', color: '#b23d37', fontFamily: '"Lexend", sans-serif', fontSize: 13 }}>
            {error}
          </div>
        ) : null}
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 0.95fr) minmax(0, 1.45fr)',
        gap: 20,
        alignItems: 'start',
      }}>
        <div style={{
          padding: 18,
          borderRadius: 28,
          backgroundColor: 'white',
          border: '1px solid rgba(25,26,32,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 520,
        }}>
          {loading ? (
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)' }}>Loading applications…</p>
          ) : null}
          {!loading && !applications.length ? (
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)' }}>No applications are assigned to this agent yet.</p>
          ) : null}
          {applications.map((item) => {
            const tone = stageTone(item.stage)
            const active = String(item.id) === String(selected?.id)
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setSelectedId(String(item.id))}
                style={{
                  textAlign: 'left',
                  padding: 16,
                  borderRadius: 20,
                  border: active ? '1px solid rgb(25,26,32)' : '1px solid rgba(25,26,32,0.08)',
                  backgroundColor: active ? 'rgb(248,246,241)' : 'white',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(25,26,32,0.44)' }}>
                    {item.providerSource || item.sourceChannel || 'queue'}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    padding: '7px 10px',
                    backgroundColor: tone.bg,
                    color: tone.color,
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {formatStage(item.stage)}
                  </span>
                </div>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 17, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 12, lineHeight: 1.35 }}>
                  {item.listing.title || item.client.name || item.propertyId}
                </p>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.68)', marginTop: 6 }}>
                  {item.client.name || item.client.email} · {item.client.city || item.listing.district || 'No city yet'}
                </p>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.52)', marginTop: 10, lineHeight: 1.6 }}>
                  {item.lastMessagePreview || item.coverMessage || 'No last message yet.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginTop: 14 }}>
                  <span style={{ fontFamily: '"Fragment Mono", monospace', fontSize: 11, color: 'rgba(25,26,32,0.48)' }}>
                    {formatDateTime(item.lastMessageAt || item.updatedAt)}
                  </span>
                  {item.unreadCount ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 24,
                      height: 24,
                      borderRadius: 999,
                      padding: '0 8px',
                      backgroundColor: 'rgb(25,26,32)',
                      color: 'rgb(245,245,245)',
                      fontFamily: '"Lexend", sans-serif',
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      {item.unreadCount}
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          <section style={{
            padding: 24,
            borderRadius: 28,
            backgroundColor: 'white',
            border: '1px solid rgba(25,26,32,0.08)',
          }}>
            {!activeApplication ? (
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)' }}>
                Select an application to inspect the client, listing and provider thread.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Active application
                    </p>
                    <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 34, lineHeight: 1.08, color: 'rgb(25,26,32)', marginTop: 10 }}>
                      {selected?.listing.title || activeApplication.clientName || selected?.propertyId}
                    </h3>
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.66)', marginTop: 12 }}>
                      {selected?.listing.address || activeApplication.clientAddress || 'No listing address yet'}
                    </p>
                  </div>
                  <div style={{ minWidth: 240, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button type="button" onClick={() => applyStage('waiting_for_reply')} style={{ ...INPUT, cursor: 'pointer', fontWeight: 700, backgroundColor: 'rgb(25,26,32)', color: 'white' }}>
                      Mark waiting for reply
                    </button>
                    <button type="button" onClick={() => applyStage('viewing_requested')} style={{ ...INPUT, cursor: 'pointer', fontWeight: 700 }}>
                      Mark viewing requested
                    </button>
                    {selected?.listing.source && selected?.listing.externalId ? (
                      <Link
                        to={buildListingDetailHref(lang, { source: selected.listing.source, id: selected.listing.externalId, slug: selected.listing.slug })}
                        style={{
                          textAlign: 'center',
                          textDecoration: 'none',
                          padding: '12px 14px',
                          borderRadius: 14,
                          border: '1px solid rgba(25,26,32,0.12)',
                          color: 'rgb(25,26,32)',
                          fontFamily: '"Lexend", sans-serif',
                          fontSize: 14,
                          fontWeight: 600,
                          backgroundColor: 'white',
                        }}
                      >
                        Open listing
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginTop: 20 }}>
                  <MetricCard label="Client" value={selected?.client.name || activeApplication.clientName || '—'} hint={selected?.client.email || activeApplication.clientEmail || ''} />
                  <MetricCard label="Budget" value={selected?.client.budget || activeApplication.clientBudget || '—'} hint={selected?.client.moveInDate ? `Move-in ${selected.client.moveInDate}` : (activeApplication.clientMoveInDate ? `Move-in ${activeApplication.clientMoveInDate}` : 'No move-in date')} />
                  <MetricCard label="Provider" value={selected?.providerSource?.toUpperCase() || '—'} hint={thread.providerThread?.account_label || selected?.providerThread.accountLabel || 'No account linked'} />
                  <MetricCard label="Thread" value={thread.providerThread?.provider_conversation_id || selected?.providerConversationId || '—'} hint={thread.providerThread?.counterparty_name || selected?.providerThread.counterpartyName || 'No counterparty yet'} dark />
                </div>

                <div style={{ marginTop: 20 }}>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Stage controls
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                    {['queued_for_agent', 'waiting_for_reply', 'reply_received', 'viewing_requested', 'documents_requested', 'viewing_confirmed', 'accepted', 'rejected'].map((stage) => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => applyStage(stage)}
                        style={{
                          border: '1px solid rgba(25,26,32,0.12)',
                          borderRadius: 999,
                          padding: '10px 14px',
                          backgroundColor: activeApplication.stage === stage ? 'rgb(25,26,32)' : 'white',
                          color: activeApplication.stage === stage ? 'white' : 'rgb(25,26,32)',
                          fontFamily: '"Lexend", sans-serif',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {formatStage(stage)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          <section style={{
            padding: 24,
            borderRadius: 28,
            backgroundColor: 'white',
            border: '1px solid rgba(25,26,32,0.08)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
              <div>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Client context
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 16 }}>
                  <MetricCard label="Phone" value={selected?.client.phone || activeApplication?.clientPhone || '—'} />
                  <MetricCard label="City" value={selected?.client.city || activeApplication?.clientCity || '—'} />
                  <MetricCard label="Preferred districts" value={selected?.client.preferredDistricts || activeApplication?.clientPreferredDistricts || '—'} />
                  <MetricCard label="Listing area" value={selected?.listing.district || selected?.listing.cityHint || '—'} />
                </div>
                <textarea
                  value={agentNote}
                  onChange={(event) => setAgentNote(event.target.value)}
                  placeholder="Add a manual agent note to the timeline…"
                  style={{ ...INPUT, minHeight: 110, resize: 'vertical', marginTop: 16 }}
                />
                <button
                  type="button"
                  onClick={saveAgentNote}
                  disabled={saving || !selected}
                  style={{
                    marginTop: 12,
                    border: 'none',
                    borderRadius: 14,
                    padding: '12px 16px',
                    backgroundColor: 'rgb(25,26,32)',
                    color: 'white',
                    fontFamily: '"Lexend", sans-serif',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  Save agent note
                </button>
              </div>

              <div>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Provider sync
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  <MetricCard label="Conversation state" value={selected?.conversationState || activeApplication?.conversation_state || 'none'} />
                  <MetricCard label="Last message" value={selected?.lastMessagePreview || activeApplication?.last_message_preview || '—'} hint={formatDateTime(selected?.lastMessageAt || activeApplication?.last_message_at)} />
                  <MetricCard label="Counterparty" value={thread.providerThread?.counterparty_name || selected?.providerThread.counterpartyName || '—'} hint={thread.providerThread?.provider_listing_address || selected?.providerThread.providerListingAddress || 'No provider address linked'} />
                </div>
              </div>
            </div>
          </section>

          <section style={{
            padding: 24,
            borderRadius: 28,
            backgroundColor: 'white',
            border: '1px solid rgba(25,26,32,0.08)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Messages
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {threadLoading ? <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)' }}>Loading thread…</p> : null}
                  {threadError ? <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: '#b23d37' }}>{threadError}</p> : null}
                  {!threadLoading && !thread.messages.length ? (
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)' }}>
                      No synchronized provider messages yet.
                    </p>
                  ) : null}
                  {thread.messages.map((item) => <MessageCard key={item.id} item={item} />)}
                </div>
              </div>

              <div>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.48)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Timeline
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {!threadLoading && !thread.events.length ? (
                    <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)' }}>
                      No timeline events yet.
                    </p>
                  ) : null}
                  {thread.events.map((item) => <EventCard key={item.id} item={item} />)}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </>
  )
}

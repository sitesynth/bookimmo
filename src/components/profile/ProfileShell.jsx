import React, { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile.js'

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

const DOCUMENT_PRESETS = [
  { category: 'schufa', label: 'SCHUFA credit check', hint: 'Upload a current SCHUFA or Bonitatsauskunft PDF.' },
  { category: 'income', label: 'Income proof', hint: 'Payslips, salary statement or freelance income proof.' },
  { category: 'identity', label: 'Identity document', hint: 'Passport or ID card metadata for the package.' },
  { category: 'rent_proof', label: 'Rent payment proof', hint: 'Bank statement or rent payment confirmation.' },
  { category: 'recommendation', label: 'Landlord recommendation', hint: 'Reference letter from a previous landlord.' },
]

function readLang(pathname) {
  return /^\/(de|en|fr|it|nl)(\/|$)/.exec(pathname)?.[1] || 'de'
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.62)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function SectionCard({ title, description, children, footer = null }) {
  return (
    <section style={{
      padding: 24,
      borderRadius: 24,
      backgroundColor: 'white',
      border: '1px solid rgba(25,26,32,0.08)',
      boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
    }}>
      <h3 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 21, color: 'rgb(25,26,32)' }}>
        {title}
      </h3>
      <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.6, color: 'rgba(25,26,32,0.68)', marginTop: 8 }}>
        {description}
      </p>
      <div style={{ marginTop: 18 }}>
        {children}
      </div>
      {footer ? <div style={{ marginTop: 18 }}>{footer}</div> : null}
    </section>
  )
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

function DocumentRow({ item, onUpload, onRemove }) {
  return (
    <div style={{
      padding: 18,
      borderRadius: 18,
      backgroundColor: 'rgb(248,246,241)',
      border: '1px solid rgba(25,26,32,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 16, fontWeight: 600, color: 'rgb(25,26,32)' }}>
          {item.label}
        </p>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, lineHeight: 1.6, color: 'rgba(25,26,32,0.62)', marginTop: 6 }}>
          {item.hint}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 14,
          padding: '11px 14px',
          backgroundColor: 'rgb(25,26,32)',
          color: 'rgb(245,245,245)',
          fontFamily: '"Lexend", sans-serif',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          Upload file
          <input type="file" onChange={onUpload} style={{ display: 'none' }} />
        </label>

        {item.document ? (
          <>
            <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.72)' }}>
              {item.document.name}
            </span>
            <button
              type="button"
              onClick={onRemove}
              style={{
                border: '1px solid rgba(25,26,32,0.12)',
                borderRadius: 14,
                padding: '10px 12px',
                backgroundColor: 'white',
                color: 'rgb(25,26,32)',
                fontFamily: '"Lexend", sans-serif',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </>
        ) : (
          <span style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.52)' }}>
            Missing
          </span>
        )}
      </div>
    </div>
  )
}

export default function ProfileShell() {
  const location = useLocation()
  const lang = readLang(location.pathname)
  const [currentStep, setCurrentStep] = useState('self')
  const {
    user,
    isAuthenticated,
    loading,
    saving,
    error,
    notice,
    profile,
    setProfile,
    completionPercent,
    documentStats,
    save,
  } = useProfile()

  const stepState = useMemo(() => {
    const selfDone = Boolean(profile.moveInDate && profile.maxBudget && profile.aboutMe && profile.adultsCount)
    const personalDone = Boolean(profile.firstName && profile.lastName && profile.phone && profile.currentAddress && profile.occupation)
    const docsDone = documentStats.readyCount >= 3
    const reviewDone = selfDone && personalDone && docsDone

    return { selfDone, personalDone, docsDone, reviewDone }
  }, [documentStats.readyCount, profile])

  function updateField(key, value) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  function handleUpload(category, event) {
    const file = event.target.files?.[0]
    if (!file) return

    setProfile((prev) => {
      const remaining = prev.documents.filter((item) => item.category !== category)
      return {
        ...prev,
        documents: [
          ...remaining,
          {
            id: `${category}-${Date.now()}`,
            category,
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            uploadedAt: new Date().toISOString(),
          },
        ],
      }
    })
    event.target.value = ''
  }

  function removeDocument(category) {
    setProfile((prev) => ({
      ...prev,
      documents: prev.documents.filter((item) => item.category !== category),
    }))
  }

  if (!isAuthenticated) {
    return (
      <section style={{
        padding: 28,
        borderRadius: 28,
        backgroundColor: 'white',
        border: '1px solid rgba(25,26,32,0.08)',
        boxShadow: '0 18px 48px rgba(25,26,32,0.06)',
      }}>
        <h2 style={{ fontFamily: '"Lexend", sans-serif', fontSize: 28, color: 'rgb(25,26,32)' }}>
          Build your Bewerbermappe after sign in
        </h2>
        <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 15, lineHeight: 1.65, color: 'rgba(25,26,32,0.68)', marginTop: 12, maxWidth: 720 }}>
          This profile flow is designed like a German rental application package: Selbstauskunft, personal details, trust documents and a reusable base for property-specific cover letters.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <Link
            to={`/${lang}/sign-up`}
            style={{
              textDecoration: 'none',
              borderRadius: 14,
              padding: '11px 14px',
              backgroundColor: 'rgb(25,26,32)',
              color: 'rgb(245,245,245)',
              fontFamily: '"Lexend", sans-serif',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Create account
          </Link>
          <Link
            to={`/${lang}/log-in`}
            style={{
              textDecoration: 'none',
              borderRadius: 14,
              padding: '11px 14px',
              border: '1px solid rgba(25,26,32,0.12)',
              backgroundColor: 'white',
              color: 'rgb(25,26,32)',
              fontFamily: '"Lexend", sans-serif',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Log in
          </Link>
        </div>
      </section>
    )
  }

  const documentsByCategory = new Map(profile.documents.map((item) => [item.category, item]))

  return (
    <>
      <SectionCard
        title="Bewerbermappe overview"
        description="This is now the working renter package for Germany: one reusable profile, one document stack and one base introduction that application drafts can pull into each listing."
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {[
            { label: 'Completion', value: `${completionPercent}%` },
            { label: 'Documents ready', value: `${documentStats.readyCount}/${documentStats.requiredCount}` },
            { label: 'Profile owner', value: user?.email || 'Unknown' },
            { label: 'Package status', value: completionPercent >= 75 ? 'Ready for applications' : 'Still missing key steps' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: 18,
                borderRadius: 18,
                backgroundColor: 'rgb(248,246,241)',
                border: '1px solid rgba(25,26,32,0.06)',
              }}
            >
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 12, color: 'rgba(25,26,32,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.label}
              </p>
              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 20, fontWeight: 700, color: 'rgb(25,26,32)', marginTop: 8 }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Bewerbermappe wizard"
        description="Mirror the German rental flow: Selbstauskunft first, then personal identity, then trust-building documents, then a review before you use the package in applications."
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StepPill active={currentStep === 'self'} done={stepState.selfDone} onClick={() => setCurrentStep('self')}>1. Selbstauskunft</StepPill>
          <StepPill active={currentStep === 'personal'} done={stepState.personalDone} onClick={() => setCurrentStep('personal')}>2. Personal info</StepPill>
          <StepPill active={currentStep === 'documents'} done={stepState.docsDone} onClick={() => setCurrentStep('documents')}>3. Documents</StepPill>
          <StepPill active={currentStep === 'review'} done={stepState.reviewDone} onClick={() => setCurrentStep('review')}>4. Review</StepPill>
        </div>

        <div style={{ marginTop: 20 }}>
          {loading ? (
            <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, color: 'rgba(25,26,32,0.62)' }}>
              Loading profile…
            </p>
          ) : null}

          {!loading && currentStep === 'self' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <Field label="Move-in date">
                  <input type="date" value={profile.moveInDate} onChange={(e) => updateField('moveInDate', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Max budget (EUR)">
                  <input type="number" min="0" value={profile.maxBudget} onChange={(e) => updateField('maxBudget', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Adults">
                  <select value={profile.adultsCount} onChange={(e) => updateField('adultsCount', e.target.value)} style={INPUT}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </Field>
                <Field label="Children">
                  <select value={profile.childrenCount} onChange={(e) => updateField('childrenCount', e.target.value)} style={INPUT}>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3+</option>
                  </select>
                </Field>
                <Field label="Pets">
                  <select value={profile.pets} onChange={(e) => updateField('pets', e.target.value)} style={INPUT}>
                    <option value="no">No pets</option>
                    <option value="yes">Has pets</option>
                  </select>
                </Field>
                <Field label="Shared apartment">
                  <select value={profile.sharedApartment} onChange={(e) => updateField('sharedApartment', e.target.value)} style={INPUT}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </Field>
                <Field label="Preferred districts">
                  <input value={profile.preferredDistricts} onChange={(e) => updateField('preferredDistricts', e.target.value)} placeholder="Winterhude, Eppendorf, Uhlenhorst" style={INPUT} />
                </Field>
              </div>

              <Field label="About your household">
                <textarea value={profile.aboutMe} onChange={(e) => updateField('aboutMe', e.target.value)} style={{ ...INPUT, minHeight: 140, resize: 'vertical' }} placeholder="Who is moving, why you are relocating, what kind of home you are looking for, and what makes you a reliable tenant." />
              </Field>
            </div>
          ) : null}

          {!loading && currentStep === 'personal' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <Field label="First name">
                  <input value={profile.firstName} onChange={(e) => updateField('firstName', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Last name">
                  <input value={profile.lastName} onChange={(e) => updateField('lastName', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Phone">
                  <input value={profile.phone} onChange={(e) => updateField('phone', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Preferred language">
                  <select value={profile.preferredLanguage} onChange={(e) => updateField('preferredLanguage', e.target.value)} style={INPUT}>
                    <option value="de">German</option>
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="it">Italian</option>
                    <option value="nl">Dutch</option>
                  </select>
                </Field>
                <Field label="Current city">
                  <input value={profile.currentCity} onChange={(e) => updateField('currentCity', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Current address">
                  <input value={profile.currentAddress} onChange={(e) => updateField('currentAddress', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Occupation">
                  <input value={profile.occupation} onChange={(e) => updateField('occupation', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Employment status">
                  <select value={profile.employmentStatus} onChange={(e) => updateField('employmentStatus', e.target.value)} style={INPUT}>
                    <option value="">Select</option>
                    <option value="full_time">Full-time employed</option>
                    <option value="part_time">Part-time employed</option>
                    <option value="self_employed">Self-employed</option>
                    <option value="student">Student</option>
                    <option value="retired">Retired</option>
                  </select>
                </Field>
                <Field label="Monthly household net income">
                  <input type="number" min="0" value={profile.monthlyNetIncome} onChange={(e) => updateField('monthlyNetIncome', e.target.value)} style={INPUT} />
                </Field>
                <Field label="Nationality">
                  <input value={profile.nationality} onChange={(e) => updateField('nationality', e.target.value)} style={INPUT} />
                </Field>
              </div>
            </div>
          ) : null}

          {!loading && currentStep === 'documents' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                padding: 16,
                borderRadius: 18,
                backgroundColor: documentStats.isReady ? 'rgba(39,174,96,0.08)' : 'rgba(255,184,0,0.12)',
                color: 'rgb(25,26,32)',
              }}>
                <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.6 }}>
                  {documentStats.isReady
                    ? 'Your package already has the core trust documents needed for a strong first application.'
                    : `Still missing: ${documentStats.missingCategories.join(', ')}.`}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                {DOCUMENT_PRESETS.map((item) => (
                  <DocumentRow
                    key={item.category}
                    item={{ ...item, document: documentsByCategory.get(item.category) }}
                    onUpload={(event) => handleUpload(item.category, event)}
                    onRemove={() => removeDocument(item.category)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {!loading && currentStep === 'review' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                <div style={{ padding: 18, borderRadius: 18, backgroundColor: 'rgb(248,246,241)', border: '1px solid rgba(25,26,32,0.06)' }}>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 17, fontWeight: 600, color: 'rgb(25,26,32)' }}>
                    Household
                  </p>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.7, color: 'rgba(25,26,32,0.7)', marginTop: 10 }}>
                    {profile.adultsCount} adults, {profile.childrenCount} children, pets: {profile.pets}, shared apartment: {profile.sharedApartment}.
                  </p>
                </div>

                <div style={{ padding: 18, borderRadius: 18, backgroundColor: 'rgb(248,246,241)', border: '1px solid rgba(25,26,32,0.06)' }}>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 17, fontWeight: 600, color: 'rgb(25,26,32)' }}>
                    Identity & work
                  </p>
                  <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 14, lineHeight: 1.7, color: 'rgba(25,26,32,0.7)', marginTop: 10 }}>
                    {profile.firstName} {profile.lastName}, {profile.occupation || 'occupation missing'}, {profile.employmentStatus || 'status missing'}, income € {profile.monthlyNetIncome || '—'}.
                  </p>
                </div>
              </div>

              <Field label="Reusable cover letter base">
                <textarea
                  value={profile.coverLetterTemplate}
                  onChange={(e) => updateField('coverLetterTemplate', e.target.value)}
                  style={{ ...INPUT, minHeight: 170, resize: 'vertical' }}
                  placeholder="Hello, we are looking for a long-term apartment in Hamburg. We have stable income, can provide all relevant documents, and would love to introduce ourselves further for matching listings."
                />
              </Field>

              <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.56)' }}>
                This template becomes the starting point for each property-specific application letter.
              </p>
            </div>
          ) : null}
        </div>

        {(error || notice) ? (
          <div style={{
            marginTop: 18,
            padding: '12px 14px',
            borderRadius: 14,
            backgroundColor: error ? 'rgba(192,57,43,0.08)' : 'rgba(39,174,96,0.08)',
            color: error ? '#c0392b' : '#1f7a44',
            fontFamily: '"Lexend", sans-serif',
            fontSize: 13,
          }}>
            {error || notice}
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 18 }}>
          <p style={{ fontFamily: '"Lexend", sans-serif', fontSize: 13, color: 'rgba(25,26,32,0.56)' }}>
            Save once, then reuse this package across all rental applications.
          </p>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              border: 'none',
              borderRadius: 14,
              padding: '12px 16px',
              backgroundColor: 'rgb(25,26,32)',
              color: 'rgb(245,245,245)',
              fontFamily: '"Lexend", sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save Bewerbermappe'}
          </button>
        </div>
      </SectionCard>
    </>
  )
}

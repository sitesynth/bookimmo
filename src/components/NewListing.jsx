import React from 'react'
import LiveListingFeed from './listings/LiveListingFeed.jsx'

export default function NewListing() {
  return (
    <section
      className="framer-1bxsx5l"
      id="new-listing"
      style={{
        padding: '96px 24px 48px',
        background: 'linear-gradient(180deg, rgba(255,253,248,0) 0%, rgba(245,241,234,0.72) 100%)',
      }}
    >
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <LiveListingFeed
          eyebrow="New Listing"
          title="Fresh properties for your next move."
          description="Explore the latest homes and apartments available across Germany, with clear details and a direct path to every listing."
          limit={3}
          prioritizeDistinctAddresses
          compact
          ctaLabel="Browse live search"
          sourceMode="database-cache"
        />
      </div>
    </section>
  )
}

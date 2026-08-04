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
          title="Fresh Germany listings, linked to real property pages."
          description="The homepage now surfaces the newest imported apartments from the database cache instead of static demo apartments, so every card opens an existing Bookimmo detail route."
          limit={3}
          compact
          ctaLabel="Browse live search"
          sourceMode="database-cache"
        />
      </div>
    </section>
  )
}

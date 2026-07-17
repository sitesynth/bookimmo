import React from 'react'
import LiveListingFeed from './listings/LiveListingFeed.jsx'

export default function FeaturedProperties() {
  return (
    <section
      className="framer-sc2163"
      id="featured-properties"
      style={{ padding: '48px 24px 96px' }}
    >
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <LiveListingFeed
          eyebrow="Featured Properties"
          title="Provider-backed cards instead of placeholder content."
          description="This section now reuses the same live listing layer, so clicks from the homepage always resolve to an existing detail page instead of a dead mock route."
          limit={3}
          compact
          ctaLabel="Explore all listings"
        />
      </div>
    </section>
  )
}

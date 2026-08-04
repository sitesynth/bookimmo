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
          title="Homes worth taking a closer look at."
          description="Discover a considered selection of current properties from our network, chosen to make your search easier and more focused."
          limit={3}
          compact
          ctaLabel="Explore all listings"
          sourceMode="database-cache"
        />
      </div>
    </section>
  )
}

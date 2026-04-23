#!/usr/bin/env node

/**
 * Seed script for book.immo Directus collections
 * Populates agents, properties, and blog_posts with test data
 *
 * Usage:
 *   node seed-directus.js
 *
 * Requires:
 *   DIRECTUS_BASE_URL (default: https://cms.book.immo)
 *   DIRECTUS_API_TOKEN (required)
 */

const https = require('https');
const http = require('http');

const DIRECTUS_BASE = process.env.DIRECTUS_BASE_URL || 'https://cms.book.immo';
const DIRECTUS_TOKEN = process.env.DIRECTUS_API_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: DIRECTUS_API_TOKEN environment variable is required');
  process.exit(1);
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(DIRECTUS_BASE + path);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function seedAgents() {
  console.log('\n📝 Seeding agents...');

  const agents = [
    {
      full_name: 'Sarah Johnson',
      slug: 'sarah-johnson',
      role_label: 'Senior Real Estate Agent',
      listings_count: 24,
      status: 'published',
      is_featured: true,
    },
    {
      full_name: 'Marco Rossi',
      slug: 'marco-rossi',
      role_label: 'Property Specialist',
      listings_count: 18,
      status: 'published',
      is_featured: true,
    },
    {
      full_name: 'Anna Schmidt',
      slug: 'anna-schmidt',
      role_label: 'Investment Advisor',
      listings_count: 15,
      status: 'published',
      is_featured: false,
    },
    {
      full_name: 'Pierre Dubois',
      slug: 'pierre-dubois',
      role_label: 'Luxury Homes Expert',
      listings_count: 32,
      status: 'published',
      is_featured: true,
    },
    {
      full_name: 'Elena van der Berg',
      slug: 'elena-van-der-berg',
      role_label: 'Residential Consultant',
      listings_count: 12,
      status: 'published',
      is_featured: false,
    },
  ];

  for (const agent of agents) {
    try {
      await request('POST', '/items/agents', agent);
      console.log(`  ✓ Added agent: ${agent.full_name}`);
    } catch (err) {
      console.error(`  ✗ Failed to add agent ${agent.full_name}:`, err.message);
    }
  }
}

async function seedProperties() {
  console.log('\n📝 Seeding properties...');

  const properties = [
    {
      title: 'Gorgeous Villa for Rent',
      slug: 'gorgeous-villa-rent',
      city_slug: 'Greenville, Jersey City',
      address: '123 Elm Street, Jersey City, NJ',
      short_description: 'Spacious 4-bedroom villa with modern amenities and ocean views',
      bedrooms: 4,
      bathrooms: 3,
      area_m2: 280,
      price: 3500,
      currency: 'USD',
      status: 'published',
      is_featured: true,
    },
    {
      title: 'Modern Apartment in Downtown',
      slug: 'modern-apartment-downtown',
      city_slug: 'Downtown, New York',
      address: '456 Park Avenue, New York, NY',
      short_description: 'Stylish 2-bedroom apartment with city views and premium finishes',
      bedrooms: 2,
      bathrooms: 2,
      area_m2: 120,
      price: 4200,
      currency: 'USD',
      status: 'published',
      is_featured: true,
    },
    {
      title: 'Cozy Studio Near Beach',
      slug: 'cozy-studio-beach',
      city_slug: 'Oceanside, Miami',
      address: '789 Ocean Drive, Miami, FL',
      short_description: 'Charming studio apartment walking distance to the beach',
      bedrooms: 1,
      bathrooms: 1,
      area_m2: 55,
      price: 1800,
      currency: 'USD',
      status: 'published',
      is_featured: false,
    },
    {
      title: 'Luxury Penthouse Suite',
      slug: 'luxury-penthouse-suite',
      city_slug: 'Financial District, San Francisco',
      address: '321 Market Street, San Francisco, CA',
      short_description: 'Exclusive penthouse with panoramic city views and private terrace',
      bedrooms: 3,
      bathrooms: 3,
      area_m2: 350,
      price: 7500,
      currency: 'USD',
      status: 'published',
      is_featured: true,
    },
    {
      title: 'Family House with Garden',
      slug: 'family-house-garden',
      city_slug: 'Suburban Heights, Boston',
      address: '654 Oak Lane, Boston, MA',
      short_description: 'Spacious family home with backyard, garage, and excellent school district',
      bedrooms: 5,
      bathrooms: 3,
      area_m2: 380,
      price: 4800,
      currency: 'USD',
      status: 'published',
      is_featured: false,
    },
    {
      title: 'Historic Brownstone',
      slug: 'historic-brownstone',
      city_slug: 'Brooklyn, New York',
      address: '987 Clinton Street, Brooklyn, NY',
      short_description: 'Renovated historic brownstone with original details and modern kitchen',
      bedrooms: 4,
      bathrooms: 2,
      area_m2: 240,
      price: 5500,
      currency: 'USD',
      status: 'published',
      is_featured: false,
    },
    {
      title: 'Waterfront Condo',
      slug: 'waterfront-condo',
      city_slug: 'Downtown, Seattle',
      address: '234 Harbor View, Seattle, WA',
      short_description: 'Modern waterfront condo with floor-to-ceiling windows and amenities',
      bedrooms: 2,
      bathrooms: 2,
      area_m2: 150,
      price: 3200,
      currency: 'USD',
      status: 'published',
      is_featured: false,
    },
    {
      title: 'Mountain Retreat Cabin',
      slug: 'mountain-retreat-cabin',
      city_slug: 'Lake Tahoe, California',
      address: '567 Pine Ridge Road, Lake Tahoe, CA',
      short_description: 'Peaceful mountain cabin surrounded by nature with hot tub and deck',
      bedrooms: 3,
      bathrooms: 2,
      area_m2: 200,
      price: 2800,
      currency: 'USD',
      status: 'published',
      is_featured: false,
    },
    {
      title: 'Contemporary Loft',
      slug: 'contemporary-loft',
      city_slug: 'Arts District, Los Angeles',
      address: '789 Art Avenue, Los Angeles, CA',
      short_description: 'Industrial-style loft with exposed brick, high ceilings, and natural light',
      bedrooms: 2,
      bathrooms: 1,
      area_m2: 130,
      price: 2900,
      currency: 'USD',
      status: 'published',
      is_featured: false,
    },
    {
      title: 'Suburban Family Townhouse',
      slug: 'suburban-family-townhouse',
      city_slug: 'Westchester, New York',
      address: '123 Maple Drive, Westchester, NY',
      short_description: 'Well-maintained townhouse in quiet neighborhood with driveway and patio',
      bedrooms: 3,
      bathrooms: 2,
      area_m2: 170,
      price: 3100,
      currency: 'USD',
      status: 'published',
      is_featured: false,
    },
    {
      title: 'Urban Studio Loft',
      slug: 'urban-studio-loft',
      city_slug: 'Midtown, Chicago',
      address: '456 State Street, Chicago, IL',
      short_description: 'Trendy studio loft in vibrant urban neighborhood with great restaurants',
      bedrooms: 1,
      bathrooms: 1,
      area_m2: 65,
      price: 1600,
      currency: 'USD',
      status: 'published',
      is_featured: false,
    },
  ];

  for (const property of properties) {
    try {
      await request('POST', '/items/properties', property);
      console.log(`  ✓ Added property: ${property.title}`);
    } catch (err) {
      console.error(`  ✗ Failed to add property ${property.title}:`, err.message);
    }
  }
}

async function seedBlogPosts() {
  console.log('\n📝 Seeding blog posts...');

  const now = new Date().toISOString();
  const posts = [
    {
      title: 'The Complete Guide to Renting Your First Apartment',
      slug: 'first-apartment-guide',
      excerpt: 'Everything you need to know about finding and renting your first apartment, from budgeting to signing a lease.',
      author_name: 'Sarah Johnson',
      status: 'published',
      published_at: now,
    },
    {
      title: '5 Red Flags to Watch Out For When House Hunting',
      slug: 'house-hunting-red-flags',
      excerpt: 'Learn the warning signs that indicate a property or landlord might be problematic before you commit.',
      author_name: 'Marco Rossi',
      status: 'published',
      published_at: now,
    },
    {
      title: 'How to Negotiate Better Rental Terms',
      slug: 'negotiating-rental-terms',
      excerpt: 'Pro tips for negotiating with landlords to get better lease terms and conditions for your next rental.',
      author_name: 'Anna Schmidt',
      status: 'published',
      published_at: now,
    },
    {
      title: 'Understanding Your Rental Rights and Responsibilities',
      slug: 'rental-rights-guide',
      excerpt: 'A comprehensive overview of tenant rights and landlord responsibilities in different jurisdictions.',
      author_name: 'Pierre Dubois',
      status: 'published',
      published_at: now,
    },
    {
      title: 'The Best Neighborhoods for Young Professionals',
      slug: 'neighborhoods-young-professionals',
      excerpt: 'Discover the top neighborhoods in major cities that offer the best lifestyle for young professionals.',
      author_name: 'Elena van der Berg',
      status: 'published',
      published_at: now,
    },
  ];

  for (const post of posts) {
    try {
      await request('POST', '/items/blog_posts', post);
      console.log(`  ✓ Added blog post: ${post.title}`);
    } catch (err) {
      console.error(`  ✗ Failed to add blog post ${post.title}:`, err.message);
    }
  }
}

async function main() {
  console.log('🌱 Starting Directus seed...');
  console.log(`📍 Target: ${DIRECTUS_BASE}`);

  try {
    await seedAgents();
    await seedProperties();
    await seedBlogPosts();

    console.log('\n✅ Seeding complete!');
    console.log('\nData summary:');
    console.log('  • 5 agents (3 featured)');
    console.log('  • 12 properties (4 featured)');
    console.log('  • 5 blog posts');
    console.log('\nTo verify, check:');
    console.log(`  https://cms.book.immo/admin/content/agents`);
    console.log(`  https://cms.book.immo/admin/content/properties`);
    console.log(`  https://cms.book.immo/admin/content/blog_posts`);
  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

main();

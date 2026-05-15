// Design tokens extracted from Framer CSS (framer-styles.css)
// Source token IDs preserved in comments for traceability

export const colors = {
  // --token-5c28b080-63a4-416d-b638-2f3867ab529e
  primary: '#ff6625',
  primaryLight: '#fff8f4',   // --token-7bd8e2a9-6a34-4dab-b55d-8134ba72d37b
  primaryBorder: '#ff66250a',

  // --token-3991cae2-fa00-4648-803b-711c24c1718d
  dark: '#191a20',
  darkAlpha60: '#191a2099',
  darkAlpha40: '#191a2066',
  darkAlpha20: '#191a2033',
  darkAlpha8: '#191a2014',

  // --token-8162f168-ed62-49f3-b338-425fedfa1e6f
  white: '#ffffff',
  border: '#0000000a',

  // House illustration gradient (hero pill shape)
  illustrationGradient: 'radial-gradient(91.98% 91.98% at 20.87% 20.28%, #ffaf8d 0%, #ff9263 100%)',
}

export const fonts = {
  heading: '"Bricolage Grotesque", sans-serif',
  body: '"Inter", "Inter Placeholder", sans-serif',
  accent: '"Lexend", sans-serif',
}

// All values verified via Chrome CDP getComputedStyle on homfort.framer.website
export const spacing = {
  sectionPadding: 'py-[120px] px-14',   // 120px 56px — from computed styles
  heroPadding: 'pt-[160px] pb-[88px] px-0',
  sectionGap: 'gap-[104px]',
  heroGap: 'gap-[88px]',
  cardPadding: 'p-8',
  maxWidth: 'max-w-[1200px] mx-auto',
}

// Typography scale from getComputedStyle on actual text elements
export const type = {
  hero: 'text-[81px] font-medium leading-[81px] tracking-[-4px]',
  h2: 'text-[40px] font-medium leading-[48px] tracking-[-2px]',
}

export const radii = {
  pill: 'rounded-[64px]',
  card: 'rounded-[16px]',   // verified: Variant 1 property cards
  testimonial: 'rounded-[8px]',
  buyIcon: 'rounded-[80px]',
  avatar: 'rounded-full',
  tag: 'rounded-full',
  sm: 'rounded-[16px]',
}

// Framer Motion spring — extracted from JS bundle
// transition:{damping:20,stiffness:80,mass:1,type:'spring'}
export const spring = { type: 'spring', damping: 20, stiffness: 80, mass: 1 }

export const springs = {
  fast:   { ...spring, delay: 0.1 },
  normal: { ...spring, delay: 0.2 },
  slow:   { ...spring, delay: 0.3 },
  stagger: (i) => ({ ...spring, delay: 0.05 + i * 0.08 }),
}

// Shared appear animation props for motion.div
export const appear = {
  initial: { opacity: 0, y: 150 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
}

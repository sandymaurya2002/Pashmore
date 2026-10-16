/** Single source of truth for brand + origin constants used across SEO. */

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pashmore.com'
).replace(/\/$/, '')

export const site = {
  name: 'Pashmore',
  legalName: 'Pashmore Textiles Private Limited',
  tagline: 'Timeless Indian craftsmanship, woven for modern luxury.',
  description:
    'Discover premium Pashmina shawls, Kashmiri-inspired textiles, stoles and timeless Indian craftsmanship at Pashmore.',
  url: siteUrl,
  locale: 'en_IN',
  language: 'en-IN',
  currency: 'INR',
  country: 'IN',
  email: 'hello@pashmore.com',
  phone: '+91 194 000 0000',
  address: {
    street: 'Boulevard Road, Dal Gate',
    city: 'Srinagar',
    region: 'Jammu & Kashmir',
    postalCode: '190001',
    country: 'IN',
  },
  founded: '1978',
  social: {
    instagram: 'https://www.instagram.com/pashmore',
    facebook: 'https://www.facebook.com/pashmore',
    pinterest: 'https://www.pinterest.com/pashmore',
    youtube: 'https://www.youtube.com/@pashmore',
  },
  defaultOgImage: {
    url: '/images/editorial/og-default.png',
    width: 1200,
    height: 630,
    alt: 'Pashmore — pure Pashmina shawls and Kashmiri craftsmanship',
  },
} as const

/**
 * Free shipping threshold in rupees, used for display copy only. Cart totals
 * (shipping, GST, discounts) always come from the Worker.
 */
export const FREE_SHIPPING_THRESHOLD = 4999

/**
 * Kept short deliberately: the announcement bar is a single clipped line, and
 * anything much beyond ~48 characters wraps and loses its second half on a
 * 320px screen.
 */
export const announcements = [
  'Complimentary Luxury Packaging on Prepaid Orders',
  'Complimentary Shipping in India Above ₹4,999',
  'Handcrafted in Kashmir, Signed by Its Weaver',
] as const

export const trustSignals = [
  { icon: 'shield', label: 'Secure Payments' },
  { icon: 'refresh', label: 'Easy Returns' },
  { icon: 'gift', label: 'Premium Packaging' },
  { icon: 'award', label: 'Quality Crafted' },
  { icon: 'truck', label: 'Fast Shipping' },
] as const

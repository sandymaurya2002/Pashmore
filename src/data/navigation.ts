import type { ProductImage } from '@/types'

export interface NavLink {
  label: string
  href: string
  /** Renders a small gold rule beside the link. */
  highlight?: boolean
}

export interface NavColumn {
  title: string
  links: NavLink[]
}

export interface MegaMenuFeature {
  eyebrow: string
  heading: string
  href: string
  ctaLabel: string
  image: ProductImage
}

export interface NavItem {
  label: string
  href: string
  columns?: NavColumn[]
  feature?: MegaMenuFeature
}

const menuImage = (name: string, alt: string): ProductImage => ({
  url: `/images/menu/${name}.png`,
  alt,
  width: 600,
  height: 760,
})

export const primaryNav: NavItem[] = [
  {
    label: 'Men',
    href: '/collections/mens-shawls',
    columns: [
      {
        title: 'Shop Men',
        links: [
          { label: 'Shawls', href: '/collections/mens-shawls' },
          { label: 'Stoles', href: '/collections/mens-stoles' },
          { label: 'Scarves', href: '/collections/mens-scarves' },
          { label: 'Jackets', href: '/collections/mens-jackets' },
          { label: 'Accessories', href: '/collections/mens-accessories' },
          { label: 'Gifts for Him', href: '/collections/gifts-for-him', highlight: true },
        ],
      },
      {
        title: 'By Material',
        links: [
          { label: 'Pure Pashmina', href: '/collections/pure-pashmina' },
          { label: 'Cashmere', href: '/collections/fine-wool' },
          { label: 'Kashmiri Handloom Wool', href: '/collections/heritage-collection' },
          { label: 'All Men’s Shawls', href: '/mens-shawls' },
        ],
      },
    ],
    feature: {
      eyebrow: 'The Men’s Edit',
      heading: 'Shawls cut to hang, not to wrap',
      href: '/collections/mens-shawls',
      ctaLabel: 'Explore men’s shawls',
      image: menuImage('menu-men', 'Pashmore men’s charcoal Pashmina shawl folded over a chair'),
    },
  },
  {
    label: 'Women',
    href: '/collections/womens-shawls',
    columns: [
      {
        title: 'Shop Women',
        links: [
          { label: 'Shawls', href: '/collections/womens-shawls' },
          { label: 'Pashmina', href: '/collections/womens-pashmina' },
          { label: 'Stoles', href: '/collections/womens-stoles' },
          { label: 'Scarves', href: '/collections/womens-scarves' },
          { label: 'Dupattas', href: '/collections/womens-dupattas' },
          { label: 'Dresses', href: '/collections/womens-dresses' },
          { label: 'Suits', href: '/collections/womens-suits' },
          { label: 'Gifts for Her', href: '/collections/gifts-for-her', highlight: true },
        ],
      },
      {
        title: 'By Craft',
        links: [
          { label: 'Sozni Embroidery', href: '/collections/kashmiri-collection' },
          { label: 'Kani Weave', href: '/collections/kashmiri-collection' },
          { label: 'Jamawar', href: '/collections/heritage-collection' },
          { label: 'Pure Pashmina Shawls', href: '/pure-pashmina-shawls' },
        ],
      },
    ],
    feature: {
      eyebrow: 'New This Season',
      heading: 'Ombré Pashmina, dipped by hand',
      href: '/collections/new-arrivals',
      ctaLabel: 'See new arrivals',
      image: menuImage('menu-women', 'Pashmore women’s cream Pashmina shawl draped over a marble ledge'),
    },
  },
  {
    label: 'Collections',
    href: '/collections',
    columns: [
      {
        title: 'Collections',
        links: [
          { label: 'New Arrivals', href: '/collections/new-arrivals' },
          { label: 'Best Sellers', href: '/collections/best-sellers' },
          { label: 'Heritage Collection', href: '/collections/heritage-collection' },
          { label: 'Fine Wool', href: '/collections/fine-wool' },
        ],
      },
      {
        title: 'By Craft',
        links: [
          { label: 'Pure Pashmina', href: '/collections/pure-pashmina' },
          { label: 'Kashmiri Collection', href: '/collections/kashmiri-collection' },
          { label: 'Wedding Collection', href: '/collections/wedding-collection' },
          { label: 'Luxury Collection', href: '/collections/luxury-collection' },
        ],
      },
    ],
    feature: {
      eyebrow: 'Crafted for Generations',
      heading: 'The Pure Pashmina collection',
      href: '/collections/pure-pashmina',
      ctaLabel: 'Discover the collection',
      image: menuImage('menu-collections', 'Undyed Pashmina yarn on a wooden charkha in a Srinagar workshop'),
    },
  },
  {
    label: 'Gifting',
    href: '/collections/gifting',
    columns: [
      {
        title: 'Gifting',
        links: [
          { label: 'Gifts for Her', href: '/collections/gifts-for-her' },
          { label: 'Gifts for Him', href: '/collections/gifts-for-him' },
          { label: 'Wedding Gifts', href: '/wedding-gifts' },
          { label: 'Corporate Gifts', href: '/corporate-gifts' },
          { label: 'Luxury Gift Boxes', href: '/collections/luxury-gift-boxes' },
        ],
      },
      {
        title: 'Gifting Services',
        links: [
          { label: 'Hand-written message cards', href: '/collections/gifting' },
          { label: 'Debossed corporate branding', href: '/corporate-gifts' },
          { label: 'Dispatch to multiple addresses', href: '/corporate-gifts' },
          { label: 'Speak to our gifting desk', href: '/contact' },
        ],
      },
    ],
    feature: {
      eyebrow: 'The Art of Gifting',
      heading: 'Presented in hand-bound boxes',
      href: '/collections/gifting',
      ctaLabel: 'Shop gifts',
      image: menuImage('menu-gifting', 'Pashmore lacquered gift box with a folded Pashmina stole inside'),
    },
  },
  {
    label: 'New Arrivals',
    href: '/collections/new-arrivals',
  },
]

export const footerColumns: NavColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Men’s Shawls', href: '/collections/mens-shawls' },
      { label: 'Women’s Shawls', href: '/collections/womens-shawls' },
      { label: 'Pure Pashmina', href: '/collections/pure-pashmina' },
      { label: 'Shawls', href: '/collections/shawls' },
      { label: 'Stoles', href: '/collections/stoles' },
      { label: 'New Arrivals', href: '/collections/new-arrivals' },
      { label: 'Best Sellers', href: '/collections/best-sellers' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'Craftsmanship', href: '/craftsmanship' },
      { label: 'Journal', href: '/blog' },
      { label: 'Contact', href: '/contact' },
      { label: 'Corporate Gifting', href: '/corporate-gifts' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns', href: '/returns' },
      { label: 'FAQs', href: '/faqs' },
      { label: 'Track Order', href: '/track-order' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My Account', href: '/account' },
      { label: 'Wishlist', href: '/wishlist' },
      { label: 'Orders', href: '/account/orders' },
    ],
  },
]

/** Curated queries shown in the empty state of the search overlay. */
export const popularSearches = [
  'pashmina',
  'kashmiri shawl',
  'wool stole',
  'sozni embroidery',
  'wedding shawl',
  'gifts under 5000',
  'men’s cashmere',
  'ivory shawl',
]

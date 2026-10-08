import type { Address, Customer, Order } from '@/types'
import { productBySlug } from '@/data/products'

/**
 * Demo account data.
 *
 * The account area is built against these shapes so the UI is complete and
 * reviewable before authentication exists. Replace `services/account` and
 * `services/orders` with real API calls and nothing here is needed.
 */

export const demoAddresses: Address[] = [
  {
    id: 'addr_home',
    label: 'Home',
    fullName: 'Ananya Raghunathan',
    line1: '14 Rani Jhansi Marg, Flat 302',
    line2: 'Civil Lines',
    city: 'New Delhi',
    state: 'Delhi',
    postalCode: '110054',
    country: 'India',
    phone: '+91 98100 00000',
    isDefault: true,
  },
  {
    id: 'addr_office',
    label: 'Office',
    fullName: 'Ananya Raghunathan',
    line1: 'Prestige Tower, 9th Floor',
    line2: 'Residency Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560025',
    country: 'India',
    phone: '+91 98100 00000',
  },
]

export const demoCustomer: Customer = {
  id: 'cust_demo',
  firstName: 'Ananya',
  lastName: 'Raghunathan',
  email: 'ananya@example.com',
  phone: '+91 98100 00000',
  addresses: demoAddresses,
  createdAt: '2024-11-02',
}

function orderItem(slug: string, quantity: number, color?: string, size?: string) {
  const product = productBySlug.get(slug)
  if (!product) throw new Error(`Unknown product in demo order: ${slug}`)
  return {
    productSlug: product.slug,
    name: product.name,
    image: product.images[0],
    color: color ?? product.colors[0]?.name,
    size: size ?? product.sizes[0]?.name,
    unitPrice: product.price,
    quantity,
  }
}

export const demoOrders: Order[] = [
  {
    id: 'ord_1042',
    number: 'PSH-104287',
    placedAt: '2026-06-18',
    status: 'delivered',
    items: [orderItem('ivory-heritage-pashmina-shawl', 1), orderItem('sand-cashmere-stole', 1)],
    totals: {
      subtotal: 15498,
      discount: 1550,
      shipping: 0,
      tax: 664,
      total: 13948,
      itemCount: 2,
    },
    shippingAddress: demoAddresses[0],
    paymentMethod: 'UPI',
    trackingNumber: 'BLR8827194IN',
    estimatedDelivery: '2026-06-24',
  },
  {
    id: 'ord_1088',
    number: 'PSH-108841',
    placedAt: '2026-07-29',
    status: 'shipped',
    items: [orderItem('classic-charcoal-mens-pashmina-shawl', 1)],
    totals: {
      subtotal: 13999,
      discount: 0,
      shipping: 0,
      tax: 667,
      total: 13999,
      itemCount: 1,
    },
    shippingAddress: demoAddresses[1],
    paymentMethod: 'Credit Card',
    trackingNumber: 'DEL5510923IN',
    estimatedDelivery: '2026-08-16',
  },
  {
    id: 'ord_1103',
    number: 'PSH-110356',
    placedAt: '2026-08-09',
    status: 'processing',
    items: [orderItem('ivory-pashmina-gift-box', 2)],
    totals: {
      subtotal: 23998,
      discount: 2400,
      shipping: 0,
      tax: 1028,
      total: 21598,
      itemCount: 2,
    },
    shippingAddress: demoAddresses[0],
    paymentMethod: 'Net Banking',
    estimatedDelivery: '2026-08-20',
  },
]

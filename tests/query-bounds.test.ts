import { describe, expect, it } from 'vitest'

import { MAX_FILTER_VALUES, MAX_PAGE, parseFilters, parsePage } from '@/lib/query'

describe('filter and page bounds', () => {
  it('caps each filter facet to protect Worker CPU from crawler URLs', () => {
    const values = Array.from({ length: MAX_FILTER_VALUES + 20 }, (_, i) => `c${i}`)
    const filters = parseFilters({ color: values.join(',') })
    expect(filters.color).toHaveLength(MAX_FILTER_VALUES)
    expect(filters.color[0]).toBe('c0')
  })

  it('clamps page numbers to a safe maximum', () => {
    expect(parsePage({ page: '1' })).toBe(1)
    expect(parsePage({ page: '9999' })).toBe(MAX_PAGE)
    expect(parsePage({ page: '0' })).toBe(1)
    expect(parsePage({ page: 'abc' })).toBe(1)
  })
})

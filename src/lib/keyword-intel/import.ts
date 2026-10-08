import type { KeywordMetrics } from '@/types/keywords'
import type { MetricsMap } from './index'
import { cleanKeyword } from './normalize'

/**
 * Parses a metrics export from Google Keyword Planner, Search Console or an
 * SEO tool (Ahrefs, Semrush, DataForSEO CSVs). Only real numbers are taken:
 * ranges such as "1K – 10K" and text such as "High" are skipped rather than
 * converted into a guess.
 */

const HEADERS: Record<keyof Omit<KeywordMetrics, 'source'> | 'keyword', string[]> = {
  keyword: ['keyword', 'keywords', 'search term', 'query', 'top queries'],
  searchVolume: ['avg. monthly searches', 'avg monthly searches', 'search volume', 'volume', 'monthly volume'],
  cpc: ['cpc', 'cpc (inr)', 'average cpc', 'avg. cpc', 'top of page bid (high range)'],
  competition: ['competition (indexed value)', 'competition', 'competitive density', 'com.'],
  seoDifficulty: ['keyword difficulty', 'kd', 'kd %', 'kd%', 'difficulty', 'seo difficulty'],
  trend: ['trend', 'yoy change', 'three month change', 'trend (%)'],
}

export interface ImportResult {
  metrics: MetricsMap
  rows: number
  imported: number
  skippedValues: number
  missingColumns: string[]
}

export function decodeFile(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  // Keyword Planner exports UTF-16 LE with a BOM.
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  return new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '')
}

function parseDelimited(text: string): string[][] {
  const firstLines = text.split(/\r?\n/).slice(0, 5).join('\n')
  const delimiter = (firstLines.match(/\t/g)?.length ?? 0) > (firstLines.match(/,/g)?.length ?? 0) ? '\t' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === delimiter) {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += char
  }
  if (cell || row.length) rows.push([...row, cell])
  return rows
}

function toNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const value = raw.trim()
  if (!value || /[–-]\s*\d|k\s*[–-]/i.test(value.replace(/^[-+]/, ''))) return null // ranges
  const cleaned = value.replace(/[₹$,%\s]/g, '')
  if (!/^[-+]?\d*\.?\d+$/.test(cleaned)) return null
  return Number(cleaned)
}

export function parseMetricsFile(text: string): ImportResult {
  const rows = parseDelimited(text).filter((row) => row.some((cell) => cell.trim()))
  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => HEADERS.keyword.includes(cell.trim().toLowerCase())),
  )
  if (headerIndex === -1) {
    return { metrics: {}, rows: 0, imported: 0, skippedValues: 0, missingColumns: ['keyword'] }
  }

  const header = rows[headerIndex].map((cell) => cell.trim().toLowerCase())
  // Names are in priority order: Keyword Planner has both a text "Competition"
  // column and a numeric "Competition (indexed value)" one — take the number.
  const column = (names: string[]) => {
    for (const name of names) {
      const index = header.indexOf(name)
      if (index !== -1) return index
    }
    return -1
  }
  const columns = Object.fromEntries(
    Object.entries(HEADERS).map(([field, names]) => [field, column(names)]),
  ) as Record<keyof typeof HEADERS, number>

  const metrics: MetricsMap = {}
  let skippedValues = 0
  const body = rows.slice(headerIndex + 1)

  for (const row of body) {
    const keyword = cleanKeyword(row[columns.keyword] ?? '')
    if (!keyword) continue
    const entry: Partial<KeywordMetrics> = {}

    const read = (field: keyof Omit<KeywordMetrics, 'source'>, transform: (n: number) => number = (n) => n) => {
      if (columns[field] === -1) return
      const raw = row[columns[field]]
      const value = toNumber(raw)
      if (value === null) {
        if (raw && raw.trim()) skippedValues++
        return
      }
      entry[field] = transform(value)
    }

    read('searchVolume', Math.round)
    read('cpc')
    // Indexed competition (0–100) and percentages are normalised to 0–1.
    read('competition', (n) => (n > 1 ? n / 100 : n))
    read('seoDifficulty')
    read('trend', (n) => Math.max(-1, Math.min(1, Math.abs(n) > 1 ? n / 100 : n)))

    if (Object.keys(entry).length) metrics[keyword] = entry
  }

  return {
    metrics,
    rows: body.length,
    imported: Object.keys(metrics).length,
    skippedValues,
    missingColumns: (['searchVolume', 'cpc', 'competition', 'seoDifficulty', 'trend'] as const).filter(
      (field) => columns[field] === -1,
    ),
  }
}

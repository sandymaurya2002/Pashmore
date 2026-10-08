import type { CannibalizationIssue, KeywordCluster, KeywordRecord } from '@/types/keywords'
import { PRIORITY_LABEL } from './score'
import { zip } from './zip'

/**
 * Keyword research exports: CSV, Excel (.xlsx), JSON and a print-ready page
 * for PDF. Missing market metrics are written as "unavailable" — never 0 and
 * never an estimate.
 */

export const UNAVAILABLE = 'unavailable'

type Cell = string | number

export const EXPORT_COLUMNS = [
  'Keyword',
  'Category',
  'Cluster',
  'Intent',
  'Funnel Stage',
  'Country',
  'Language',
  'Search Volume',
  'CPC (INR)',
  'Competition',
  'SEO Difficulty',
  'Trend',
  'Relevance',
  'Opportunity Score',
  'Score Basis',
  'Priority',
  'Action',
  'Recommended URL',
  'Recommended Content Type',
  'Notes',
] as const

const metric = (value: number | null): Cell => (value === null ? UNAVAILABLE : value)

export function toRow(record: KeywordRecord): Cell[] {
  return [
    record.keyword,
    record.category,
    record.cluster,
    record.intent,
    record.funnelStage,
    record.country,
    record.language,
    metric(record.metrics.searchVolume),
    metric(record.metrics.cpc),
    metric(record.metrics.competition),
    metric(record.metrics.seoDifficulty),
    metric(record.metrics.trend),
    record.relevance,
    record.opportunityScore,
    record.scoreBasis,
    PRIORITY_LABEL[record.priority],
    record.action,
    record.recommendedPage ?? '',
    record.recommendedContentType,
    record.notes.join(' | '),
  ]
}

/* ---------------------------------------------------------------- CSV */

function csvCell(value: Cell): string {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(records: KeywordRecord[]): string {
  const lines = [EXPORT_COLUMNS.join(','), ...records.map((record) => toRow(record).map(csvCell).join(','))]
  // BOM so Excel opens UTF-8 (₹, emoji) correctly.
  return `﻿${lines.join('\r\n')}`
}

/* ---------------------------------------------------------------- JSON */

/** Section 30 database shape, snake_case, ready for a future API/DB import. */
export function toJson(records: KeywordRecord[], meta: { generatedAt: string; metricsSource: string | null }): string {
  return JSON.stringify(
    {
      generated_at: meta.generatedAt,
      metrics_source: meta.metricsSource,
      note: 'null metrics are unavailable, not zero. opportunity_score is "estimated" until real metrics are imported.',
      keywords: records.map((record) => ({
        keyword: record.keyword,
        category: record.category,
        cluster: record.cluster,
        intent: record.intent,
        funnel_stage: record.funnelStage,
        country: record.country,
        language: record.language,
        search_volume: record.metrics.searchVolume,
        cpc: record.metrics.cpc,
        competition: record.metrics.competition,
        seo_difficulty: record.metrics.seoDifficulty,
        trend: record.metrics.trend,
        relevance: record.relevance,
        opportunity_score: record.opportunityScore,
        score_basis: record.scoreBasis,
        priority: record.priority,
        action: record.action,
        recommended_page: record.recommendedPage,
        recommended_content_type: record.recommendedContentType,
        claim_sensitive: record.claimSensitive,
        notes: record.notes,
      })),
    },
    null,
    2,
  )
}

/* ---------------------------------------------------------------- XLSX */

const xmlEscape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    // Strip characters XML 1.0 forbids.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')

function columnName(index: number): string {
  let name = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name
  return name
}

function sheetXml(rows: Cell[][]): string {
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => {
          const ref = `${columnName(c)}${r + 1}`
          const style = r === 0 ? ' s="1"' : ''
          return typeof value === 'number' && Number.isFinite(value)
            ? `<c r="${ref}"${style}><v>${value}</v></c>`
            : `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(String(value))}</t></is></c>`
        })
        .join('')
      return `<row r="${r + 1}">${cells}</row>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>${body}</sheetData></worksheet>`
}

export function toXlsx(input: {
  records: KeywordRecord[]
  clusters: KeywordCluster[]
  issues: CannibalizationIssue[]
  generatedAt: string
  metricsSource: string | null
}): Uint8Array {
  const sheets: Array<{ name: string; rows: Cell[][] }> = [
    { name: 'Keywords', rows: [[...EXPORT_COLUMNS], ...input.records.map(toRow)] },
    {
      name: 'Clusters',
      rows: [
        ['Cluster', 'Name', 'Primary Keyword', 'Keywords', 'Top Score', 'Intent', 'Action', 'Target URL', 'Target Type', 'Secondary', 'Questions', 'Related', 'Notes'],
        ...input.clusters.map((cluster) => [
          cluster.id,
          cluster.name,
          cluster.primaryKeyword,
          cluster.keywordCount,
          cluster.topScore,
          cluster.intent,
          cluster.action,
          cluster.targetUrl ?? '',
          cluster.targetType,
          cluster.secondary.join(', '),
          cluster.questions.join(' | '),
          cluster.related.join(', '),
          cluster.notes.join(' | '),
        ]),
      ],
    },
    {
      name: 'Cannibalization',
      rows: [
        ['Severity', 'Cluster', 'URLs', 'Reason', 'Recommendation', 'Detail'],
        ...input.issues.map((issue) => [issue.severity, issue.cluster, issue.urls.join(' , '), issue.reason, issue.recommendation, issue.detail]),
      ],
    },
    {
      name: 'About',
      rows: [
        ['Pashmore keyword research'],
        ['Generated', input.generatedAt],
        ['Metrics source', input.metricsSource ?? 'None imported'],
        ['Search volume, CPC, competition, difficulty, trend', 'Shown as "unavailable" unless imported from a real tool. Never estimated.'],
        ['Score basis', 'estimated = on-site signals only (intent, relevance, conversion); partial = some market data; measured = all market data.'],
        ['Priority', '90–100 Very High · 75–89 High · 50–74 Medium · 25–49 Low · 0–24 Very Low'],
      ],
    },
  ]

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
    .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join('')}</Types>`

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
    .map((sheet, i) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('')}</sheets></workbook>`

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
    .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`

  return zip([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'xl/workbook.xml', data: workbook },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
    { name: 'xl/styles.xml', data: styles },
    ...sheets.map((sheet, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(sheet.rows) })),
  ])
}

/* ---------------------------------------------------------------- PDF */

const htmlEscape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * A print-ready HTML document. The browser's print dialog turns it into a PDF
 * ("Save as PDF"), which keeps fonts and the ₹ sign intact without a PDF library.
 */
export function toPrintHtml(input: {
  records: KeywordRecord[]
  clusters: KeywordCluster[]
  issues: CannibalizationIssue[]
  generatedAt: string
  metricsSource: string | null
}): string {
  const head = ['Keyword', 'Cluster', 'Intent', 'Funnel', 'Volume', 'CPC', 'Difficulty', 'Score', 'Priority', 'Action', 'Recommended URL']
  const rows = input.records
    .map((r) =>
      [
        r.keyword,
        r.cluster,
        r.intent,
        r.funnelStage,
        r.metrics.searchVolume ?? '—',
        r.metrics.cpc ?? '—',
        r.metrics.seoDifficulty ?? '—',
        `${r.opportunityScore}${r.scoreBasis === 'measured' ? '' : '*'}`,
        PRIORITY_LABEL[r.priority],
        r.action,
        r.recommendedPage ?? '',
      ]
        .map((cell) => `<td>${htmlEscape(String(cell))}</td>`)
        .join(''),
    )
    .map((cells) => `<tr>${cells}</tr>`)
    .join('')

  const clusterRows = input.clusters
    .map(
      (c) =>
        `<tr><td>${htmlEscape(c.name)}</td><td>${htmlEscape(c.primaryKeyword)}</td><td>${c.keywordCount}</td><td>${c.topScore}</td><td>${c.action}</td><td>${htmlEscape(c.targetUrl ?? '')}</td></tr>`,
    )
    .join('')

  const issueRows = input.issues
    .map(
      (i) =>
        `<tr><td>${i.severity}</td><td>${htmlEscape(i.urls.join(', '))}</td><td>${htmlEscape(i.reason)}</td><td>${i.recommendation}</td></tr>`,
    )
    .join('')

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Pashmore keyword research</title><style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font: 9px/1.35 -apple-system, Segoe UI, Roboto, sans-serif; color: #1f1d1a; }
    h1 { font-size: 16px; margin: 0 0 4px; } h2 { font-size: 12px; margin: 18px 0 6px; }
    p { margin: 0 0 6px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e4ddd1; padding: 3px 4px; text-align: left; vertical-align: top; }
    th { background: #f3eee5; } tr { break-inside: avoid; }
  </style></head><body>
    <h1>Pashmore keyword research</h1>
    <p>Generated ${htmlEscape(input.generatedAt)} · Metrics source: ${htmlEscape(input.metricsSource ?? 'none imported')} · ${input.records.length} keywords</p>
    <p>* Estimated score — built from on-site signals only; market metrics shown as “—” are unavailable, not zero.</p>
    <h2>Clusters</h2><table><thead><tr><th>Cluster</th><th>Primary keyword</th><th>Keywords</th><th>Top score</th><th>Action</th><th>Target</th></tr></thead><tbody>${clusterRows}</tbody></table>
    <h2>Cannibalization</h2><table><thead><tr><th>Severity</th><th>URLs</th><th>Reason</th><th>Fix</th></tr></thead><tbody>${issueRows}</tbody></table>
    <h2>Keywords</h2><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
  </body></html>`
}

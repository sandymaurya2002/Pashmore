'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, FileUp, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { applyMetrics, type MetricsMap } from '@/lib/keyword-intel'
import { toCsv, toJson, toPrintHtml, toXlsx } from '@/lib/keyword-intel/export'
import { decodeFile, parseMetricsFile, type ImportResult } from '@/lib/keyword-intel/import'
import { PRIORITY_LABEL } from '@/lib/keyword-intel/score'
import { cn } from '@/lib/utils'
import type { KeywordRecord, KeywordReport, PageAction, Priority } from '@/types/keywords'

const STORAGE_KEY = 'pashmore:keyword-metrics'
const PAGE_SIZE = 50

type Tab = 'keywords' | 'clusters' | 'cannibalization' | 'metrics'
type SortKey = 'opportunityScore' | 'keyword' | 'searchVolume' | 'relevance'

interface StoredMetrics {
  source: string
  importedAt: string
  metrics: MetricsMap
}

const ACTION_LABEL: Record<PageAction, string> = {
  'optimise-existing': 'Optimise existing',
  create: 'Create page',
  'merge-into': 'Section of page',
  'faq-entry': 'FAQ entry',
  'no-page': 'No page',
  'do-not-target': 'Do not target',
}

const ACTION_TONE: Record<PageAction, string> = {
  'optimise-existing': 'bg-[#e6efe6] text-[#2f5130]',
  create: 'bg-gold-pale text-brown',
  'merge-into': 'bg-sand/60 text-brown',
  'faq-entry': 'bg-cream text-mocha',
  'no-page': 'bg-line text-mocha',
  'do-not-target': 'bg-burgundy/10 text-burgundy',
}

const PRIORITIES: Priority[] = ['very-high', 'high', 'medium', 'low', 'very-low']

function loadStored(): StoredMetrics | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredMetrics) : null
  } catch {
    return null
  }
}

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function printHtml(html: string) {
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (!doc) return
  doc.open()
  doc.write(html)
  doc.close()
  frame.contentWindow?.focus()
  setTimeout(() => {
    frame.contentWindow?.print()
    setTimeout(() => frame.remove(), 1000)
  }, 250)
}

const fmt = (value: number | null, digits = 0) =>
  value === null ? '—' : value.toLocaleString('en-IN', { maximumFractionDigits: digits })

const unique = <T,>(values: T[]) => [...new Set(values)].sort()

export function KeywordDashboard({ report: baseReport }: { report: KeywordReport }) {
  const [stored, setStored] = useState<StoredMetrics | null>(null)
  const [tab, setTab] = useState<Tab>('keywords')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    cluster: '',
    intent: '',
    funnel: '',
    action: '',
    priority: '',
    country: '',
    origin: '',
  })
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'opportunityScore', dir: -1 })
  const [page, setPage] = useState(0)
  const [importStatus, setImportStatus] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => setStored(loadStored()), [])

  const report = useMemo(
    () => (stored ? applyMetrics(baseReport, stored.metrics, stored.source) : baseReport),
    [baseReport, stored],
  )

  const options = useMemo(
    () => ({
      category: unique(report.records.map((r) => r.category)),
      cluster: unique(report.records.map((r) => r.cluster)),
      intent: unique(report.records.map((r) => r.intent)),
      funnel: ['TOFU', 'MOFU', 'BOFU'],
      action: Object.keys(ACTION_LABEL),
      priority: PRIORITIES as string[],
      country: unique(report.records.map((r) => r.country)),
      origin: ['seed', 'generated'],
    }),
    [report.records],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = report.records.filter(
      (r) =>
        (!q || r.keyword.includes(q) || (r.recommendedPage ?? '').includes(q)) &&
        (!filters.category || r.category === filters.category || r.alsoIn.includes(filters.category as never)) &&
        (!filters.cluster || r.cluster === filters.cluster) &&
        (!filters.intent || r.intent === filters.intent) &&
        (!filters.funnel || r.funnelStage === filters.funnel) &&
        (!filters.action || r.action === filters.action) &&
        (!filters.priority || r.priority === filters.priority) &&
        (!filters.country || r.country === filters.country) &&
        (!filters.origin || r.origin === filters.origin),
    )
    const value = (r: KeywordRecord): number | string =>
      sort.key === 'keyword'
        ? r.keyword
        : sort.key === 'searchVolume'
          ? (r.metrics.searchVolume ?? -1)
          : r[sort.key]
    return rows.sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir
    })
  }, [report.records, query, filters, sort])

  useEffect(() => setPage(0), [query, filters, sort])

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visibleClusters = new Set(filtered.map((r) => r.cluster))
  const exportInput = {
    records: filtered,
    clusters: report.clusters.filter((c) => visibleClusters.has(c.id)),
    issues: report.issues,
    generatedAt: report.generatedAt,
    metricsSource: report.metricsSource,
  }
  const stamp = report.generatedAt.slice(0, 10)

  const counts = useMemo(() => {
    const byAction = new Map<PageAction, number>()
    const byPriority = new Map<Priority, number>()
    for (const r of report.records) {
      byAction.set(r.action, (byAction.get(r.action) ?? 0) + 1)
      byPriority.set(r.priority, (byPriority.get(r.priority) ?? 0) + 1)
    }
    return { byAction, byPriority }
  }, [report.records])

  const toggleSort = (key: SortKey) =>
    setSort((current) => ({ key, dir: current.key === key ? ((current.dir * -1) as 1 | -1) : key === 'keyword' ? 1 : -1 }))

  async function handleImport(file: File) {
    setImportError(null)
    try {
      const result = parseMetricsFile(decodeFile(await file.arrayBuffer()))
      if (result.imported === 0) {
        setImportStatus(result)
        setImportError('No usable rows found. The file needs a "Keyword" column and at least one numeric metric column.')
        return
      }
      const next: StoredMetrics = {
        source: file.name,
        importedAt: new Date().toISOString(),
        metrics: { ...(stored?.metrics ?? {}), ...result.metrics },
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        setImportError('Imported for this session only — the browser blocked local storage.')
      }
      setStored(next)
      setImportStatus(result)
    } catch {
      setImportError('Could not read that file. Export it as CSV or TSV and try again.')
    }
  }

  function clearImported() {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable — nothing to clear */
    }
    setStored(null)
    setImportStatus(null)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-gold">Pashmore Admin</p>
          <h1 className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">Keyword Intelligence</h1>
          <p className="mt-2 max-w-2xl text-sm text-mocha">
            {report.stats.total.toLocaleString('en-IN')} keywords ({report.stats.seed} seed, {report.stats.generated}{' '}
            generated), {report.stats.rejected} combinations discarded as not stocked or off-positioning,{' '}
            {report.clusters.length} clusters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => download(`pashmore-keywords-${stamp}.csv`, toCsv(filtered), 'text/csv;charset=utf-8')}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              download(
                `pashmore-keywords-${stamp}.xlsx`,
                toXlsx(exportInput).slice().buffer,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              download(
                `pashmore-keywords-${stamp}.json`,
                toJson(filtered, { generatedAt: report.generatedAt, metricsSource: report.metricsSource }),
                'application/json',
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => printHtml(toPrintHtml(exportInput))} title="Opens the print dialog — choose “Save as PDF”">
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </header>

      <div
        role="note"
        className={cn(
          'mt-6 border px-4 py-3 text-sm',
          report.stats.withMetrics === 0 ? 'border-gold/40 bg-gold-pale/40 text-brown' : 'border-line bg-cream text-mocha',
        )}
      >
        {report.stats.withMetrics === 0 ? (
          <>
            <strong className="font-medium">No market data yet.</strong> Search volume, CPC, competition, difficulty and
            trend show as <em>unavailable</em> — nothing is estimated. Scores are <em>estimated</em> from intent, catalogue
            relevance and conversion potential only. Import a Keyword Planner or Search Console export under{' '}
            <button type="button" className="underline underline-offset-2" onClick={() => setTab('metrics')}>
              Metrics
            </button>{' '}
            to score demand.
          </>
        ) : (
          <>
            Metrics from <strong className="font-medium">{report.metricsSource}</strong> cover{' '}
            {report.stats.withMetrics.toLocaleString('en-IN')} of {report.stats.total.toLocaleString('en-IN')} keywords. The
            rest stay estimated.
          </>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(ACTION_LABEL) as PageAction[]).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => {
              setTab('keywords')
              setFilters((f) => ({ ...f, action: f.action === action ? '' : action }))
            }}
            className={cn('bg-ivory px-4 py-3 text-left transition-colors hover:bg-cream', filters.action === action && 'bg-cream')}
          >
            <dt className="text-[0.6875rem] uppercase tracking-[0.14em] text-mocha">{ACTION_LABEL[action]}</dt>
            <dd className="mt-1 font-serif text-2xl text-charcoal">{counts.byAction.get(action) ?? 0}</dd>
          </button>
        ))}
      </dl>

      <div role="tablist" aria-label="Report sections" className="mt-8 flex gap-6 overflow-x-auto border-b border-line">
        {(
          [
            ['keywords', `Keywords (${filtered.length})`],
            ['clusters', `Clusters (${report.clusters.length})`],
            ['cannibalization', `Cannibalization (${report.issues.length})`],
            ['metrics', 'Metrics'],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              '-mb-px shrink-0 border-b-2 pb-3 text-xs uppercase tracking-[0.16em] transition-colors',
              tab === id ? 'border-charcoal text-charcoal' : 'border-transparent text-mocha hover:text-charcoal',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'keywords' && (
        <section className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="relative sm:col-span-2 lg:col-span-1">
              <span className="sr-only">Search keywords</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search keyword or URL" className="pl-9" />
            </label>
            {(Object.keys(filters) as Array<keyof typeof filters>).map((key) => (
              <label key={key} className="block">
                <span className="sr-only">{key}</span>
                <select
                  value={filters[key]}
                  onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                  className="h-11 w-full border border-line-strong bg-transparent px-3 text-sm text-charcoal focus:border-charcoal focus:outline-none"
                >
                  <option value="">All {key === 'funnel' ? 'funnel stages' : `${key}s`.replace('ys', 'ies')}</option>
                  {options[key].map((value) => (
                    <option key={value} value={value}>
                      {key === 'action'
                        ? ACTION_LABEL[value as PageAction]
                        : key === 'priority'
                          ? PRIORITY_LABEL[value as Priority]
                          : value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-mocha">
            <span aria-live="polite">
              {filtered.length.toLocaleString('en-IN')} keywords · exports include the current filter
            </span>
            <button
              type="button"
              className="underline underline-offset-2 hover:text-charcoal"
              onClick={() => {
                setQuery('')
                setFilters({ category: '', cluster: '', intent: '', funnel: '', action: '', priority: '', country: '', origin: '' })
              }}
            >
              Reset filters
            </button>
          </div>

          <div className="mt-3 overflow-x-auto border border-line">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-ivory-deep text-[0.6875rem] uppercase tracking-[0.12em] text-mocha">
                <tr>
                  <SortHeader label="Keyword" active={sort.key === 'keyword'} dir={sort.dir} onClick={() => toggleSort('keyword')} />
                  <th className="px-3 py-2.5 font-normal">Cluster</th>
                  <th className="px-3 py-2.5 font-normal">Intent</th>
                  <SortHeader label="Volume" active={sort.key === 'searchVolume'} dir={sort.dir} onClick={() => toggleSort('searchVolume')} />
                  <th className="px-3 py-2.5 font-normal">CPC ₹</th>
                  <th className="px-3 py-2.5 font-normal">KD</th>
                  <SortHeader label="Fit" active={sort.key === 'relevance'} dir={sort.dir} onClick={() => toggleSort('relevance')} />
                  <SortHeader label="Score" active={sort.key === 'opportunityScore'} dir={sort.dir} onClick={() => toggleSort('opportunityScore')} />
                  <th className="px-3 py-2.5 font-normal">Action</th>
                  <th className="px-3 py-2.5 font-normal">Recommended page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.map((r) => (
                  <tr key={r.keyword} className="align-top hover:bg-cream/50">
                    <td className="max-w-[280px] px-3 py-2.5">
                      <div className="text-charcoal">
                        {r.keyword}
                        {r.claimSensitive && (
                          <span className="ml-1.5 text-[0.625rem] uppercase tracking-wider text-burgundy" title="Needs documentation before use in copy">
                            claim
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-taupe">
                        {r.category}
                        {r.origin === 'generated' && ' · generated'}
                        {r.country !== 'IN' && ` · ${r.country}`}
                      </div>
                      {r.notes.length > 0 && (
                        <details className="mt-1 text-xs text-mocha">
                          <summary className="cursor-pointer text-taupe hover:text-charcoal">Notes ({r.notes.length})</summary>
                          <ul className="mt-1 list-disc space-y-1 pl-4">
                            {r.notes.map((note) => (
                              <li key={note}>{note}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-mocha">{r.cluster}</td>
                    <td className="px-3 py-2.5 text-xs text-mocha">
                      {r.intent}
                      <div className="text-taupe">{r.funnelStage}</div>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-mocha">{fmt(r.metrics.searchVolume)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-mocha">{fmt(r.metrics.cpc, 2)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-mocha">{fmt(r.metrics.seoDifficulty)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-mocha">{Math.round(r.relevance * 100)}%</td>
                    <td className="px-3 py-2.5">
                      <div className="tabular-nums text-charcoal">
                        {r.opportunityScore}
                        {r.scoreBasis !== 'measured' && (
                          <span className="text-taupe" title={`Score basis: ${r.scoreBasis}`}>
                            *
                          </span>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-xs text-mocha">{PRIORITY_LABEL[r.priority]}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn('inline-block whitespace-nowrap px-2 py-0.5 text-xs', ACTION_TONE[r.action])}>
                        {ACTION_LABEL[r.action]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {r.recommendedPage ? (
                        <span className="break-all text-charcoal">{r.recommendedPage}</span>
                      ) : (
                        <span className="text-taupe">—</span>
                      )}
                      <div className="text-taupe">{r.recommendedContentType !== 'none' && r.recommendedContentType}</div>
                    </td>
                  </tr>
                ))}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-3 py-10 text-center text-mocha">
                      No keywords match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-mocha">
            <span>* Estimated or partial score — see the note above.</span>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span className="tabular-nums">
                {page + 1} / {pageCount}
              </span>
              <Button size="sm" variant="ghost" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {tab === 'clusters' && (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {report.clusters.map((cluster) => (
            <article key={cluster.id} className="border border-line bg-ivory p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-charcoal">{cluster.name}</h2>
                  <p className="mt-1 text-xs text-mocha">
                    Primary: <strong className="font-medium text-charcoal">{cluster.primaryKeyword}</strong> · {cluster.keywordCount}{' '}
                    keywords · {cluster.intent}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl tabular-nums text-charcoal">{cluster.topScore}</div>
                  <div className="text-[0.625rem] uppercase tracking-wider text-taupe">top score</div>
                </div>
              </div>
              <p className="mt-3 text-sm">
                <span className={cn('mr-2 inline-block px-2 py-0.5 text-xs', ACTION_TONE[cluster.action])}>{ACTION_LABEL[cluster.action]}</span>
                <span className="break-all text-charcoal">{cluster.targetUrl ?? '—'}</span>
              </p>
              {cluster.notes.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-mocha">
                  {cluster.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
              <ClusterList label="Secondary" items={cluster.secondary} />
              <ClusterList label="Questions" items={cluster.questions} />
              <ClusterList label="Related" items={cluster.related} />
              <button
                type="button"
                className="mt-4 text-xs uppercase tracking-[0.14em] text-gold hover:text-charcoal"
                onClick={() => {
                  setFilters((f) => ({ ...f, cluster: cluster.id }))
                  setTab('keywords')
                }}
              >
                View all keywords →
              </button>
            </article>
          ))}
        </section>
      )}

      {tab === 'cannibalization' && (
        <section className="mt-6 space-y-3">
          <p className="text-sm text-mocha">
            <strong className="font-medium text-charcoal">Conflict</strong>: pages competing for the same search with the same
            intent — pick one URL. <strong className="font-medium text-charcoal">Watch</strong>: overlap that is fine while each
            page stays clearly different.
          </p>
          {report.issues.length === 0 && <p className="text-sm text-mocha">No overlapping pages found.</p>}
          {report.issues.map((issue) => (
            <article
              key={`${issue.reason}-${issue.urls.join()}`}
              className={cn('border-l-2 bg-ivory px-4 py-3', issue.severity === 'conflict' ? 'border-burgundy' : 'border-gold')}
            >
              <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] uppercase tracking-[0.14em]">
                <span className={issue.severity === 'conflict' ? 'text-burgundy' : 'text-gold'}>{issue.severity}</span>
                <span className="text-taupe">·</span>
                <span className="text-mocha">{issue.recommendation}</span>
              </div>
              <p className="mt-1 text-sm text-charcoal">{issue.reason}</p>
              <p className="mt-1 break-all text-xs text-mocha">{issue.urls.join('  ·  ')}</p>
              <p className="mt-2 text-xs text-mocha">{issue.detail}</p>
            </article>
          ))}
        </section>
      )}

      {tab === 'metrics' && (
        <section className="mt-6 max-w-3xl space-y-5 text-sm text-mocha">
          <p>
            Import real data to replace “unavailable” and turn estimated scores into measured ones. Supported: Google Keyword
            Planner export (CSV/TSV, including its UTF-16 format), Google Search Console, and Ahrefs / Semrush / DataForSEO CSVs.
            The file needs a <strong className="font-medium text-charcoal">Keyword</strong> column and any of: Avg. monthly
            searches / Search volume, CPC / Top of page bid, Competition (indexed value), Keyword difficulty / KD, Trend.
          </p>
          <p>
            Ranges such as “1K – 10K” and text such as “High” are skipped, not converted — a range is not a number. Imported data
            stays in this browser; to share it with the team, paste it into <code className="text-charcoal">src/data/keyword-metrics.json</code>.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 bg-charcoal px-5 text-[0.75rem] uppercase tracking-[0.14em] text-ivory hover:bg-ink">
              <FileUp className="h-4 w-4" /> Import metrics file
              <input
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleImport(file)
                  e.target.value = ''
                }}
              />
            </label>
            {stored && (
              <Button size="md" variant="ghost" onClick={clearImported}>
                <Trash2 className="h-4 w-4" /> Clear imported metrics
              </Button>
            )}
          </div>

          {importError && <p className="text-burgundy" role="alert">{importError}</p>}
          {importStatus && importStatus.imported > 0 && (
            <p role="status" className="text-charcoal">
              Imported metrics for {importStatus.imported} of {importStatus.rows} rows.
              {importStatus.skippedValues > 0 && ` ${importStatus.skippedValues} non-numeric values (ranges or text) skipped.`}
              {importStatus.missingColumns.length > 0 && ` Columns not in this file: ${importStatus.missingColumns.join(', ')}.`}
            </p>
          )}
          {stored && (
            <p>
              Active import: <strong className="font-medium text-charcoal">{stored.source}</strong> ·{' '}
              {Object.keys(stored.metrics).length} keywords · {new Date(stored.importedAt).toLocaleString('en-IN')}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

function SortHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: 1 | -1; onClick: () => void }) {
  return (
    <th className="px-3 py-2.5 font-normal" aria-sort={active ? (dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={onClick} className={cn('uppercase tracking-[0.12em] hover:text-charcoal', active && 'text-charcoal')}>
        {label} {active ? (dir === 1 ? '↑' : '↓') : ''}
      </button>
    </th>
  )
}

function ClusterList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="mt-3">
      <h3 className="text-[0.625rem] uppercase tracking-[0.16em] text-taupe">{label}</h3>
      <p className="mt-1 text-xs leading-relaxed text-charcoal">{items.join(' · ')}</p>
    </div>
  )
}

import type { Metadata } from 'next'

import { KeywordDashboard } from '@/components/admin/keyword-dashboard'
import { getKeywordReport } from '@/services/keywords'

export const metadata: Metadata = {
  title: { absolute: 'Keyword Intelligence | Pashmore Admin' },
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default async function KeywordsAdminPage() {
  const report = await getKeywordReport()
  return <KeywordDashboard report={report} />
}

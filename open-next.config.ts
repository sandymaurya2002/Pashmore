import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue'

/**
 * OpenNext on the existing `pashmore` Worker.
 *
 * - Incremental cache: existing R2 bucket `pashmore-opennext-cache`
 *   (binding `NEXT_INC_CACHE_R2_BUCKET`).
 * - Queue: in-isolate memory queue + `WORKER_SELF_REFERENCE`. This replaces the
 *   Dummy queue that threw `Dummy queue is not implemented` / failed stale
 *   revalidation. It does not create a new Durable Object (paid resource).
 *
 * Prefer Durable Object queue (`do-queue`) after approval — see wrangler.jsonc
 * comments. Time-based ISR on the root layout was removed so queue traffic is
 * limited to any remaining revalidate intervals.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: memoryQueue,
})

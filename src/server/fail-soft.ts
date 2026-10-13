/**
 * For secondary page sections (rails, related products, recommendations):
 * an API failure is logged and the section renders empty instead of taking
 * the whole page down. Primary content must not use this — it should throw so
 * the route's error boundary reports the outage honestly.
 */
export async function failSoft<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise
  } catch (error) {
    console.error(`[${label}]`, (error as Error)?.message ?? error)
    return fallback
  }
}

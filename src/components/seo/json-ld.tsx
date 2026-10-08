/**
 * Renders a JSON-LD graph. Server-rendered so the markup is present in the
 * initial HTML for crawlers that do not execute JavaScript.
 */
export function JsonLd({ id, data }: { id: string; data: string }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      // `data` is produced by JSON.stringify in lib/jsonld, so it is already
      // escaped JSON; the only remaining risk is a literal `</script>` inside a
      // string value, which we neutralise here.
      dangerouslySetInnerHTML={{ __html: data.replace(/</g, '\\u003c') }}
    />
  )
}

'use client'

/**
 * Replaces the root layout when the layout itself fails, so it must render its
 * own <html> and <body> and cannot rely on the design system.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#faf7f2',
          color: '#1f1d1a',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#b08d4f',
            margin: 0,
          }}
        >
          Pashmore
        </p>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 400, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: '28rem', margin: 0, color: '#7d6b56', lineHeight: 1.7 }}>
          We could not load the page. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '0.875rem 2rem',
            border: 'none',
            backgroundColor: '#1f1d1a',
            color: '#faf7f2',
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: '#a2917a', margin: 0 }}>
            Reference: {error.digest}
          </p>
        )}
      </body>
    </html>
  )
}

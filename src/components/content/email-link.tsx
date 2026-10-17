import { Fragment, type ReactNode } from 'react'

const EMAIL = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Cloudflare Email Obfuscation rewrites any address it finds into a link to
 * /cdn-cgi/l/email-protection. Crawlers request that URL without the fragment
 * and record a 404. The email_off markers are Cloudflare's opt-out, so the
 * published link stays a real mailto.
 */
export function EmailLink({
  email,
  className,
  children,
}: {
  email: string
  className?: string
  children?: ReactNode
}) {
  const label = typeof children === 'string' || children == null ? (children ?? email) : null
  if (label == null) {
    return (
      <a href={`mailto:${email}`} className={className}>
        {children}
      </a>
    )
  }

  const classAttr = className ? ` class="${escapeHtml(className)}"` : ''
  const html = `<!--email_off--><a href="mailto:${escapeHtml(email)}"${classAttr}>${escapeHtml(label)}</a><!--/email_off-->`
  return <span className="contents" dangerouslySetInnerHTML={{ __html: html }} />
}

/** Turns email addresses inside a sentence into real mailto links. */
export function TextWithEmails({ text, linkClassName }: { text: string; linkClassName?: string }) {
  const parts: string[] = []
  let rest = text
  let match = EMAIL.exec(rest)
  while (match) {
    parts.push(rest.slice(0, match.index), match[1])
    rest = rest.slice(match.index + match[0].length)
    match = EMAIL.exec(rest)
  }
  parts.push(rest)
  if (parts.length === 1) return text

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <EmailLink key={`${index}-${part}`} email={part} className={linkClassName}>
        {part}
      </EmailLink>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}

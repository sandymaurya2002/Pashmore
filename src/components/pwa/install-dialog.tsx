'use client'

import * as React from 'react'
import Image from 'next/image'
import { Check, Compass, Copy, Share, SquarePlus, Zap, Smartphone, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { closeInstallDialog, promptInstall, usePwa, type InstallPlatform } from '@/lib/pwa'

const DESKTOP_QUERY = '(min-width: 768px)'

/**
 * The install experience: a bottom sheet on phones, a centred card elsewhere.
 * Chromium browsers get a one-tap install button; iPhone and iPad get the
 * Share → Add to Home Screen walkthrough Safari requires.
 */
export function InstallDialog() {
  const { dialogOpen, platform, installed } = usePwa()
  // Client-only component (loaded with ssr: false), so the query can be read
  // synchronously and the sheet never flashes in the wrong layout.
  const [desktop, setDesktop] = React.useState(() => window.matchMedia(DESKTOP_QUERY).matches)
  React.useEffect(() => {
    const list = window.matchMedia(DESKTOP_QUERY)
    const onChange = (event: MediaQueryListEvent) => setDesktop(event.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [])

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeInstallDialog()}>
      <DialogContent
        side={desktop ? 'center' : 'bottom'}
        className="mx-auto max-w-[28rem] overflow-y-auto overscroll-contain"
        closeLabel="Close install instructions"
      >
        <Header />
        <div className="px-6 pb-7 pt-1 sm:px-8 sm:pb-8">
          {installed ? <Installed /> : <Body platform={platform} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Header() {
  return (
    <div className="flex flex-col items-center border-b border-line bg-cream/60 px-6 pb-7 pt-9 text-center sm:px-8">
      <span className="flex h-20 w-20 items-center justify-center rounded-[22px] border border-line bg-white shadow-[0_12px_32px_-16px_rgba(18,17,15,0.35)]">
        <Image src="/icon-192.png" alt="" width={64} height={64} sizes="64px" className="h-16 w-16" />
      </span>
      <p className="eyebrow mt-5 text-gold">The Pashmore App</p>
      <DialogTitle className="mt-2 font-serif text-[1.75rem] font-normal leading-tight text-charcoal">
        Install Pashmore
      </DialogTitle>
      <DialogDescription className="mt-2 max-w-[20rem] text-sm leading-relaxed text-mocha">
        Our collections on your home screen — straight from our website, no app store required.
      </DialogDescription>
    </div>
  )
}

const BENEFITS = [
  { icon: Zap, label: 'Opens instantly, full screen' },
  { icon: Smartphone, label: 'One tap from your home screen' },
  { icon: Sparkles, label: 'Same bag, wishlist and account' },
]

function Body({ platform }: { platform: InstallPlatform }) {
  switch (platform) {
    case 'prompt':
      return <PromptInstall />
    case 'ios':
      return <IosSteps inSafari />
    case 'ios-other-browser':
      return <IosSteps inSafari={false} />
    case 'mac-safari':
      return (
        <Steps
          steps={[
            { icon: Compass, title: 'Open Pashmore.com in Safari', detail: 'You are already here.' },
            { icon: Share, title: 'Open the File menu', detail: 'Or tap the Share icon in the toolbar.' },
            { icon: SquarePlus, title: 'Choose “Add to Dock”', detail: 'Then click Add.' },
          ]}
        />
      )
    default:
      return (
        <p className="pt-5 text-center text-sm leading-relaxed text-mocha">
          To install Pashmore, open <strong className="font-medium text-charcoal">pashmore.com</strong> in
          Chrome or Edge on Android or desktop, or in Safari on iPhone and iPad.
        </p>
      )
  }
}

function PromptInstall() {
  const [busy, setBusy] = React.useState(false)
  return (
    <>
      <ul className="flex flex-col gap-3.5 py-6">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3.5 text-sm text-charcoal/90">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-pale/60 text-gold">
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            </span>
            {label}
          </li>
        ))}
      </ul>
      <Button
        size="lg"
        className="w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await promptInstall()
          } finally {
            setBusy(false)
          }
        }}
      >
        Install Pashmore App
      </Button>
      <p className="mt-3 text-center text-xs text-taupe">Free · Takes a few seconds · Uses almost no storage</p>
    </>
  )
}

function IosSteps({ inSafari }: { inSafari: boolean }) {
  return (
    <>
      {!inSafari && (
        <div className="mt-5 border border-gold/40 bg-gold-pale/25 px-4 py-3 text-xs leading-relaxed text-brown">
          iPhone and iPad can only add websites to the home screen from Safari. Copy the link below and
          open it in Safari to continue.
          <CopyLink />
        </div>
      )}
      <Steps
        steps={[
          {
            icon: Compass,
            title: 'Open Pashmore.com in Safari',
            detail: inSafari ? 'You are already in Safari.' : 'Paste the link into Safari’s address bar.',
          },
          {
            icon: Share,
            title: 'Tap the Share icon',
            detail: 'At the bottom of the screen on iPhone, top right on iPad.',
          },
          {
            icon: SquarePlus,
            title: 'Select “Add to Home Screen”',
            detail: 'Scroll down the share menu if you don’t see it.',
          },
          { icon: Check, title: 'Tap “Add”', detail: 'Pashmore appears on your home screen.' },
        ]}
      />
      <HomeScreenPreview />
    </>
  )
}

function Steps({
  steps,
}: {
  steps: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; detail: string }[]
}) {
  return (
    <ol className="flex flex-col gap-1 pt-5">
      {steps.map(({ icon: Icon, title, detail }, index) => (
        <li key={title} className="flex items-start gap-4 py-2.5">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-line bg-white text-[#0a84ff] shadow-sm">
            <Icon className="h-5 w-5" strokeWidth={1.6} />
            <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-charcoal text-[0.625rem] font-medium text-ivory">
              {index + 1}
            </span>
          </span>
          <span className="min-w-0 pt-0.5">
            <span className="block text-sm font-medium text-charcoal">{title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-mocha">{detail}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/** A miniature home screen, so customers know what to look for afterwards. */
function HomeScreenPreview() {
  return (
    <div className="mt-5 flex items-center justify-center gap-5 rounded-[18px] bg-gradient-to-br from-[#3b2f26] via-[#5c2233] to-[#1f1d1a] px-6 py-5">
      {[0, 1].map((slot) => (
        <span key={`l${slot}`} aria-hidden className="h-12 w-12 rounded-[12px] bg-ivory/15" />
      ))}
      <span className="flex flex-col items-center gap-1.5">
        <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-ivory shadow-lg ring-2 ring-gold-soft/70">
          <Image src="/icon-192.png" alt="" width={40} height={40} sizes="40px" className="h-10 w-10" />
        </span>
        <span className="text-[0.625rem] text-ivory">Pashmore</span>
      </span>
      <span aria-hidden className="h-12 w-12 rounded-[12px] bg-ivory/15" />
    </div>
  )
}

function CopyLink() {
  const [copied, setCopied] = React.useState(false)
  const url = typeof window === 'undefined' ? '' : window.location.origin
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2500)
        } catch {
          window.prompt('Copy this link and open it in Safari:', url)
        }
      }}
      className="mt-2.5 flex w-full items-center justify-between gap-3 border border-line-strong bg-white px-3 py-2.5 text-left text-xs text-charcoal"
    >
      <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
      <span className="flex shrink-0 items-center gap-1.5 uppercase tracking-[0.12em] text-gold">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  )
}

function Installed() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-pale/60 text-gold">
        <Check className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-4 font-serif text-xl text-charcoal">Pashmore is installed</p>
      <p className="mt-1.5 text-sm text-mocha">Find it on your home screen or in your apps.</p>
      <Button variant="outline" className="mt-6" onClick={closeInstallDialog}>
        Continue shopping
      </Button>
    </div>
  )
}

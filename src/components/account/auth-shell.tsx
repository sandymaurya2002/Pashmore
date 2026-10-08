import Image from 'next/image'

/**
 * Split layout shared by sign in, register and password reset. The image is
 * decorative and hidden from assistive technology.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-[80dvh] lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-16 md:px-12">
        <div className="w-full max-w-md">
          <p className="eyebrow text-gold">{eyebrow}</p>
          <h1 className="mt-5 font-serif text-[2rem] leading-[1.08] text-charcoal md:text-[2.5rem]">
            {title}
          </h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-mocha">{description}</p>
          {children}
        </div>
      </div>

      <div className="relative hidden lg:block">
        <Image
          src="/images/editorial/editorial-atelier.png"
          alt=""
          aria-hidden
          fill
          sizes="50vw"
          className="object-cover"
        />
        <span aria-hidden className="absolute inset-0 bg-ink/15" />
      </div>
    </div>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { blogCategoryBySlug } from '@/data/blog'
import { formatDate } from '@/lib/utils'
import type { BlogPost } from '@/types'

export function PostMeta({ post }: { post: BlogPost }) {
  const category = blogCategoryBySlug.get(post.category)
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.625rem] uppercase tracking-[0.16em] text-taupe">
      {category && <span className="text-gold">{category.name}</span>}
      <span aria-hidden>·</span>
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{post.readingMinutes} min read</span>
    </p>
  )
}

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <article>
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="relative aspect-3/2 overflow-hidden bg-ivory-deep">
          <Image
            src={post.cover.url}
            alt={post.cover.alt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
          />
        </div>
        <div className="pt-5">
          <PostMeta post={post} />
          <h3 className="mt-3 font-serif text-xl leading-snug text-charcoal transition-colors duration-300 group-hover:text-gold">
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-mocha">
            {post.excerpt}
          </p>
        </div>
      </Link>
    </article>
  )
}

import type { NavItem } from '@/data/navigation'
import type { HomeSection, HomeSectionItem } from '@/server/content'

/** The admin's text when it is set, otherwise the built-in copy. */
export function text(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback
}

/** Paragraphs entered in the admin, separated by a blank line. */
export function paragraphs(value: string | undefined, fallback: string[]): string[] {
  const list = (value ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  return list.length ? list : fallback
}

/**
 * The admin's list when it has entries, otherwise the built-in one. Each entry
 * is merged over the built-in entry at the same position, so a field left
 * empty keeps its original text.
 */
export function listItems<T>(
  section: HomeSection | undefined,
  defaults: T[],
  merge: (item: HomeSectionItem, fallback: T | undefined) => T | null,
): T[] {
  const list = section?.items ?? []
  if (!list.length) return defaults
  const merged = list
    .map((item, index) => merge(item, defaults[index]))
    .filter((item): item is T => item !== null)
  return merged.length ? merged : defaults
}

/** The desktop menu with each menu's feature card overridden by the admin's card for it. */
export function withMenuFeatures(nav: NavItem[], section: HomeSection | undefined): NavItem[] {
  if (!section?.isActive || !section.items?.length) return nav
  return nav.map((item) => {
    const card = section.items?.find((entry) => entry.key === item.label)
    if (!card || !item.feature) return item
    const { feature } = item
    return {
      ...item,
      feature: {
        eyebrow: text(card.eyebrow, feature.eyebrow),
        heading: text(card.heading, feature.heading),
        href: card.href ?? feature.href,
        ctaLabel: text(card.linkLabel, feature.ctaLabel),
        image: card.imageUrl
          ? { ...feature.image, url: card.imageUrl, alt: text(card.imageAlt, feature.image.alt) }
          : { ...feature.image, alt: text(card.imageAlt, feature.image.alt) },
      },
    }
  })
}

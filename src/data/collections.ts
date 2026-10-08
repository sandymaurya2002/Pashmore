import type { Collection, CollectionGroup, ProductFaq } from '@/types'

interface CollectionSeed {
  slug: string
  name: string
  heading?: string
  description: string
  group: CollectionGroup
  /** Banner file under /images/banners; defaults to the collection slug. */
  banner?: string
  bannerAlt?: string
  includeCategorySlugs?: string[]
  relatedSlugs: string[]
  seoContent?: string[]
  faqs?: ProductFaq[]
  featured?: boolean
  hidden?: boolean
}

const BANNER_WIDTH = 1800
const BANNER_HEIGHT = 620

function build(seed: CollectionSeed): Collection {
  return {
    slug: seed.slug,
    name: seed.name,
    heading: seed.heading,
    description: seed.description,
    seoContent: seed.seoContent,
    group: seed.group,
    bannerImage: {
      url: `/images/banners/${seed.banner ?? seed.slug}.png`,
      alt:
        seed.bannerAlt ??
        `Pashmore ${seed.name.toLowerCase()} collection — handcrafted Indian textiles`,
      width: BANNER_WIDTH,
      height: BANNER_HEIGHT,
    },
    includeCategorySlugs: seed.includeCategorySlugs,
    relatedSlugs: seed.relatedSlugs,
    faqs: seed.faqs,
    featured: seed.featured,
    hidden: seed.hidden,
  }
}

const SEEDS: CollectionSeed[] = [
  /* ---------------------------------------------------------------- *
   * Women
   * ---------------------------------------------------------------- */
  {
    slug: 'womens-shawls',
    name: "Women's Shawls",
    heading: "Women's Shawls",
    description:
      'Handwoven shawls for women in pure Pashmina, cashmere and fine Kashmiri wool — from undyed heritage pieces to fully embroidered occasion shawls.',
    group: 'women',
    featured: true,
    relatedSlugs: ['womens-pashmina', 'womens-stoles', 'kashmiri-collection', 'wedding-collection'],
    seoContent: [
      'A shawl is the most useful thing in an Indian wardrobe and the hardest to buy well. What separates one shawl from another is not the pattern but the fibre and the loom: the micron count of the pashm, whether it was spun on a charkha or by machine, and how many picks per inch the weaver was willing to work at.',
      'Our women’s shawls are made in three weights. Pure Pashmina at around 180 grams for occasion and evening; cashmere at 250–320 grams for daily winter wear; and Kashmiri handloom wool above 400 grams for genuine cold. Every piece is finished by hand and ships with a certificate recording the weaver’s name.',
      'If you are buying your first, start with an undyed piece — the Ivory Heritage or the Warm Beige Ring Pashmina. Undyed cloth hides nothing, so it is the honest way to judge quality, and neutrals outlast every trend.',
    ],
    faqs: [
      {
        question: 'What is the difference between a shawl and a stole?',
        answer:
          'Width. A shawl is roughly 100–110 cm wide and is meant to wrap; a stole is 70 cm or narrower and is meant to hang. Both are typically 200–220 cm long.',
      },
      {
        question: 'Which shawl is warmest?',
        answer:
          'Kashmiri handloom wool is the warmest by weight, followed by brushed cashmere. Pure Pashmina is the warmest relative to its weight — it is remarkably light for how much heat it holds.',
      },
      {
        question: 'How should I store a shawl between seasons?',
        answer:
          'Folded flat in a breathable cotton or muslin bag, never on a hanger, with a cedar block nearby. Refold along a different line each year so permanent creases do not set.',
      },
    ],
  },
  {
    slug: 'womens-pashmina',
    name: "Women's Pashmina",
    heading: "Women's Pure Pashmina",
    description:
      'Certified pure Pashmina for women — hand-combed Changthangi fibre, charkha-spun and handwoven in Kashmir.',
    group: 'women',
    featured: true,
    relatedSlugs: ['pure-pashmina', 'womens-shawls', 'pashmina', 'luxury-collection'],
    seoContent: [
      'Pashmina is not a style of shawl. It is a fibre: the winter underfleece of the Changthangi goat, combed by hand each spring on the Changthang plateau at over 4,000 metres. At 12–15 microns it is roughly half the diameter of fine merino, which is why a Pashmina shawl can weigh under 200 grams and still keep you warm.',
      'Everything in this collection is pure pashm — no blending, no substitution. Each piece is spun on a hand charkha, woven on a wooden handloom and finished by hand, and ships with documentation recording the fibre grade and the weaver.',
    ],
  },
  {
    slug: 'womens-stoles',
    name: "Women's Stoles",
    description:
      'Lightweight stoles that layer across seasons — cashmere, Pashmina and handloom wool, cut narrow to drape.',
    group: 'women',
    relatedSlugs: ['stoles', 'womens-scarves', 'womens-shawls'],
  },
  {
    slug: 'womens-scarves',
    name: "Women's Scarves",
    description:
      'Fine scarves in Pashmina-silk blends, cashmere and brushed merino — the easiest way into handwoven Indian cloth.',
    group: 'women',
    relatedSlugs: ['scarves', 'womens-stoles', 'gifts-for-her'],
  },
  {
    slug: 'womens-dupattas',
    name: 'Dupattas',
    heading: 'Hand-Embroidered Dupattas',
    description:
      'Dupattas in Banarasi silk, cotton silk and Kashmiri embroidery — for occasion dressing and everyday ethnic wear.',
    group: 'women',
    relatedSlugs: ['womens-suits', 'wedding-collection', 'kashmiri-collection'],
    seoContent: [
      'The dupatta carries more design weight than anything else in an Indian outfit — it is the piece people actually look at. Ours are made in three traditions: Kashmiri tilla and sozni from Srinagar, chikankari from Lucknow, and figured zari silk from Varanasi.',
      'A dupatta is typically 90 cm × 230 cm. Occasion pieces are heavier and hold a pleat; everyday cotton silk is lighter and moves more.',
    ],
  },
  {
    slug: 'womens-dresses',
    name: "Women's Dresses",
    description:
      'Modern ethnic silhouettes cut from handwoven Indian cloth. New pieces arriving this season.',
    group: 'women',
    relatedSlugs: ['womens-suits', 'womens-shawls'],
  },
  {
    slug: 'womens-suits',
    name: "Women's Suits",
    description:
      'Tailored suit sets in handloom cotton silk and fine wool, made to be worn with a Pashmore dupatta.',
    group: 'women',
    relatedSlugs: ['womens-dupattas', 'womens-dresses'],
  },

  /* ---------------------------------------------------------------- *
   * Men
   * ---------------------------------------------------------------- */
  {
    slug: 'mens-shawls',
    name: "Men's Shawls",
    heading: "Men's Shawls",
    description:
      'Men’s shawls in pure Pashmina and Kashmiri handloom wool, cut long and narrow to hang cleanly from the shoulder.',
    group: 'men',
    featured: true,
    relatedSlugs: ['mens-stoles', 'mens-jackets', 'gifts-for-him', 'pure-pashmina'],
    seoContent: [
      'A men’s shawl is cut differently from a women’s: more length, less width, so it falls in two straight columns rather than wrapping. Traditionally it is worn over a bandhgala or kurta, folded once lengthwise and draped over one shoulder.',
      'We make them in two weights. Pure Pashmina for evening and occasion, where lightness matters more than bulk; and Kashmiri handloom wool at 400 grams and above for genuine winter, brushed twice so it softens with wear rather than wearing out.',
    ],
    faqs: [
      {
        question: 'What length should a men’s shawl be?',
        answer:
          'A 110 × 220 cm shawl suits most men. Anything shorter tends to sit awkwardly when folded lengthwise over the shoulder.',
      },
      {
        question: 'Can a men’s shawl be worn with western tailoring?',
        answer:
          'Yes — worn as an oversized scarf over an overcoat it works well. For that use, a narrower stole is usually easier to manage.',
      },
    ],
  },
  {
    slug: 'mens-stoles',
    name: "Men's Stoles",
    description:
      'Narrow-cut stoles in cashmere and Pashmina, finished without fringe so they sit flat under a coat collar.',
    group: 'men',
    relatedSlugs: ['stoles', 'mens-scarves', 'mens-shawls'],
  },
  {
    slug: 'mens-scarves',
    name: "Men's Scarves",
    description:
      'Everyday luxury scarves in merino wool and cashmere — hard-wearing, unfussy and easy to give.',
    group: 'men',
    relatedSlugs: ['scarves', 'mens-stoles', 'gifts-for-him'],
  },
  {
    slug: 'mens-jackets',
    name: "Men's Jackets",
    description:
      'Nehru jackets and unstructured outerwear cut from handloom wool, with hand-worked buttonholes.',
    group: 'men',
    relatedSlugs: ['mens-shawls', 'heritage-collection', 'wedding-collection'],
  },
  {
    slug: 'mens-accessories',
    name: "Men's Accessories",
    description:
      'Pocket squares, mufflers and the small pieces that finish an outfit.',
    group: 'men',
    relatedSlugs: ['accessories', 'gifts-for-him', 'corporate-gifts'],
  },

  /* ---------------------------------------------------------------- *
   * Aggregate categories
   * ---------------------------------------------------------------- */
  {
    slug: 'shawls',
    name: 'Shawls',
    description:
      'Every Pashmore shawl, for women and men — Pashmina, cashmere and Kashmiri handloom wool.',
    group: 'category',
    includeCategorySlugs: ['womens-shawls', 'mens-shawls', 'womens-pashmina'],
    relatedSlugs: ['womens-shawls', 'mens-shawls', 'pashmina', 'stoles'],
  },
  {
    slug: 'stoles',
    name: 'Stoles',
    description:
      'Narrow-cut stoles across the collection, in Pashmina, cashmere and handloom wool.',
    group: 'category',
    includeCategorySlugs: ['womens-stoles', 'mens-stoles'],
    relatedSlugs: ['shawls', 'scarves', 'womens-stoles', 'mens-stoles'],
  },
  {
    slug: 'scarves',
    name: 'Scarves',
    description:
      'Fine scarves in merino, cashmere and Pashmina-silk blends for women and men.',
    group: 'category',
    includeCategorySlugs: ['womens-scarves', 'mens-scarves'],
    relatedSlugs: ['stoles', 'womens-scarves', 'mens-scarves'],
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    description:
      'Pocket squares, boxed sets and the finishing pieces of the collection.',
    group: 'category',
    includeCategorySlugs: ['mens-accessories'],
    relatedSlugs: ['mens-accessories', 'gifting'],
  },
  {
    slug: 'gift-sets',
    name: 'Gift Sets',
    banner: 'gifting',
    description:
      'Curated sets presented in Pashmore’s hand-bound boxes with a craft certificate for every piece.',
    group: 'gifting',
    relatedSlugs: ['gifting', 'luxury-gift-boxes', 'wedding-gifts'],
  },

  /* ---------------------------------------------------------------- *
   * Merchandising collections
   * ---------------------------------------------------------------- */
  {
    slug: 'new-arrivals',
    name: 'New Arrivals',
    description:
      'The latest pieces to come off our looms — fresh expressions of timeless craftsmanship.',
    group: 'collections',
    featured: true,
    relatedSlugs: ['best-sellers', 'pure-pashmina', 'luxury-collection'],
  },
  {
    slug: 'best-sellers',
    name: 'Best Sellers',
    heading: 'Most Loved',
    description:
      'The pieces our customers return to — ranked by what actually sells, not by what we would like to sell.',
    group: 'collections',
    featured: true,
    relatedSlugs: ['new-arrivals', 'womens-shawls', 'mens-shawls'],
  },
  {
    slug: 'heritage-collection',
    name: 'Heritage Collection',
    description:
      'Pieces made to the specifications our workshop used before 1980 — the same fibre grades, the same looms, the same finishing.',
    group: 'collections',
    featured: true,
    relatedSlugs: ['kashmiri-collection', 'pure-pashmina', 'luxury-collection'],
    seoContent: [
      'The Heritage Collection exists because we still have the pattern books. When our workshop was founded in Srinagar, weavers recorded fibre grade, sett, pick count and dye recipe for every commission. Those books survived, and these pieces are made to them.',
      'Nothing here is a reproduction. The looms are the same design, the talim scripts are the originals, and several of the weavers learned from the men whose names appear in the ledgers.',
    ],
  },
  {
    slug: 'fine-wool',
    name: 'Fine Wool',
    description:
      'Merino, cashmere and Kashmiri handloom wool — everyday luxury that is built to be worn hard.',
    group: 'collections',
    relatedSlugs: ['pure-pashmina', 'shawls', 'scarves'],
  },
  {
    slug: 'pure-pashmina',
    name: 'Pure Pashmina',
    heading: 'Pure Pashmina',
    description:
      'Nothing blended, nothing substituted. Hand-combed Changthangi fibre, charkha-spun and handwoven in Kashmir.',
    group: 'collections',
    featured: true,
    relatedSlugs: ['pashmina', 'womens-pashmina', 'kashmiri-collection', 'heritage-collection'],
    seoContent: [
      'Most cloth sold as "pashmina" is viscose, or wool with a small percentage of pashm blended in. Pure Pashmina means the yarn is entirely the underfleece of the Changthangi goat, hand-combed rather than shorn, and spun on a charkha rather than a mill frame — machine spinning breaks fibre this fine.',
      'Every piece in this collection carries a GI-registered craft certificate recording micron grade, loom number and the name of the weaver who finished it. If a shawl cannot tell you those four things, it is not pure Pashmina.',
    ],
    faqs: [
      {
        question: 'How can I tell pure Pashmina from a blend?',
        answer:
          'Burn test aside, look for irregularity: hand-spun yarn varies slightly in thickness, so the weave is never perfectly uniform. Machine-made "pashmina" is flawless, glossy and cold to the touch. Genuine pashm feels warm immediately and has a matte, slightly hazy surface.',
      },
      {
        question: 'Does the ring test really work?',
        answer:
          'For fine shawls, largely yes — cloth woven from sub-14-micron fibre will pass through a wedding ring. It does not work on heavier or embroidered pieces, and a thin viscose scarf will also pass, so use it alongside other checks.',
      },
      {
        question: 'Why is pure Pashmina expensive?',
        answer:
          'One goat yields around 150 grams of usable fibre per year, and a shawl needs the yield of three to four goats plus six weeks on a handloom. The cost is almost entirely fibre and labour.',
      },
    ],
  },
  {
    slug: 'kashmiri-collection',
    name: 'Kashmiri Collection',
    description:
      'Sozni, kani, jamawar and tilla — the four great needle and loom crafts of the Kashmir valley.',
    group: 'collections',
    featured: true,
    relatedSlugs: ['heritage-collection', 'pure-pashmina', 'wedding-collection'],
    seoContent: [
      'Kashmir’s textile crafts divide into what is built into the cloth and what is added to it. Kani is woven — the pattern is constructed thread by thread on small wooden bobbins. Sozni, tilla and papier-mâché work are embroidered onto a finished ground.',
      'Kani is the rarer and the slower. A full-field kani shawl can take two weavers close to two years, working from a coded pattern script called a talim that only trained weavers can read.',
    ],
  },
  {
    slug: 'wedding-collection',
    name: 'Wedding Collection',
    description:
      'Bridal and occasion pieces — kani, tilla and Banarasi zari, made to be kept and given again.',
    group: 'collections',
    featured: true,
    relatedSlugs: ['wedding-gifts', 'kashmiri-collection', 'luxury-collection'],
  },
  {
    slug: 'luxury-collection',
    name: 'Luxury Collection',
    description:
      'Our most demanding work — the pieces that occupy a loom for months and leave the workshop numbered.',
    group: 'collections',
    relatedSlugs: ['heritage-collection', 'kashmiri-collection', 'pure-pashmina'],
  },
  {
    slug: 'pashmina',
    name: 'Pashmina',
    heading: 'Pashmina',
    description:
      'Every Pashmina piece at Pashmore — shawls, stoles, scarves and wraps in pure pashm and Pashmina-silk blends.',
    group: 'collections',
    featured: true,
    relatedSlugs: ['pure-pashmina', 'womens-pashmina', 'kashmiri-collection', 'shawls'],
  },

  /* ---------------------------------------------------------------- *
   * Gifting
   * ---------------------------------------------------------------- */
  {
    slug: 'gifting',
    name: 'Gifting',
    heading: 'The Art of Gifting',
    description:
      'Thoughtfully crafted pieces for moments worth remembering, presented in hand-bound boxes.',
    group: 'gifting',
    featured: true,
    relatedSlugs: ['gifts-for-her', 'gifts-for-him', 'wedding-gifts', 'corporate-gifts'],
  },
  {
    slug: 'gifts-for-her',
    name: 'Gifts for Her',
    description:
      'Shawls, wraps and scarves chosen to be given — every one with a craft certificate and a hand-written card.',
    group: 'gifting',
    relatedSlugs: ['gifting', 'womens-shawls', 'luxury-gift-boxes'],
  },
  {
    slug: 'gifts-for-him',
    name: 'Gifts for Him',
    description:
      'Men’s shawls, stoles and accessories that will still be worn in twenty years.',
    group: 'gifting',
    relatedSlugs: ['gifting', 'mens-shawls', 'corporate-gifts'],
  },
  {
    slug: 'wedding-gifts',
    name: 'Wedding Gifts',
    description:
      'Trousseau shawls and matched sets — the presents that get passed down rather than put away.',
    group: 'gifting',
    relatedSlugs: ['wedding-collection', 'gifting', 'luxury-gift-boxes'],
  },
  {
    slug: 'corporate-gifts',
    name: 'Corporate Gifts',
    description:
      'Volume gifting in handwoven cloth, with optional debossed branding and individual dispatch.',
    group: 'gifting',
    relatedSlugs: ['gifting', 'gifts-for-him', 'luxury-gift-boxes'],
    seoContent: [
      'Corporate gifting usually fails for the same reason: the recipient can tell how little thought went into it. A handwoven stole with the weaver’s name inside the care label reads differently.',
      'We supply from ten pieces upwards, box individually, and can deboss a logo onto the lid or weave a custom care label into each piece. Lead time is four weeks from artwork approval; dispatch to multiple addresses is standard.',
    ],
  },
  {
    slug: 'luxury-gift-boxes',
    name: 'Luxury Gift Boxes',
    description:
      'Hand-bound presentation boxes made in Srinagar, with muslin sleeve, craft certificate and message card.',
    group: 'gifting',
    relatedSlugs: ['gifting', 'gifts-for-her', 'wedding-gifts'],
  },
]

export const collections: Collection[] = SEEDS.map(build)

export const collectionBySlug = new Map(collections.map((c) => [c.slug, c]))

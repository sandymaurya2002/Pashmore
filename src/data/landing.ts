import type { ProductFaq, ProductImage } from '@/types'

/**
 * Search-intent landing pages.
 *
 * These are NOT copies of the collection pages. A collection page answers
 * "show me the products"; a landing page answers "help me decide", and then
 * shows a curated selection. Each carries its own H1, its own long-form
 * guidance, its own FAQs and its own internal links, and canonicals to itself.
 * Anything that cannot justify that treatment should be a collection, not a
 * landing page.
 */

export interface LandingSection {
  heading: string
  body: string[]
  list?: string[]
}

export interface LandingPage {
  slug: string
  h1: string
  metaTitle: string
  metaDescription: string
  eyebrow: string
  intro: string[]
  /** Products shown are drawn from this collection. */
  collectionSlug: string
  productHeading: string
  sections: LandingSection[]
  faqs: ProductFaq[]
  internalLinks: Array<{ label: string; href: string }>
  banner: ProductImage
}

const banner = (name: string, alt: string): ProductImage => ({
  url: `/images/banners/${name}.png`,
  alt,
  width: 1800,
  height: 620,
})

export const landingPages: LandingPage[] = [
  {
    slug: 'pashmina-shawls',
    h1: 'Pashmina Shawls',
    metaTitle: 'Pashmina Shawls | Hand-Spun & Handwoven in Kashmir | Pashmore',
    metaDescription:
      'Buy authentic Pashmina shawls hand-spun from Changthangi fibre and handwoven in Kashmir. A buying guide, price expectations and the full Pashmore collection.',
    eyebrow: 'Buying Guide',
    intro: [
      'A Pashmina shawl is not a category of scarf — it is a shawl woven from pashm, the hand-combed winter underfleece of the Changthangi goat. Everything that distinguishes a good one from a bad one happens before the loom: fibre grade, dehairing, and whether the yarn was spun by hand.',
      'This page explains what to look for and what to expect to pay, then shows every Pashmina shawl we make.',
    ],
    collectionSlug: 'pashmina',
    productHeading: 'Shop Pashmina Shawls',
    sections: [
      {
        heading: 'What makes a Pashmina shawl authentic',
        body: [
          'Three things, in order of importance. First, the fibre: genuine pashm measures 12–15 microns, roughly half the diameter of fine merino, and comes from goats wintering above 4,000 metres in Ladakh. Second, the spinning: fibre this fine breaks under mill tension, so it must be spun on a hand charkha. Third, the weave: a wooden handloom, worked slowly enough that the weaver can control tension by feel.',
          'A shawl that fails any of those three is something else — possibly very good cloth, but not Pashmina.',
        ],
      },
      {
        heading: 'What you should expect to pay',
        body: [
          'One goat yields about 150 grams of usable fibre a year, and a shawl needs the yield of three to four animals plus six weeks or more on a loom. That sets a hard floor on price.',
        ],
        list: [
          'Plain pure Pashmina shawl: ₹9,000 – ₹16,000',
          'Ring-test grade, sub-14 micron: ₹15,000 – ₹22,000',
          'Tilla or border embroidery: ₹22,000 – ₹35,000',
          'Full sozni or jamawar: ₹30,000 – ₹50,000',
          'Full-field kani: ₹80,000 and above',
        ],
      },
      {
        heading: 'Choosing a size',
        body: [
          'A shawl is 100–110 cm wide and 200–220 cm long, and is meant to wrap. A stole is 70 cm or narrower and is meant to hang. If you want to wear the piece open across the back with both ends falling in front, you need the full shawl width — a stole will not drape correctly.',
          'Men’s shawls are cut longer and slightly narrower so they fall in two straight columns from the shoulder.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How can I tell a real Pashmina shawl from a fake?',
        answer:
          'Touch it first: genuine pashm feels warm within a second, while viscose feels cool and slippery. Then hold it to the light — hand-spun yarn is slightly irregular, so the weave should look alive rather than perfectly uniform. Finally, ask for the micron grade and the weaver’s name; a real supplier can give you both.',
      },
      {
        question: 'Is Pashmina warmer than wool?',
        answer:
          'Per gram, considerably — finer fibre traps more air per unit of mass. A 180 g Pashmina shawl is warmer than a 300 g merino one and far less bulky, though a heavy 450 g handloom wool shawl will still out-warm both in absolute terms.',
      },
      {
        question: 'How should I wash a Pashmina shawl?',
        answer:
          'Ideally you should not. Air it after wearing and it will recover on its own. When it does need cleaning, dry clean embroidered pieces and hand wash plain ones in cold water with a pH-neutral cashmere detergent, drying flat away from heat.',
      },
    ],
    internalLinks: [
      { label: 'Pure Pashmina collection', href: '/collections/pure-pashmina' },
      { label: 'Women’s Pashmina', href: '/collections/womens-pashmina' },
      { label: 'Men’s shawls', href: '/mens-shawls' },
      { label: 'What is Pashmina?', href: '/blog/what-is-pashmina' },
      { label: 'How to identify quality Pashmina', href: '/blog/how-to-identify-quality-pashmina' },
    ],
    banner: banner('pashmina', 'A pure Pashmina shawl in ivory photographed across its full drape'),
  },
  {
    slug: 'kashmiri-shawls',
    h1: 'Kashmiri Shawls',
    metaTitle: 'Kashmiri Shawls | Sozni, Kani & Jamawar Handwork | Pashmore',
    metaDescription:
      'Authentic Kashmiri shawls in sozni embroidery, kani weave, jamawar and tilla work — made in Srinagar by artisan families, with a craft certificate on every piece.',
    eyebrow: 'Craft Guide',
    intro: [
      'Kashmir’s shawl traditions divide neatly into two families: what is built into the cloth on the loom, and what is added to finished cloth with a needle. Knowing which is which tells you most of what you need about how a shawl was made and what it should cost.',
    ],
    collectionSlug: 'kashmiri-collection',
    productHeading: 'Shop Kashmiri Shawls',
    sections: [
      {
        heading: 'The four crafts',
        body: [
          'Kani is woven: the pattern is constructed thread by thread using dozens of small wooden bobbins, following a coded script called a talim. It is the slowest and rarest of the four.',
          'Sozni is embroidered with a single needle in fine silk thread, worked so precisely that the reverse of the shawl is nearly as clean as the face. Tilla uses flattened metallic thread couched onto the surface, traditionally for occasion and bridal pieces. Jamawar covers the whole ground with woven pattern rather than confining it to a border.',
        ],
      },
      {
        heading: 'How long each takes',
        body: [
          'Time on the piece is the honest measure of a Kashmiri shawl’s value.',
        ],
        list: [
          'Plain handloom shawl: 4–6 weeks on the loom',
          'Border sozni: 3–6 months of needlework',
          'Full sozni: 12–24 months',
          'Jamawar: 3–8 months, depending on colour count',
          'Full-field kani: up to 2 years for two weavers',
        ],
      },
      {
        heading: 'Buying with confidence',
        body: [
          'Turn every piece over. Real sozni is clean on the reverse; a true kani shows the pattern mirrored with short floating ends where colours change; printed imitations are flat and uniform on the back.',
          'Every Pashmore piece ships with a certificate recording the technique, the fibre grade, the loom and the name of the artisan who finished it.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the difference between kani and sozni?',
        answer:
          'Kani is a weaving technique — the pattern is built into the cloth on the loom using small wooden bobbins. Sozni is embroidery worked with a needle onto cloth that is already woven. Kani is generally rarer and slower.',
      },
      {
        question: 'Are Kashmiri shawls always Pashmina?',
        answer:
          'No. Kashmiri workshops weave Pashmina, fine merino and heavier handloom wool. The craft describes where and how it was made; Pashmina describes the fibre.',
      },
      {
        question: 'What is a talim?',
        answer:
          'A coded pattern script used in kani weaving, in which each symbol represents a colour and a number of warp threads. It is read aloud in the workshop and can only be interpreted by someone trained in the notation.',
      },
    ],
    internalLinks: [
      { label: 'Kashmiri Collection', href: '/collections/kashmiri-collection' },
      { label: 'Heritage Collection', href: '/collections/heritage-collection' },
      { label: 'A short history of the Kashmiri shawl', href: '/blog/history-of-kashmiri-shawls' },
      { label: 'The kani weave, explained', href: '/blog/the-kani-weave-explained' },
    ],
    banner: banner('kashmiri-collection', 'A jamawar Kashmiri shawl showing dense woven pattern in antique gold'),
  },
  {
    slug: 'pure-pashmina-shawls',
    h1: 'Pure Pashmina Shawls',
    metaTitle: 'Pure Pashmina Shawls | 100% Changthangi Pashm | Pashmore',
    metaDescription:
      'Certified pure Pashmina shawls — nothing blended, nothing substituted. Hand-combed Changthangi fibre, charkha-spun and handwoven in Kashmir.',
    eyebrow: 'Pure Pashmina',
    intro: [
      '"Pure" is the word that does the work here. Most cloth sold as pashmina is viscose, or wool carrying a token percentage of pashm. Pure Pashmina means the yarn is entirely Changthangi underfleece, hand-combed rather than shorn, and spun on a charkha rather than a mill frame.',
    ],
    collectionSlug: 'pure-pashmina',
    productHeading: 'Shop Pure Pashmina',
    sections: [
      {
        heading: 'Why blends exist at all',
        body: [
          'Blending is not always dishonest. Adding mulberry silk to the weft has been standard practice in Kashmir for over a century — it produces a lighter, summer-weight cloth with a faint lustre, and it is sold openly as a Pashmina-silk blend.',
          'The problem is blends sold as pure. A 70/30 wool-pashm cloth costs a fraction of pure pashm to produce and is very difficult to distinguish by eye. Documentation is the only real defence.',
        ],
      },
      {
        heading: 'The ring test, honestly assessed',
        body: [
          'A fine unembroidered shawl woven from sub-14-micron pashm will draw through a wedding ring. It is a genuine demonstration of fineness and it is how buyers have judged cloth in Srinagar’s markets for generations.',
          'It is not proof of authenticity. A thin viscose scarf passes it easily, and a heavier embroidered Pashmina will not pass at all. Use it alongside touch, surface haze and paperwork.',
        ],
      },
      {
        heading: 'What comes with every piece',
        body: [
          'A craft certificate recording micron grade, loom number and the weaver’s name; an archival muslin sleeve for storage; and a hand-bound presentation box.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What does "pure Pashmina" legally mean?',
        answer:
          'Under the Kashmir Pashmina Geographical Indication, the fibre must be Changthangi pashm and the hand-processing must take place in Kashmir. Certification follows laboratory fibre testing.',
      },
      {
        question: 'Is a Pashmina-silk blend inferior?',
        answer:
          'Not inferior, different. Silk in the weft gives lighter, more lustrous cloth that knots and drapes well — ideal for scarves and warm-weather layering. It is simply not pure Pashmina, and should never be sold as such.',
      },
      {
        question: 'How long will a pure Pashmina shawl last?',
        answer:
          'Decades, with correct care. The pieces that fail early almost always do so through storage mistakes — hangers, plastic bags and direct sunlight — rather than wear.',
      },
    ],
    internalLinks: [
      { label: 'Pure Pashmina collection', href: '/collections/pure-pashmina' },
      { label: 'Pashmina shawls guide', href: '/pashmina-shawls' },
      { label: 'Luxury shawls', href: '/luxury-shawls' },
      { label: 'What is Pashmina?', href: '/blog/what-is-pashmina' },
    ],
    banner: banner('pure-pashmina', 'Undyed pure Pashmina cloth showing the hand-spun weave in close detail'),
  },
  {
    slug: 'womens-shawls',
    h1: 'Women’s Shawls',
    metaTitle: 'Women’s Shawls | Pashmina, Cashmere & Kashmiri Wool | Pashmore',
    metaDescription:
      'A guide to buying women’s shawls — Pashmina, cashmere and Kashmiri handloom wool — with weights, sizes and how to choose your first serious piece.',
    eyebrow: 'Buying Guide',
    intro: [
      'A shawl is the most useful thing in an Indian wardrobe and the hardest to buy well, because almost every visible feature — colour, pattern, embroidery — is the part that matters least.',
    ],
    collectionSlug: 'womens-shawls',
    productHeading: 'Shop Women’s Shawls',
    sections: [
      {
        heading: 'Choose by weight, not by look',
        body: ['We make women’s shawls in three weights, and the right one depends entirely on use.'],
        list: [
          'Pure Pashmina, 170–210 g — evening, occasion and travel, where bulk is the enemy.',
          'Cashmere, 250–320 g — daily winter wear across most of India.',
          'Kashmiri handloom wool, 400 g and above — genuine cold, and the most durable of the three.',
        ],
      },
      {
        heading: 'Buying your first serious piece',
        body: [
          'Start undyed. An ivory or natural-beige shawl hides nothing: every pick of the weft is visible, so it is the honest way to judge quality, and neutrals outlast every trend.',
          'Save the embroidered and kani pieces for later, when you know how you actually wear a shawl.',
        ],
      },
      {
        heading: 'Sizes explained',
        body: [
          'A shawl is 100–110 cm wide and 200–220 cm long. A wrap is wider at 120 cm and made to be worn open like a cape. A stole is 70 cm and hangs rather than wraps. If you want to drape a piece open across your back with both ends in front, you need shawl width.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the difference between a shawl, a stole and a wrap?',
        answer:
          'Width. A stole is around 70 cm and hangs; a shawl is 100–110 cm and wraps; a wrap is 120 cm or more and is worn open like a cape. Length is 200–220 cm in all three.',
      },
      {
        question: 'Which shawl is best for a wedding?',
        answer:
          'An ivory Pashmina with a tilla border reads as ceremonial without competing with the outfit, and it will not date. Kani and full sozni pieces are the traditional choice where the budget allows.',
      },
      {
        question: 'How do I stop a shawl from slipping off my shoulders?',
        answer:
          'Fold it once lengthwise before draping — the doubled edge grips far better than a single layer — or pin at one shoulder with a brooch for occasion wear.',
      },
    ],
    internalLinks: [
      { label: "Women's Shawls collection", href: '/collections/womens-shawls' },
      { label: "Women's Pashmina", href: '/collections/womens-pashmina' },
      { label: 'Pashmina stoles', href: '/pashmina-stoles' },
      { label: 'Six ways to wear a Pashmina shawl', href: '/blog/styling-a-pashmina-shawl' },
    ],
    banner: banner('womens-shawls', 'A woman’s ivory Pashmina shawl draped over a marble ledge in daylight'),
  },
  {
    slug: 'mens-shawls',
    h1: 'Men’s Shawls',
    metaTitle: 'Men’s Shawls | Pashmina & Kashmiri Handloom Wool | Pashmore',
    metaDescription:
      'Men’s shawls cut long and narrow to hang from the shoulder — pure Pashmina for occasion, Kashmiri handloom wool for winter. Sizing, drape and buying guidance.',
    eyebrow: 'Buying Guide',
    intro: [
      'A men’s shawl is cut differently from a women’s: more length, less width, so it falls in two straight columns rather than wrapping. Get the proportion wrong and no amount of quality in the cloth will rescue how it sits.',
    ],
    collectionSlug: 'mens-shawls',
    productHeading: 'Shop Men’s Shawls',
    sections: [
      {
        heading: 'How to wear one',
        body: [
          'The traditional drape is a single lengthwise fold laid over one shoulder with the tail thrown back — worn over a bandhgala, a kurta or an achkan. Worn open across both shoulders it reads as more formal and needs the full 220 cm length to balance.',
          'Over western tailoring, a narrower stole is usually easier to manage than a full shawl.',
        ],
      },
      {
        heading: 'Plain or patterned',
        body: [
          'Undecorated wins, almost always. A plain charcoal or midnight Pashmina will be worn at every winter wedding for thirty years; an embroidered piece will be worn twice and then kept for the memory.',
          'If you want one decorated shawl, make it jamawar rather than border embroidery — the pattern reads as texture at conversational distance.',
        ],
      },
      {
        heading: 'Sizing',
        body: [
          'A 110 × 220 cm shawl suits most men. Below 200 cm the lengthwise fold sits awkwardly on the shoulder; above 230 cm it becomes something to manage rather than wear.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What size should a men’s shawl be?',
        answer:
          '110 × 220 cm suits most men. Anything shorter tends to sit awkwardly once folded lengthwise over the shoulder.',
      },
      {
        question: 'Can a men’s shawl be worn with a suit or overcoat?',
        answer:
          'Yes — worn as an oversized scarf, folded lengthwise and left hanging inside the coat. For that use, a 70 cm stole is generally easier than a full shawl.',
      },
      {
        question: 'Pashmina or wool for daily use?',
        answer:
          'Wool. Kashmiri handloom wool at 400 g and above takes daily wear for decades and softens as it goes. Keep Pashmina for occasion and travel.',
      },
    ],
    internalLinks: [
      { label: "Men's Shawls collection", href: '/collections/mens-shawls' },
      { label: "Men's Stoles", href: '/collections/mens-stoles' },
      { label: "Men's Jackets", href: '/collections/mens-jackets' },
      { label: 'Gifts for him', href: '/collections/gifts-for-him' },
    ],
    banner: banner('mens-shawls', 'A men’s charcoal Pashmina shawl folded over a dark wooden bench'),
  },
  {
    slug: 'pashmina-stoles',
    h1: 'Pashmina Stoles',
    metaTitle: 'Pashmina Stoles | Lightweight Handwoven Stoles | Pashmore',
    metaDescription:
      'Pashmina and cashmere stoles cut narrow to hang rather than wrap — the most wearable piece we make, and the one our own team travels with.',
    eyebrow: 'Buying Guide',
    intro: [
      'If a shawl is the ceremonial piece, the stole is the one that actually gets used. At 70 cm wide it folds into a handbag, sits flat under a coat collar and works from October through March across most of India.',
    ],
    collectionSlug: 'stoles',
    productHeading: 'Shop Stoles',
    sections: [
      {
        heading: 'Why a stole is often the better first purchase',
        body: [
          'Stoles cost less than shawls of the same fibre because they use roughly two-thirds of the cloth, and they are far more forgiving to wear: no draping technique required, no bulk at the shoulder, no fuss.',
          'For most people buying their first piece of handwoven cashmere, a stole gets worn ten times more often than a shawl would.',
        ],
      },
      {
        heading: 'Weights and finishes',
        body: [
          'Four-ply cashmere at around 150 g is the travelling weight — light enough to sleep under on a flight. Pure Pashmina at 160 g is the evening weight. Handloom wool at 280 g is the everyday one.',
          'Hand-rolled edges sit flatter at the neck than fringe; fringe reads more traditional and is easier to knot.',
        ],
      },
      {
        heading: 'How to wear a stole',
        body: [
          'Folded lengthwise into a band and wrapped twice at the neck is the most useful knot there is. Left long and open over a jacket is the most elegant. Both work at 70 cm; neither works well with a full 110 cm shawl.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the difference between a stole and a scarf?',
        answer:
          'Length and width. A stole is around 70 × 200 cm; a scarf is narrower at 50 cm and often shorter. A stole can be worn open over the shoulders; a scarf really cannot.',
      },
      {
        question: 'Are Pashmina stoles warm enough for winter?',
        answer:
          'For Indian winters and most European autumns, yes. In genuine cold, layer a Pashmina stole under a coat rather than relying on it alone.',
      },
    ],
    internalLinks: [
      { label: 'Stoles collection', href: '/collections/stoles' },
      { label: "Women's Stoles", href: '/collections/womens-stoles' },
      { label: "Men's Stoles", href: '/collections/mens-stoles' },
      { label: 'Six ways to wear a Pashmina shawl', href: '/blog/styling-a-pashmina-shawl' },
    ],
    banner: banner('stoles', 'A sand cashmere stole folded and photographed on natural linen'),
  },
  {
    slug: 'luxury-shawls',
    h1: 'Luxury Shawls',
    metaTitle: 'Luxury Shawls | Kani, Sozni & Numbered Pieces | Pashmore',
    metaDescription:
      'The most demanding work we make — full-field kani, complete sozni embroidery and numbered pieces that occupy a loom for months. Handmade in Kashmir.',
    eyebrow: 'The Luxury Collection',
    intro: [
      'Beyond a certain point, a shawl stops being a purchase and becomes a commission. The pieces on this page take months or years to make, leave the workshop numbered, and are usually bought once in a lifetime.',
    ],
    collectionSlug: 'luxury-collection',
    productHeading: 'Shop Luxury Shawls',
    sections: [
      {
        heading: 'What you are paying for',
        body: [
          'Not branding and not packaging. On a full-field kani shawl, roughly 90% of the price is two weavers’ time across up to two years. On full sozni, it is one embroiderer covering about a square inch of ground per working day.',
          'The fibre matters, but at this level labour dominates the cost entirely.',
        ],
      },
      {
        heading: 'Provenance and registration',
        body: [
          'Every piece in this collection is registered by number, photographed before dispatch and recorded against the weaver’s name. If you ever want it valued, restored or authenticated, that record is what makes it possible.',
        ],
      },
      {
        heading: 'Made to order',
        body: [
          'We accept a small number of commissions each year — a specific talim, a particular ground colour, or a family motif worked into the border. Lead times run from six months for sozni to two years for full-field kani. Speak to us before the wedding season, not during it.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why does a kani shawl cost so much more than an embroidered one?',
        answer:
          'Because the pattern is woven rather than applied. A kani weaver builds the design thread by thread with dozens of wooden bobbins, producing about a centimetre of finished cloth per day. Two weavers can spend two years on a single shawl.',
      },
      {
        question: 'Do you take commissions?',
        answer:
          'Yes, a small number each year. Lead times run from six months to two years depending on technique. Contact our atelier to discuss a piece.',
      },
      {
        question: 'Will a luxury shawl hold its value?',
        answer:
          'Well-documented handwoven kani and full sozni pieces have historically held value and are regularly passed down. We register every piece by number so provenance can always be established.',
      },
    ],
    internalLinks: [
      { label: 'Luxury Collection', href: '/collections/luxury-collection' },
      { label: 'Kashmiri Collection', href: '/collections/kashmiri-collection' },
      { label: 'Heritage Collection', href: '/collections/heritage-collection' },
      { label: 'The kani weave, explained', href: '/blog/the-kani-weave-explained' },
    ],
    banner: banner('luxury-collection', 'A numbered luxury kani shawl photographed against deep shadow'),
  },
  {
    slug: 'wedding-gifts',
    h1: 'Wedding Gifts',
    metaTitle: 'Wedding Gifts | Handwoven Shawls & Gift Sets | Pashmore',
    metaDescription:
      'Handwoven shawls and matched gift sets for Indian weddings — what to give, what to spend and how each piece is presented.',
    eyebrow: 'Gifting',
    intro: [
      'A shawl is one of the few wedding presents still in use twenty years later. It is also one of the easiest to get wrong, because the obvious choices are the ones that date fastest.',
    ],
    collectionSlug: 'wedding-gifts',
    productHeading: 'Shop Wedding Gifts',
    sections: [
      {
        heading: 'What to give',
        body: [
          'For the bride: crimson or burgundy kani is the traditional choice, and an ivory Pashmina with a tilla border is the enduring one. For the groom: plain charcoal or midnight Pashmina in men’s proportions, which will be worn at every winter wedding for the rest of his life.',
          'For the two families: matched sets solve the hardest problem in wedding gifting — giving to two people at once without giving them the same thing.',
        ],
      },
      {
        heading: 'What to spend',
        body: ['Indicative bands, based on what our customers actually buy.'],
        list: [
          'Close family: ₹25,000 and above',
          'Extended family and close friends: ₹10,000 – ₹20,000',
          'Colleagues and wider circle: ₹5,000 – ₹10,000',
          'Volume gifting: speak to our gifting desk',
        ],
      },
      {
        heading: 'How it arrives',
        body: [
          'Every gift is presented in a hand-bound box made by a Srinagar bookbinder, with an archival muslin sleeve, a craft certificate naming the weaver, and a hand-written message card. We can dispatch to the recipient directly, without a price anywhere in the parcel.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can you deliver directly to the recipient?',
        answer:
          'Yes. Add the recipient’s address at checkout with your message, and we will dispatch directly with no pricing included in the parcel.',
      },
      {
        question: 'Which colour should I avoid as a wedding gift?',
        answer:
          'Plain white, which carries mourning associations in several Indian communities. Ivory and cream read as celebratory and are the safest neutral choices.',
      },
      {
        question: 'How far in advance should I order?',
        answer:
          'Two weeks for in-stock pieces during wedding season. For commissioned or personalised work, allow six months or more.',
      },
    ],
    internalLinks: [
      { label: 'Wedding Collection', href: '/collections/wedding-collection' },
      { label: 'Gifts for her', href: '/collections/gifts-for-her' },
      { label: 'Gifts for him', href: '/collections/gifts-for-him' },
      { label: 'Best shawls for wedding gifting', href: '/blog/best-shawls-for-wedding-gifting' },
    ],
    banner: banner('wedding-gifts', 'A crimson bridal shawl arranged beside a Pashmore presentation box'),
  },
  {
    slug: 'corporate-gifts',
    h1: 'Corporate Gifting',
    metaTitle: 'Corporate Gifting | Handwoven Pashmina Gift Sets | Pashmore',
    metaDescription:
      'Corporate gifting in handwoven Indian cloth — from ten pieces upwards, individually boxed, with optional debossed branding and dispatch to multiple addresses.',
    eyebrow: 'Corporate',
    intro: [
      'Corporate gifting usually fails for the same reason: the recipient can tell how little thought went into it. A handwoven stole with the weaver’s name inside the care label reads differently, and keeps reading differently every winter for a decade.',
    ],
    collectionSlug: 'corporate-gifts',
    productHeading: 'Corporate Gift Sets',
    sections: [
      {
        heading: 'How it works',
        body: [
          'Choose a piece and a volume; we box each item individually inside an outer carton, or dispatch to individual addresses with separate message cards. Minimum order is ten pieces.',
        ],
        list: [
          'Logo debossed onto the box lid',
          'Custom care label woven into each piece',
          'Individually addressed dispatch across India and internationally',
          'Consolidated GST invoicing',
        ],
      },
      {
        heading: 'Lead times',
        body: [
          'Four weeks from artwork approval for branded work, two weeks for unbranded stock pieces. During Diwali and wedding season, allow six weeks — this is handwoven cloth and the looms do not scale.',
        ],
      },
      {
        heading: 'Typical budgets',
        body: [
          'Most corporate programmes sit between ₹4,000 and ₹9,000 per recipient for fine wool and Pashmina-blend stoles, and between ₹12,000 and ₹20,000 for pure Pashmina at board or client level.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the minimum order quantity?',
        answer:
          'Ten pieces. Larger volumes are quoted individually — contact our gifting desk with your recipient count and budget.',
      },
      {
        question: 'Can we add our company logo?',
        answer:
          'Yes. We deboss logos onto the box lid and can weave a custom care label into each piece. Allow four weeks from artwork approval.',
      },
      {
        question: 'Do you ship to multiple addresses?',
        answer:
          'Yes. Send a recipient list and we will dispatch individually, each with its own hand-written message card and no pricing in the parcel.',
      },
    ],
    internalLinks: [
      { label: 'Corporate Gifts collection', href: '/collections/corporate-gifts' },
      { label: 'Luxury Gift Boxes', href: '/collections/luxury-gift-boxes' },
      { label: 'Contact our gifting desk', href: '/contact' },
      { label: 'Gifting', href: '/collections/gifting' },
    ],
    banner: banner('corporate-gifts', 'A row of individually boxed Pashmore stoles prepared for corporate dispatch'),
  },
]

export const landingBySlug = new Map(landingPages.map((page) => [page.slug, page]))

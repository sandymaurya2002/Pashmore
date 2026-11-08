import type { KeywordCategory } from '@/types/keywords'

/**
 * Hand-curated seed keywords, grouped by research category.
 *
 * Seeds are research input, not a page list: every one is classified, scored
 * and checked against the catalogue, and many end up `no-page` or
 * `do-not-target`. Combinations (colour × product, modifier × product,
 * long-tail templates) are generated in lib/keyword-intel/generate.ts so they
 * never need to be written out by hand.
 */
export const keywordSeeds: Record<KeywordCategory, string[]> = {
  core: [
    'pashmina', 'pashmina shawl', 'pashmina shawls', 'pashmina scarf', 'pashmina scarves',
    'pashmina stole', 'stols', 'pashmina wrap', 'pashmina wraps', 'pashmina wool', 'pashmina fabric',
    'pashmina material', 'pashmina cloth', 'pashmina products', 'pashmina collection',
    'pashmina fashion', 'pashmina clothing', 'pashmina accessories',
  ],

  brand: [
    'Pashmore', 'Pashmore shawl', 'Pashmore shawls', 'Pashmore scarf', 'Pashmore scarves',
    'Pashmore stole', 'Pashmore wrap', 'Pashmore pashmina', 'Pashmore collection',
    'Pashmore online', 'Pashmore India', 'Pashmore store', 'Pashmore shop', 'Pashmore website',
    'Pashmore official', 'Pashmore clothing', 'Pashmore winter collection',
    'Pashmore new collection', 'Pashmore latest collection', 'Pashmore products',
    'Pashmore price', 'Pashmore sale', 'Pashmore offers', 'Pashmore discount', 'Pashmore reviews',
  ],

  transactional: [
    'buy pashmina', 'buy pashmina shawl', 'buy pashmina online', 'buy pashmina shawl online',
    'buy pashmina scarf', 'buy pashmina stole', 'buy cashmere shawl', 'buy cashmere scarf',
    'buy Kashmiri shawl', 'buy Kashmiri pashmina', 'order pashmina shawl', 'order pashmina online',
    'shop pashmina', 'shop pashmina shawls', 'shop Kashmiri shawls', 'pashmina online shopping',
    'pashmina shawl online shopping', 'pashmina online store', 'pashmina shawl online store',
    'best place to buy pashmina', 'where to buy pashmina', 'pashmina shawl shop',
    'pashmina shawl store', 'pashmina clothing online',
  ],

  product: [
    'pashmina shawl', 'pashmina scarf', 'pashmina stole', 'pashmina wrap', 'pashmina blanket',
    'pashmina muffler', 'pashmina stole for women', 'pashmina shawl for women',
    'pashmina shawl for men', 'pashmina scarf for women', 'pashmina scarf for men',
    'pashmina winter shawl', 'pashmina wedding shawl', 'pashmina bridal shawl',
    'pashmina party shawl', 'pashmina evening shawl', 'pashmina designer shawl',
    'pashmina luxury shawl', 'pashmina handmade shawl', 'pashmina handwoven shawl',
    'pashmina embroidered shawl', 'pashmina printed shawl', 'pashmina patterned shawl',
    'pashmina traditional shawl',
  ],

  material: [
    'pure pashmina', 'semi pashmina', '100% pashmina', 'authentic pashmina', 'genuine pashmina', 'real pashmina',
    'original pashmina', 'pashmina wool', 'pashmina cashmere', 'pashmina and cashmere',
    'cashmere pashmina', 'cashmere shawl', 'cashmere scarf', 'cashmere wrap',
    'pure cashmere shawl', 'pure cashmere scarf', 'wool pashmina', 'fine wool shawl',
    'soft wool shawl', 'premium wool shawl', 'luxury wool shawl', 'natural wool shawl',
    'handwoven wool shawl',
  ],

  kashmiri: [
    'Kashmiri pashmina', 'Kashmiri pashmina shawl', 'kani shawl', 'Kashmiri shawl', 'Kashmir shawl',
    'Kashmir pashmina', 'Kashmiri wool shawl', 'Kashmiri embroidered shawl',
    'Kashmiri handmade shawl', 'Kashmiri handwoven shawl', 'Kashmiri traditional shawl',
    'Kashmiri winter shawl', 'Kashmiri scarf', 'Kashmiri stole', 'Kashmiri pashmina online',
    'buy Kashmiri pashmina', 'Kashmiri shawl online', 'Kashmiri shawl price',
    'Kashmiri shawl for women', 'Kashmiri shawl for men',
  ],

  women: [
    'pashmina shawl for women', 'pashmina scarf for women', 'pashmina stole for women',
    'pashmina wrap for women', 'pashmina winter shawl for women', "pashmina shawl women's",
    "women's pashmina shawl", "women's pashmina scarf", "women's cashmere shawl",
    "women's cashmere scarf", "women's Kashmiri shawl", 'luxury shawl for women',
    'winter shawl for women', 'designer shawl for women', 'elegant shawl for women',
    'soft shawl for women',
  ],

  men: [
    'pashmina shawl for men', 'pashmina scarf for men', 'pashmina stole for men',
    'cashmere scarf for men', 'cashmere shawl for men', 'Kashmiri shawl for men',
    'wool shawl for men', 'winter scarf for men', 'winter shawl for men', 'luxury scarf for men',
    "men's pashmina scarf", "men's pashmina shawl", "men's cashmere scarf", "men's winter shawl",
  ],

  // Colour seeds are deliberately broad; colours absent from the catalogue are
  // rejected by the engine rather than silently dropped, so the report shows why.
  color: [
    'red pashmina shawl', 'black pashmina shawl', 'white pashmina shawl', 'pink pashmina shawl',
    'blue pashmina shawl', 'green pashmina shawl', 'purple pashmina shawl',
    'maroon pashmina shawl', 'beige pashmina shawl', 'cream pashmina shawl',
    'grey pashmina shawl', 'gray pashmina shawl', 'brown pashmina shawl', 'gold pashmina shawl',
    'silver pashmina shawl', 'yellow pashmina shawl', 'orange pashmina shawl',
    'navy pashmina shawl', 'peach pashmina shawl', 'magenta pashmina shawl',
  ],

  style: [
    'embroidered pashmina shawl', 'printed pashmina shawl', 'patterned pashmina shawl',
    'floral pashmina shawl', 'traditional pashmina shawl', 'modern pashmina shawl',
    'designer pashmina shawl', 'luxury pashmina shawl', 'handmade pashmina shawl',
    'handwoven pashmina shawl', 'lightweight pashmina shawl', 'soft pashmina shawl',
    'warm pashmina shawl', 'premium pashmina shawl', 'elegant pashmina shawl',
    'classic pashmina shawl', 'traditional Kashmiri shawl', 'contemporary shawl',
    'minimalist shawl', 'festive shawl',
  ],

  occasion: [
    'pashmina shawl for wedding', 'pashmina wedding shawl', 'pashmina bridal shawl',
    'pashmina shawl for bride', 'pashmina shawl for wedding guest', 'pashmina party shawl',
    'pashmina shawl for party', 'pashmina shawl for evening', 'pashmina shawl for dinner',
    'pashmina shawl for formal wear', 'pashmina shawl for office', 'pashmina shawl for travel',
    'pashmina shawl for vacation', 'pashmina shawl for festivals', 'pashmina shawl for Diwali',
    'pashmina shawl for Christmas', 'pashmina shawl for New Year', 'pashmina shawl for Eid',
    'pashmina gift shawl', 'pashmina anniversary gift', 'pashmina birthday gift',
    'pashmina wedding gift', "pashmina Mother's Day gift",
  ],

  seasonal: [
    'winter shawl', 'winter pashmina', 'winter pashmina shawl', 'pashmina winter collection',
    'winter scarf', 'winter shawl for women', 'winter shawl for men', 'warm pashmina shawl',
    'warm winter shawl', 'lightweight winter shawl', 'autumn shawl', 'fall shawl',
    'winter fashion shawl', 'winter accessories', 'winter fashion accessories',
    'Christmas shawl', 'New Year shawl', 'holiday shawl',
  ],

  price: [
    'pashmina shawl price', 'pashmina shawl price in India', 'pashmina price',
    'pashmina price per shawl', 'pashmina scarf price', 'pashmina stole price',
    'cashmere shawl price', 'cashmere scarf price', 'Kashmiri shawl price',
    'Kashmiri pashmina price', 'cheap pashmina shawl', 'affordable pashmina shawl',
    'premium pashmina shawl price', 'luxury pashmina shawl price', 'pashmina shawl under 1000',
    'pashmina shawl under 2000', 'pashmina shawl under 5000', 'pashmina shawl under 10000',
  ],

  offer: [
    'pashmina sale', 'pashmina shawl sale', 'pashmina discount', 'pashmina offer',
    'pashmina deals', 'pashmina deals online', 'pashmina shawl discount', 'pashmina shawl offers',
    'pashmina clearance sale', 'pashmina winter sale', 'Pashmore sale', 'Pashmore discount',
    'Pashmore offers', 'Pashmore coupon', 'Pashmore deals',
  ],

  gift: [
    'pashmina gift', 'pashmina shawl gift', 'pashmina gift for women', 'pashmina gift for mother',
    'pashmina gift for wife', 'pashmina gift for girlfriend', 'pashmina gift for sister',
    'pashmina gift for grandmother', 'pashmina gift for husband', 'pashmina gift for father',
    'pashmina gift for men', 'cashmere gift', 'luxury shawl gift', 'premium shawl gift',
    'winter gift for women', 'winter gift for men', 'wedding shawl gift', 'anniversary shawl gift',
  ],

  location: [
    'pashmina shawl India', 'pashmina shawl online India', 'pashmina India', 'pashmina shop India',
    'pashmina store India', 'pashmina shawl Delhi', 'pashmina shawl Mumbai',
    'pashmina shawl Bangalore', 'pashmina shawl Bengaluru', 'pashmina shawl Hyderabad',
    'pashmina shawl Chennai', 'pashmina shawl Kolkata', 'pashmina shawl Pune',
    'pashmina shawl Gurgaon', 'pashmina shawl Gurugram', 'pashmina shawl Noida',
    'pashmina shawl Jaipur', 'pashmina USA', 'pashmina UK', 'pashmina Canada',
    'pashmina Australia', 'pashmina UAE', 'pashmina Dubai', 'pashmina Saudi Arabia',
    'pashmina Singapore', 'pashmina Germany', 'pashmina France', 'pashmina Italy',
  ],

  'near-me': [
    'pashmina shop near me', 'pashmina store near me', 'pashmina shawl shop near me',
    'pashmina scarf shop near me', 'Kashmiri shawl shop near me', 'cashmere shop near me',
    'shawl shop near me',
  ],

  informational: [
    'what is pashmina', 'what is a pashmina shawl', 'what is pashmina wool',
    'what is pashmina made from', 'where does pashmina come from', 'how is pashmina made',
    'how is pashmina wool made', 'how to identify pashmina', 'how to identify pure pashmina',
    'how to check pure pashmina', 'how to test pashmina', 'how to wash pashmina',
    'how to clean pashmina', 'how to store pashmina', 'how to care for pashmina',
    'how to wear pashmina', 'how to style pashmina', 'how to wear a pashmina shawl',
    'how to wear a pashmina scarf', 'how to fold pashmina', 'how to maintain pashmina',
    'how to remove stains from pashmina',
  ],

  comparison: [
    'pashmina vs cashmere', 'pashmina vs wool', 'pashmina vs merino wool', 'pashmina vs silk',
    'cashmere vs wool', 'cashmere vs pashmina', 'pashmina or cashmere', 'pashmina or wool',
    'pashmina shawl vs cashmere shawl', 'real pashmina vs fake pashmina',
    'pure pashmina vs blended pashmina', 'pashmina vs merino', 'shawl vs stole', 'shawl vs scarf',
  ],

  authenticity: [
    'authentic pashmina', 'genuine pashmina', 'real pashmina', 'original pashmina',
    'pure pashmina', 'how to identify authentic pashmina', 'how to identify genuine pashmina',
    'how to identify fake pashmina', 'how to check authentic pashmina',
    'how to check genuine pashmina', 'pashmina authenticity', 'pashmina certification',
    'pashmina quality', 'pashmina quality guide',
  ],

  quality: [
    'best pashmina', 'best pashmina shawl', 'best quality pashmina', 'premium pashmina',
    'luxury pashmina', 'softest pashmina', 'finest pashmina', 'high quality pashmina',
    'premium pashmina shawl', 'luxury pashmina shawl', 'best Kashmiri shawl',
    'best cashmere shawl',
  ],

  // Long-tail and modifier keywords are generated from templates, not seeded.
  'long-tail': [],
  modifier: [],

  question: [
    'What is pashmina?', 'Is pashmina the same as cashmere?', 'Is pashmina warm?',
    'Is pashmina good for winter?', 'Is pashmina expensive?', 'How much does pashmina cost?',
    'How do I know if pashmina is real?', 'How do I wash a pashmina shawl?',
    'How do I store a pashmina shawl?', 'Where can I buy authentic pashmina?',
    'Why is pashmina expensive?', 'What is the difference between pashmina and cashmere?',
    'How should I wear a pashmina shawl?', 'What is the best pashmina shawl?',
  ],
}

export const indianCities = [
  'delhi', 'new delhi', 'mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
  'pune', 'gurgaon', 'gurugram', 'noida', 'jaipur', 'ahmedabad', 'chandigarh', 'lucknow',
  'srinagar',
]

/** Search term → ISO country code. */
export const countryTerms: Record<string, string> = {
  india: 'IN',
  usa: 'US',
  us: 'US',
  'united states': 'US',
  uk: 'GB',
  'united kingdom': 'GB',
  canada: 'CA',
  australia: 'AU',
  uae: 'AE',
  dubai: 'AE',
  'saudi arabia': 'SA',
  singapore: 'SG',
  germany: 'DE',
  france: 'FR',
  italy: 'IT',
}

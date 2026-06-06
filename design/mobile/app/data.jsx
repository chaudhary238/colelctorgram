// ─────────────────────────────────────────────────────────────
// CollectorHub — mock data, aligned to BRD v1.2 §8.1 data model
// Core objects: Item · Listing · Post · Deal
// Globals exported to window at bottom.
// ─────────────────────────────────────────────────────────────

// ── Phase-1 categories (BRD §6.1) ─────────────────────────────
const CATEGORIES = [
  { id: 'figures',  label: 'Action Figures',      short: 'Figures' },
  { id: 'designer', label: 'Designer Toys',       short: 'Designer' },
  { id: 'kits',     label: 'Model Kits & Lego',   short: 'Kits & Lego' },
  { id: 'diecast',  label: 'Diecast',             short: 'Diecast' },
];

// ── Users + transaction-linked trust signals (BRD §8.2) ───────
// tier: derived from verified ownership + completed deals + ratings
const USERS = {
  aman_toys: {
    handle: 'aman_toys', name: 'Aman Iyer', city: 'Mumbai', joined: "Jan '24",
    color: 'var(--plum)', bio: 'Hot Toys obsessive · 1/6 only · in-hand or PO',
    deals: 38, rating: 4.9, ratingCount: 41, response: '~15 min', activeListings: 4,
    followers: 1284, following: 312, tier: 'Trusted', portfolio: 842300, verifiedItems: 71,
    interests: ['figures', 'designer'],
  },
  rohit_scale: {
    handle: 'rohit.scale', name: 'Rohit Menon', city: 'Bangalore', joined: "Oct '23",
    color: 'var(--stamp-red)', bio: 'Anime PVCs · diecast · founder, Indian Toy Maniacs',
    deals: 84, rating: 4.8, ratingCount: 96, response: '~5 min', activeListings: 7,
    followers: 4102, following: 208, tier: 'Top Seller', portfolio: 1842900, verifiedItems: 188,
    interests: ['figures', 'diecast'],
  },
  saanvi: {
    handle: 'saanvi.diorama', name: 'Saanvi K', city: 'Bangalore', joined: "Mar '24",
    color: 'var(--verified-teal)', bio: 'Lego diorama maker · 18+ kits only',
    deals: 14, rating: 5.0, ratingCount: 14, response: '~1 hr', activeListings: 2,
    followers: 612, following: 145, tier: 'Verified', portfolio: 396000, verifiedItems: 39,
    interests: ['kits'],
  },
  karan_die: {
    handle: 'karan_die', name: 'Karan Bhatia', city: 'Delhi', joined: "Jun '24",
    color: 'var(--grail-gold)', bio: 'Tomica · Hot Wheels · 1/64 forever',
    deals: 19, rating: 4.7, ratingCount: 22, response: '~30 min', activeListings: 5,
    followers: 489, following: 271, tier: 'Verified', portfolio: 184000, verifiedItems: 54,
    interests: ['diecast'],
  },
  meera: {
    handle: 'meera.figs', name: 'Meera Pillai', city: 'Chennai', joined: "Feb '24",
    color: 'var(--forest)', bio: 'Bandai SH Figuarts · MISB collector',
    deals: 28, rating: 4.9, ratingCount: 30, response: '~20 min', activeListings: 3,
    followers: 903, following: 198, tier: 'Trusted', portfolio: 612000, verifiedItems: 120,
    interests: ['figures'],
  },
  vikram: {
    handle: 'vikram.toys', name: 'Vikram S', city: 'Pune', joined: "Sep '23",
    color: 'var(--stamp-red)', bio: 'Sideshow · Premium Format · grail hunter',
    deals: 67, rating: 4.9, ratingCount: 71, response: '~10 min', activeListings: 6,
    followers: 2210, following: 176, tier: 'Top Seller', portfolio: 1450000, verifiedItems: 165,
    interests: ['figures'],
  },
};

// ── Catalogue (BRD §8.3 / §9.4) — what search & scan resolve to ─
const CATALOGUE = [
  { sku: 'MMS601',   title: 'Hot Toys MMS601 · Iron Man Mark 85', brand: 'Hot Toys', cat: 'figures', scale: '1/6',  year: '2022', tone: 'red',  est: 21000 },
  { sku: '10307',    title: 'LEGO 10307 · Eiffel Tower',          brand: 'LEGO',     cat: 'kits',    scale: '1:300', year: '2023', tone: 'gold', est: 52000 },
  { sku: 'SHF-GUI',  title: 'Bandai Goku Ultra Instinct · SH Figuarts', brand: 'Bandai', cat: 'figures', scale: '1/12', year: '2025', tone: 'gold', est: 6800 },
  { sku: 'TL-R34',   title: 'Tomica Limited · Skyline GT-R R34',  brand: 'Tomica',   cat: 'diecast', scale: '1/64',  year: '2021', tone: 'teal', est: 5200 },
  { sku: 'SP-TMWYW', title: 'Pop Mart · Skullpanda · Tell Me What You Want', brand: 'Pop Mart', cat: 'designer', scale: '—', year: '2024', tone: 'plum', est: 11000 },
  { sku: 'SS-PF-BM', title: 'Sideshow Premium Format · Batman',   brand: 'Sideshow', cat: 'figures', scale: '1/4',   year: '2018', tone: 'ink',  est: 165000 },
  { sku: 'MG-RX78',  title: 'Bandai MG RX-78-2 Gundam Ver.Ka',    brand: 'Bandai',   cat: 'kits',    scale: '1/100', year: '2020', tone: 'forest', est: 4800 },
  { sku: 'MINIGT-R35', title: 'Mini GT · Nissan GT-R R35 Nismo',  brand: 'Mini GT',  cat: 'diecast', scale: '1/64',  year: '2023', tone: 'teal', est: 2400 },
];

// ── My collection — Items (BRD §8.1) ──────────────────────────
// status: owned | wishlist | preorder ; verify: claimed | shown | verified
const MY_ITEMS = [
  { id: 'i1', sku: 'MMS601',  status: 'owned',    verify: 'verified', value: 21000, listed: false, photos: 3 },
  { id: 'i2', sku: 'MG-RX78', status: 'owned',    verify: 'verified', value: 4800,  listed: true,  photos: 2 },
  { id: 'i3', sku: 'TL-R34',  status: 'owned',    verify: 'shown',    value: 5200,  listed: false, photos: 1 },
  { id: 'i4', sku: 'SS-PF-BM',status: 'owned',    verify: 'claimed',  value: 165000,listed: false, photos: 0 },
  { id: 'i5', sku: 'SHF-GUI', status: 'preorder', verify: 'claimed',  value: 6800,  listed: false, photos: 0,
    order: 'Ordered 12 May', eta: 'Ships ~ 20 Jun' },
  { id: 'w1', sku: 'SP-TMWYW',status: 'wishlist', verify: 'claimed',  value: 11000, listed: false, photos: 0, alert: true },
  { id: 'w2', sku: '10307',   status: 'wishlist', verify: 'claimed',  value: 52000, listed: false, photos: 0, alert: true },
];

// ── Listings (BRD §8.6) — derived from an owned Item ──────────
// status: available | reserved | sold
const LISTINGS = [
  {
    id: 'mms601', sku: 'MMS601', seller: 'aman_toys',
    price: 18400, retail: 22000, condition: 'MISB · sealed · plastic intact',
    verify: 'verified', status: 'available', trade: true, qty: 1,
    ships: 'Mumbai · pan-India · ₹350', photos: 6, posted: '3h',
    notes: "US import, single owner, never displayed. Comes with the original brown shipper. Plastic is intact, magnets all good. Trades considered for grail Sideshow pieces — DM if interested.",
    saves: 24, watching: 11,
  },
  {
    id: 'lego10307', sku: '10307', seller: 'saanvi',
    price: 49999, retail: 54999, condition: 'MISB · factory sealed',
    verify: 'verified', status: 'available', trade: false, qty: 1,
    ships: 'Bangalore · pan-India · ₹600', photos: 4, posted: '8h',
    notes: "Pre-ordered through Bangalore distributor. Ships first week of June. Box mint, shipper unopened.",
    saves: 87, watching: 34,
  },
  {
    id: 'goku-ui', sku: 'SHF-GUI', seller: 'meera',
    price: 6499, retail: 6999, condition: 'BNIB · ordered, not yet shipped',
    verify: 'shown', status: 'available', trade: false, qty: 1,
    ships: 'Chennai · pan-India · ₹250', photos: 2, posted: '5h',
    notes: "Bangalore drop, Friday 6pm IST. One PO slot, willing to transfer at MRP + transfer fee. No KOs ever.",
    saves: 142, watching: 56,
  },
  {
    id: 'tomica-r34', sku: 'TL-R34', seller: 'karan_die',
    price: 4200, retail: 5500, condition: 'MISB · sealed blister',
    verify: 'verified', status: 'available', trade: true, qty: 1,
    ships: 'Delhi · pan-India · ₹150', photos: 3, posted: '6h',
    notes: "From the Limited Vintage Neo line. Blister sealed. Have two, letting one go.",
    saves: 32, watching: 9,
  },
  {
    id: 'popmart-skull', sku: 'SP-TMWYW', seller: 'aman_toys',
    price: 9600, retail: 12000, condition: 'Sealed case · 12 figures',
    verify: 'verified', status: 'reserved', trade: false, qty: 1,
    ships: 'Mumbai · pan-India · ₹400', photos: 5, posted: '12h',
    notes: "Full sealed case. Chase odds are 1/72. Not splitting.",
    saves: 56, watching: 22,
  },
  {
    id: 'sideshow-batman', sku: 'SS-PF-BM', seller: 'vikram',
    price: 142000, retail: 165000, condition: 'MISB · double-boxed · original shipper',
    verify: 'verified', status: 'available', trade: true, qty: 1,
    ships: 'Pune · pan-India · pickup recommended', photos: 8, posted: '1d',
    notes: "Single-owner from launch. Never displayed. Numbered /1000, low number. Trades considered for Sideshow Joker or Spider-Man PF.",
    saves: 412, watching: 168,
  },
  {
    id: 'minigt-r35', sku: 'MINIGT-R35', seller: 'karan_die',
    price: 1900, retail: 2400, condition: 'MISB · sealed',
    verify: 'verified', status: 'available', trade: false, qty: 2,
    ships: 'Delhi · pan-India · ₹150', photos: 2, posted: '2h',
    notes: "Nismo livery, sealed. Wishlist match for a few of you — letting two go at a fair price.",
    saves: 18, watching: 7,
  },
];

// ── Posts (BRD §8.5) — type: showcase | discussion | review ───
const POSTS = [
  {
    id: 'p1', type: 'showcase', user: 'rohit_scale', time: '5h', community: 'itm',
    refSku: 'SHF-GUI', tone: 'gold', cat: 'figures',
    body: "Got my hands on the Bandai Goku UI today. PVC is heavier than I expected — the box still smells like fresh tampo print. Display shot for the shelf. 🔧",
    likes: 84, comments: 23, image: true,
  },
  {
    id: 'p2', type: 'discussion', user: 'vikram', time: '1d', community: 'grails',
    cat: 'figures',
    body: "PSA: there's a new Sideshow Joker recast hitting the markets — telltale is the cape stitching pattern. Always ask for an in-hand video before paying. Stay safe out there.",
    likes: 256, comments: 67, image: false,
  },
  {
    id: 'p3', type: 'review', user: 'saanvi', time: '2d', community: 'lego',
    refSku: '10307', tone: 'gold', cat: 'kits', rating: 4,
    body: "Finished the 10307 Eiffel Tower over the weekend — 10,001 pieces, took me three sittings. Repetition in the lattice is real but the final reveal is worth it. Build quality 4/5.",
    likes: 198, comments: 41, image: true,
  },
  {
    id: 'p4', type: 'showcase', user: 'meera', time: '8h', community: 'itm',
    refSku: 'MMS601', tone: 'red', cat: 'figures',
    body: "Shelf reorg done. The Mark 85 finally has pride of place under the spotlight. In-hand and loving it.",
    likes: 121, comments: 18, image: true,
  },
  {
    id: 'p5', type: 'poll', user: 'karan_die', time: '4h', community: 'jdm', cat: 'diecast',
    body: "Group order incoming — which Mini GT case should we pull next? Vote and I'll lock it Friday.",
    likes: 64, comments: 12, image: false,
    poll: [
      { label: 'Nissan GT-R R35 Nismo', votes: 41 },
      { label: 'Mazda RX-7 FD (Mazdaspeed)', votes: 33 },
      { label: 'Lancer Evo X', votes: 18 },
    ],
  },
];

// ── Admin / release posts (BRD §10 return loop) ───────────────
const ADMIN_POSTS = [
  { id: 'a1', time: '2h', cat: 'figures', title: 'New release · Bandai Goku Ultra Instinct',
    body: 'POs open Friday 6pm IST. Limited to 1 per account at retail. Tap to set a wishlist alert.', sku: 'SHF-GUI', tone: 'gold' },
  { id: 'a2', time: '1d', cat: 'kits', title: 'Restock · LEGO Icons Eiffel Tower 10307',
    body: 'Back in stock at Indian distributors this week after a long gap.', sku: '10307', tone: 'gold' },
];

// ── Communities (BRD §8.8) ────────────────────────────────────
const COMMUNITIES = [
  { id: 'itm',   name: 'Indian Toy Maniacs', members: 4892, founder: 'rohit_scale', tone: 'plum', cat: 'figures',
    short: 'The OG India figure & diecast community.', tag: 'iT', joined: true, posts: 2140,
    rules: ['In-hand or clear PO terms only', 'No recasts / KOs', 'Be decent — trades are off-platform, vouch after'] },
  { id: 'lego',  name: 'Bricks Bangalore', members: 2134, founder: 'saanvi', tone: 'forest', cat: 'kits',
    short: 'Lego AFOLs, MOC builds, scarce sets.', tag: 'Bb', joined: false, posts: 980,
    rules: ['Original builds welcome', 'Mark sealed vs opened', 'Credit MOC designers'] },
  { id: 'jdm',   name: 'JDM Diecast Crew', members: 1678, founder: 'karan_die', tone: 'teal', cat: 'diecast',
    short: 'Tomica, Inno64, Mini GT — 1/64 obsessives.', tag: 'JD', joined: true, posts: 1320,
    rules: ['Scale + brand in every post', 'Photos in natural light preferred'] },
  { id: 'kaiju', name: 'Kaiju & Vinyl', members: 934, founder: 'meera', tone: 'red', cat: 'designer',
    short: 'Designer toy drops, blind boxes, soft vinyl.', tag: 'Kv', joined: false, posts: 540,
    rules: ['Tag blind-box reveals', 'No chase-figure scalping talk'] },
  { id: 'grails',name: 'Grail Hunters India', members: 612, founder: 'vikram', tone: 'ink', cat: 'figures',
    short: 'High-end statues, premium format, recast watch.', tag: 'Gh', joined: false, posts: 410, invite: true,
    rules: ['Invite-only', 'Provenance matters — show your shipper', 'Recast tells get pinned'] },
];

// ── Events (BRD §8.9) ─────────────────────────────────────────
const EVENTS = [
  { id: 'mumbai4', title: 'Mumbai Collector Meet · Vol 4', day: 'Sat', date: '24', month: 'May',
    when: 'Sat · 24 May · 4:00 pm', where: 'Phoenix Marketcity, Kurla', mode: 'In person', city: 'Mumbai',
    cat: 'figures', interested: 184, community: 'itm', host: 'rohit_scale',
    about: 'Our biggest meet yet. Bring 3 pieces to display or trade. Verified sellers get a table. Group dinner after.' },
  { id: 'blr3', title: 'Bengaluru Brick Bash · Vol 3', day: 'Sun', date: '08', month: 'Jun',
    when: 'Sun · 08 Jun · 11:00 am', where: 'Lalbagh Glass House, Bangalore', mode: 'In person', city: 'Bangalore',
    cat: 'kits', interested: 97, community: 'lego', host: 'saanvi',
    about: 'MOC showcase + a swap table for spare parts. Family-friendly. Best build wins a sealed set.' },
  { id: 'delhi2', title: 'Delhi Diecast Showdown', day: 'Sat', date: '14', month: 'Jun',
    when: 'Sat · 14 Jun · 2:00 pm', where: 'Select Citywalk, Saket', mode: 'In person', city: 'Delhi',
    cat: 'diecast', interested: 62, community: 'jdm', host: 'karan_die',
    about: '1/64 trade tables, a custom-livery contest, and a group order for the next Mini GT case.' },
  { id: 'online1', title: 'Online · Pop Mart Drop Watch Party', day: 'Fri', date: '06', month: 'Jun',
    when: 'Fri · 06 Jun · 8:00 pm', where: 'CollectorHub Live (online)', mode: 'Online', city: 'Online',
    cat: 'designer', interested: 240, community: 'kaiju', host: 'meera',
    about: 'We watch the Skullpanda drop together, call out stock, and split cases. Bring your wishlist.' },
];

// ── Deals / trade history (BRD §8.1 Deal) ─────────────────────
const TRADE_HISTORY = [
  { id: 'd1', with: 'rohit_scale', item: 'Tomica Limited · Mazda RX-7 FD', dir: 'Sold', when: 'Apr 2026', rating: 5 },
  { id: 'd2', with: 'meera', item: 'SH Figuarts · Vegeta', dir: 'Bought', when: 'Mar 2026', rating: 5 },
  { id: 'd3', with: 'karan_die', item: 'Mini GT · Lancer Evo X', dir: 'Traded', when: 'Feb 2026', rating: 4 },
];

// ── Notifications (BRD §8.10) ─────────────────────────────────
const NOTIFICATIONS = [
  { id: 'n1', kind: 'wishlist', text: 'A Pop Mart Skullpanda you want is now listed for ₹9,600.', time: '8m', unread: true, ref: { type: 'listing', id: 'popmart-skull' } },
  { id: 'n2', kind: 'deal', user: 'rohit_scale', text: 'wants to confirm your deal on the Iron Man Mark 85.', time: '20m', unread: true, ref: { type: 'chat', id: 'rohit_scale' } },
  { id: 'n3', kind: 'vouch', user: 'saanvi', text: 'left you a trade vouch ★★★★★.', time: '1h', unread: true, ref: { type: 'profile', id: 'saanvi' } },
  { id: 'n4', kind: 'follow', user: 'karan_die', text: 'started following you.', time: '3h', unread: false, ref: { type: 'profile', id: 'karan_die' } },
  { id: 'n5', kind: 'like', user: 'meera', text: 'and 23 others liked your showcase.', time: '5h', unread: false, ref: { type: 'post', id: 'p4' } },
  { id: 'n6', kind: 'community', text: 'New post in Indian Toy Maniacs — 23 replies.', time: '6h', unread: false, ref: { type: 'community', id: 'itm' } },
  { id: 'n7', kind: 'event', text: 'Mumbai Collector Meet · Vol 4 starts in 3 days.', time: '8h', unread: false, ref: { type: 'event', id: 'mumbai4' } },
  { id: 'n8', kind: 'preorder', text: 'Your Goku UI pre-order ships in ~3 weeks.', time: '1d', unread: false, ref: { type: 'item', id: 'i5' } },
];

// ── Comments for post detail (BRD §9.7) ───────────────────────
const COMMENTS = {
  p1: [
    { user: 'meera', time: '4h', body: 'The tampo on the gi is so crisp this run. Congrats!' },
    { user: 'karan_die', time: '3h', body: 'Did you PO or grab in-hand? Looking for one myself.' },
    { user: 'aman_toys', time: '2h', body: 'Shelf is looking stacked 🔥' },
  ],
  p2: [
    { user: 'aman_toys', time: '22h', body: 'Saved. The stitching tell is the easiest one to check, good shout.' },
    { user: 'saanvi', time: '20h', body: 'Reported a seller last week for exactly this. Thank you for posting.' },
  ],
  p3: [
    { user: 'rohit_scale', time: '1d', body: 'The lattice repetition broke me on the 10256 too. Worth it though.' },
  ],
  p4: [
    { user: 'vikram', time: '7h', body: 'That spotlight setup is clean. What lighting?' },
  ],
};

// ── Direct messages (BRD §8.7 / §9.10) ────────────────────────
const THREADS = {
  rohit_scale: {
    listing: 'mms601',
    messages: [
      { from: 'them', text: 'Yo. Still got the Iron Man Mk85 in hand?', time: '11:42' },
      { from: 'them', text: 'Saw it on your feed — would do ₹18k flat, pickup in Andheri.', time: '11:42' },
    ],
  },
  karan_die: {
    listing: 'tomica-r34',
    messages: [
      { from: 'them', text: 'Open to a trade on the R34? I have a sealed Mini GT R35.', time: 'Yesterday' },
    ],
  },
  meera: {
    listing: null,
    messages: [
      { from: 'me', text: 'Hey! Is the Goku UI PO slot still open?', time: 'Mon' },
      { from: 'them', text: 'Yep, one slot. MRP + ₹200 transfer. Want it?', time: 'Mon' },
    ],
  },
};

const INBOX = [
  { user: 'rohit_scale', preview: 'would do ₹18k flat, pickup in Andheri.', time: '11:42', unread: 2, listing: 'mms601' },
  { user: 'karan_die', preview: 'Open to a trade on the R34?', time: 'Yest', unread: 1, listing: 'tomica-r34' },
  { user: 'meera', preview: 'Yep, one slot. MRP + ₹200 transfer.', time: 'Mon', unread: 0, listing: null },
];

// ── You — the prototype user ──────────────────────────────────
const ME = {
  handle: 'you', name: 'You', initial: 'Y', color: 'var(--ink)', city: 'Mumbai', joined: "Nov '25",
  bio: 'New here · Hot Toys + Gunpla · building the shelf',
  deals: 6, rating: 4.8, ratingCount: 6, response: '~25 min', activeListings: 1,
  followers: 38, following: 91, tier: 'Verified', portfolio: 197000, verifiedItems: 3,
  interests: ['figures', 'kits'],
};

// ── Standardised condition ladder (§9.9, defined list not free text) ──
const CONDITION_LADDER = ['Sealed / MISB', 'Mint', 'Like new', 'Good', 'Fair', 'For parts'];

// ── Onboarding sub-interests added in v1.2 (§9.2): Scale + Universe ──
const SCALES = ['1/4', '1/6', '1/10', '1/12', '1/64', '1/100', '1:300'];
const UNIVERSES = ['Marvel', 'DC', 'Dragon Ball', 'Star Wars', 'Gundam', 'JDM Cars', 'Pop Mart IP'];

// ── Presence / online status (§9.11) ──────────────────────────
const PRESENCE = {
  aman_toys: 'active 4 min ago', rohit_scale: 'Online now', saanvi: 'active 1 hr ago',
  karan_die: 'active 22 min ago', meera: 'Online now', vikram: 'active 8 min ago', you: 'Online now',
};
// ── Ownership breakdown by category (§9.11 header stat) ────────
const OWNS = {
  aman_toys: { figures: 58, designer: 13 }, rohit_scale: { figures: 96, diecast: 92 },
  saanvi: { kits: 39 }, karan_die: { diecast: 54 }, meera: { figures: 120 }, vikram: { figures: 165 },
};
const OWN_LABELS = { figures: 'action figures', designer: 'designer toys', kits: 'kits & Lego', diecast: 'diecast' };

// ── Community posting mode (§9.12): open | approval ───────────
const COM_POSTMODE = { grails: 'approval', kaiju: 'approval' };
// ── Visible admins / mods per community (§9.12) ─────────────
const COM_ADMINS = {
  itm:    [{ handle: 'rohit_scale', role: 'Founder' }, { handle: 'aman_toys', role: 'Mod' }],
  lego:   [{ handle: 'saanvi', role: 'Founder' }],
  jdm:    [{ handle: 'karan_die', role: 'Founder' }, { handle: 'vikram', role: 'Mod' }],
  kaiju:  [{ handle: 'meera', role: 'Founder' }],
  grails: [{ handle: 'vikram', role: 'Founder' }, { handle: 'rohit_scale', role: 'Mod' }],
};

// ── Listing seller terms + price-feedback seed (§9.9) ─────────
const LISTING_TERMS = {
  mms601:    ['No returns once sold', 'Buyer covers shipping (₹350 pan-India)', 'Pickup welcome in Andheri', 'In-hand video before payment'],
  lego10307: ['Factory-sealed, sold as-is', 'Shipping covered by seller', 'No trades on this one'],
  'tomica-r34': ['No returns once sold', 'Shipping ₹150, buyer pays', 'Open to 1/64 trades'],
  'sideshow-batman': ['Pickup strongly recommended', 'No returns — inspect on collection', 'Insured courier at buyer cost'],
};
const DEFAULT_TERMS = ['No returns once sold', 'Shipping at buyer cost', 'Message before you pay'];

// helpers
function cat(sku) { return CATALOGUE.find(c => c.sku === sku); }
function user(h) { return USERS[h] || ME; }
function listing(id) { return LISTINGS.find(l => l.id === id); }
function presenceOf(h) { return PRESENCE[h] || 'active recently'; }
function termsOf(id) { return LISTING_TERMS[id] || DEFAULT_TERMS; }
// map free-text condition to a standardised ladder rung (§9.9)
function gradeOf(cond) {
  const s = (cond || '').toLowerCase();
  if (s.includes('misb') || s.includes('sealed') || s.includes('factory')) return 'Sealed / MISB';
  if (s.includes('bnib') || s.includes('new')) return 'Like new';
  if (s.includes('mint')) return 'Mint';
  if (s.includes('good')) return 'Good';
  if (s.includes('fair')) return 'Fair';
  if (s.includes('parts')) return 'For parts';
  return 'Mint';
}
function postModeOf(id) { return COM_POSTMODE[id] || 'open'; }
function adminsOf(id) { const c = COMMUNITIES.find(x => x.id === id); return COM_ADMINS[id] || (c ? [{ handle: c.founder, role: 'Founder' }] : []); }
// ownership-stats parts, e.g. ['58 action figures', '13 designer toys']
function ownStats(u) {
  let owns;
  if (u.handle === 'you') {
    owns = {};
    MY_ITEMS.filter(i => i.status !== 'wishlist').forEach(i => {
      const c = cat(i.sku); if (!c) return; owns[c.cat] = (owns[c.cat] || 0) + 1;
    });
  } else owns = OWNS[u.handle] || {};
  return Object.entries(owns).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${OWN_LABELS[k] || k}`);
}

Object.assign(window, {
  CATEGORIES, USERS, CATALOGUE, MY_ITEMS, LISTINGS, POSTS, ADMIN_POSTS,
  COMMUNITIES, EVENTS, TRADE_HISTORY, NOTIFICATIONS, COMMENTS, THREADS, INBOX, ME,
  SCALES, UNIVERSES, PRESENCE, OWNS, OWN_LABELS, CONDITION_LADDER,
  catOf: cat, userOf: user, listingOf: listing,
  presenceOf, termsOf, postModeOf, ownStats, gradeOf, adminsOf,
});

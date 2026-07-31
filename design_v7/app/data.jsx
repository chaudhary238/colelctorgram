// ─────────────────────────────────────────────────────────────
// Scorred — mock data, aligned to BRD v1.2 §8.1 data model
// Core objects: Item · Listing · Post · Deal
// Globals exported to window at bottom.
// ─────────────────────────────────────────────────────────────

// ── Phase-1 categories (BRD §6.1) ─────────────────────────────
const CATEGORIES = [
  { id: 'figures',  label: 'Action Figures',            chipLabel: 'Action Figure',              short: 'Action Figures' },
  { id: 'diecast',  label: 'Diecast',                   chipLabel: 'Diecast',                    short: 'Diecast' },
  { id: 'kits',     label: 'Model Kits & Lego',         chipLabel: 'Model Kits & Lego',          short: 'Model Kits' },
  { id: 'designer', label: 'Designer Toys & Blind Boxes', chipLabel: 'Designer Toys & Blind Boxes', short: 'Designer Toys' },
  { id: 'tcg',      label: 'Trading Cards (TCG)',        chipLabel: 'Trading Cards (TCG)',         short: 'TCG' },
];

// ── Users + transaction-linked trust signals (BRD §8.2) ───────
// tier: derived from completed deals + vouches received (no star ratings)
const USERS = {
  aman_toys: {
    handle: 'aman_toys', name: 'Aman Iyer', city: 'Mumbai', joined: "Jan '24",
    color: 'var(--plum)', bio: 'Hot Toys obsessive · 1/6 only · in-hand or PO',
    deals: 38, response: '~15 min', activeListings: 4,
    vouchesReceived: 31, vouchesGiven: 12,
    xp: 6850, xpWeek: 320, xpMonth: 1180,
    contrib: { posts: 3100, social: 1900, collection: 1200, market: 650 },
    seasonBadges: [
      { id: 'aman-apr-wk', period: 'Apr', kind: 'weekly', place: 2, tier: 'silver', title: '#2 · Weekly' },
    ],
    followers: 1284, following: 312, tier: 'Trusted', portfolio: 842300, verifiedItems: 71,
    interests: ['figures', 'designer'],
  },
  rohit_scale: {
    handle: 'rohit.scale', name: 'Rohit Menon', city: 'Bangalore', joined: "Oct '23",
    color: 'var(--stamp-red)', bio: 'Anime PVCs · diecast · founder, Indian Toy Maniacs',
    deals: 84, response: '~5 min', activeListings: 7,
    vouchesReceived: 76, vouchesGiven: 24,
    xp: 12420, xpWeek: 540, xpMonth: 2090,
    contrib: { market: 6200, social: 3200, posts: 2100, collection: 920 },
    seasonBadges: [
    ],
    followers: 4102, following: 208, tier: 'Top Seller', portfolio: 1842900, verifiedItems: 188,
    interests: ['figures', 'diecast', 'tcg'],
  },
  saanvi: {
    handle: 'saanvi.diorama', name: 'Saanvi K', city: 'Bangalore', joined: "Mar '24",
    color: 'var(--verified-teal)', bio: 'Lego diorama maker · 18+ kits only',
    deals: 14, response: '~1 hr', activeListings: 2,
    vouchesReceived: 13, vouchesGiven: 9,
    xp: 1580, xpWeek: 240, xpMonth: 690,
    contrib: { posts: 800, collection: 500, social: 200, market: 80 },
    seasonBadges: [
      { id: 'saanvi-may-wk', period: 'May', kind: 'weekly', place: 'top10', tier: 'finalist', title: 'Weekly Top 10' },
    ],
    followers: 612, following: 145, tier: 'Verified', portfolio: 396000, verifiedItems: 39,
    interests: ['kits'],
  },
  karan_die: {
    handle: 'karan_die', name: 'Karan Bhatia', city: 'Delhi', joined: "Jun '24",
    color: 'var(--grail-gold)', bio: 'Tomica · Hot Wheels · 1/64 forever',
    deals: 19, response: '~30 min', activeListings: 5,
    vouchesReceived: 16, vouchesGiven: 7,
    xp: 2310, xpWeek: 150, xpMonth: 540,
    contrib: { market: 1100, social: 600, collection: 400, posts: 210 },
    seasonBadges: [
    ],
    followers: 489, following: 271, tier: 'Verified', portfolio: 184000, verifiedItems: 54,
    interests: ['diecast'],
  },
  meera: {
    handle: 'meera.figs', name: 'Meera Pillai', city: 'Chennai', joined: "Feb '24",
    color: 'var(--forest)', bio: 'Bandai SH Figuarts · MISB collector',
    deals: 28, response: '~20 min', activeListings: 3,
    vouchesReceived: 24, vouchesGiven: 11,
    xp: 5120, xpWeek: 410, xpMonth: 1320,
    contrib: { social: 2600, posts: 1300, collection: 800, market: 420 },
    seasonBadges: [
    ],
    followers: 903, following: 198, tier: 'Trusted', portfolio: 612000, verifiedItems: 120,
    interests: ['figures'],
  },
  vikram: {
    handle: 'vikram.toys', name: 'Vikram S', city: 'Pune', joined: "Sep '23",
    color: 'var(--stamp-red)', bio: 'Sideshow · Premium Format · grail hunter',
    deals: 67, response: '~10 min', activeListings: 6,
    vouchesReceived: 61, vouchesGiven: 19,
    xp: 9240, xpWeek: 290, xpMonth: 1460,
    contrib: { collection: 4800, market: 2600, posts: 1100, social: 740 },
    seasonBadges: [
    ],
    followers: 2210, following: 176, tier: 'Top Seller', portfolio: 1450000, verifiedItems: 165,
    interests: ['figures'],
  },
};

// ── Catalogue (BRD §8.3 / §9.4) — what search & scan resolve to ─
const CATALOGUE = [
  { sku: 'MMS601',   title: 'Hot Toys MMS601 · Iron Man Mark 85', brand: 'Hot Toys', cat: 'figures', scale: '1/6',  year: '2022', tone: 'red',  est: 21000, scorredReviewed: true, ownersCount: 214, wishCount: 88, rating: { avg: 4.7, count: 96 } },
  { sku: '10307',    title: 'LEGO 10307 · Eiffel Tower',          brand: 'LEGO',     cat: 'kits',    scale: '1:300', year: '2023', tone: 'gold', est: 52000, scorredReviewed: true, ownersCount: 96, wishCount: 140, rating: { avg: 4.9, count: 61 } },
  { sku: 'SHF-GUI',  title: 'Bandai Goku Ultra Instinct · SH Figuarts', brand: 'Bandai', cat: 'figures', scale: '1/12', year: '2025', tone: 'gold', est: 6800, intelBy: 'meera', ownersCount: 58, wishCount: 203, rating: { avg: 4.5, count: 34 } },
  { sku: 'TL-R34',   title: 'Tomica Limited · Skyline GT-R R34',  brand: 'Tomica',   cat: 'diecast', scale: '1/64',  year: '2021', tone: 'teal', est: 5200, intelBy: 'karan_die', ownersCount: 142, wishCount: 51, rating: { avg: 4.3, count: 40 } },
  { sku: 'SP-TMWYW', title: 'Pop Mart · Skullpanda · Tell Me What You Want', brand: 'Pop Mart', cat: 'designer', scale: '—', year: '2024', tone: 'plum', est: 11000, intelBy: 'rohit_scale', ownersCount: 77, wishCount: 112, rating: { avg: 4.1, count: 28 } },
  { sku: 'SS-PF-BM', title: 'Sideshow Premium Format · Batman',   brand: 'Sideshow', cat: 'figures', scale: '1/4',   year: '2018', tone: 'ink',  est: 165000, scorredReviewed: true, ownersCount: 21, wishCount: 64, rating: { avg: 4.8, count: 19 } },
  { sku: 'MG-RX78',  title: 'Bandai MG RX-78-2 Gundam Ver.Ka',    brand: 'Bandai',   cat: 'kits',    scale: '1/100', year: '2020', tone: 'forest', est: 4800, ownersCount: 189, wishCount: 47, rating: { avg: 4.6, count: 73 } },
  { sku: 'MINIGT-R35', title: 'Mini GT · Nissan GT-R R35 Nismo',  brand: 'Mini GT',  cat: 'diecast', scale: '1/64',  year: '2023', tone: 'teal', est: 2400, ownersCount: 165, wishCount: 39, rating: { avg: 4.2, count: 52 } },
  { sku: 'PKM-151-BB', title: 'Pokémon TCG · Scarlet & Violet 151 · Booster Box (EN)', brand: 'The Pokémon Company', cat: 'tcg', scale: '—', year: '2023', tone: 'red',  est: 8500, intelBy: 'you', ownersCount: 301, wishCount: 178, rating: { avg: 4.7, count: 122 } },
  { sku: 'OP-EB01',    title: 'One Piece TCG · Extra Booster · Memorial Collection (JP)', brand: 'Bandai', cat: 'tcg', scale: '—', year: '2023', tone: 'gold', est: 4200, ownersCount: 84, wishCount: 61, rating: { avg: 4.4, count: 27 } },
  { sku: 'HT-THOR-LT', title: 'Hot Toys MMS · Thor: Love & Thunder', brand: 'Hot Toys', cat: 'figures', scale: '1/6', year: '2026', tone: 'gold', est: 26000, intelBy: 'you', ownersCount: 9, wishCount: 96, rating: { avg: 4.6, count: 11 } },
];

// ── Seed marketplace listings (BRD §9.8) ─────────────────────
// IMPORTANT: these use the SAME shape as a user-created listing from
// Add an item → "List for sale" — only fields captured in that form.
// No retail/MRP, watcher counts, quantity, or invented copy.
const MARKET_SEED = [
  {
    id: 's1', seller: 'aman_toys', posted: '3h', mine: false,
    title: 'Hot Toys Iron Man Mark 85 — Endgame', brand: 'Hot Toys', cat: 'figures',
    tone: 'red', photos: ['red', 'ink', 'gold'], photoCount: 3, scale: '1/6', year: '2022',
    desc: 'US import, single owner, never displayed. Comes with the original brown shipper. Magnets all good.',
    price: 18400, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Outer sleeve has light shelf wear, inner box mint.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's2', seller: 'meera', posted: '5h', mine: false,
    title: 'Bandai Goku Ultra Instinct — S.H.Figuarts', brand: 'Bandai', cat: 'figures',
    tone: 'gold', photos: ['gold', 'teal'], photoCount: 2, scale: '1/12', year: '2025',
    desc: 'BNIB, just arrived. No KOs ever — sealed from the Friday drop.',
    price: 6499, sym: '₹', currency: 'INR', condition: 'MIB', condNote: 'Blister sealed, box corners crisp.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'shown',
  },
  {
    id: 's3', seller: 'vikram', posted: '1d', mine: false,
    title: 'Sideshow Premium Format — Batman', brand: 'Sideshow', cat: 'figures',
    tone: 'ink', photos: ['ink', 'plum', 'red', 'gold'], photoCount: 4, scale: '1/4', year: '2018',
    desc: 'Single-owner from launch. Never displayed. Numbered /1000, low number. Trades considered for Sideshow Joker or Spider-Man PF.',
    price: 142000, sym: '₹', currency: 'INR', condition: 'BIB', condNote: 'Double-boxed with original shipper kept.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's4', seller: 'karan_die', posted: '6h', mine: false,
    title: 'Tomica Limited Vintage — Skyline GT-R R34', brand: 'Tomica', cat: 'diecast',
    tone: 'teal', photos: ['teal', 'ink'], photoCount: 2, scale: '1/64', year: '2021',
    desc: 'From the Limited Vintage Neo line. Have two, letting one go.',
    price: 4200, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Blister sealed, never opened.',
    acq: 'inhand', trade: true, shipIncl: false, returns: true, status: 'available', verify: 'verified',
  },
  {
    id: 's5', seller: 'saanvi', posted: '8h', mine: false,
    title: 'LEGO Icons Eiffel Tower 10307', brand: 'LEGO', cat: 'kits',
    tone: 'gold', photos: ['gold', 'forest'], photoCount: 2, scale: '—', year: '2023',
    desc: 'Box mint, shipper unopened. Pre-ordered through Bangalore distributor.',
    price: 49999, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Factory sealed, no shelf wear.',
    acq: 'inhand', trade: false, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's6', seller: 'rohit_scale', posted: '2h', mine: false,
    title: 'Pop Mart Skullpanda — Tell Me What You Want', brand: 'Pop Mart', cat: 'designer',
    tone: 'plum', photos: ['plum'], photoCount: 1, scale: '—', year: '2024',
    desc: 'Full sealed case, 12 figures. Chase odds 1/72. Not splitting.',
    price: 9600, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Sealed case, untouched.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's7', seller: 'meera', posted: '1d', mine: false,
    title: 'Threezero MDLX Spider-Man — Pre-order slot', brand: 'Threezero', cat: 'figures',
    tone: 'red', photos: ['red', 'ink'], photoCount: 2, scale: '1/12', year: '2026',
    desc: 'Transferring my pre-order slot at cost. Will arrive sealed to your address from the distributor.',
    price: 7800, sym: '₹', currency: 'INR', condition: 'Pre-order', condNote: '',
    acq: 'preorder', poDate: '2026-02-15', poSeller: 'BBToyStore', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'claimed',
  },

  // ── aman_toys additional listings ──
  {
    id: 's8', seller: 'aman_toys', posted: '1d', mine: false,
    title: 'Hot Toys Captain America — Endgame', brand: 'Hot Toys', cat: 'figures',
    tone: 'teal', photos: ['teal','ink','gold'], photoCount: 3, scale: '1/6', year: '2021',
    desc: 'US import, single owner. Perfect tampos, helmet swaps all work. Blue shipper intact.',
    price: 16800, sym: '₹', currency: 'INR', condition: 'MIB', condNote: 'Box crisp, all accessories bagged.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's9', seller: 'aman_toys', posted: '4d', mine: false,
    title: 'Hot Toys Black Widow — Endgame', brand: 'Hot Toys', cat: 'figures',
    tone: 'ink', photos: ['ink','plum'], photoCount: 2, scale: '1/6', year: '2022',
    desc: "MISB. All widow's bites included. Letting go to fund next grail.",
    price: 13500, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Outer sleeve pristine.',
    acq: 'inhand', trade: false, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's10', seller: 'aman_toys', posted: '6h', mine: false,
    title: 'Hot Toys Thor — Love & Thunder PO slot', brand: 'Hot Toys', cat: 'figures',
    tone: 'gold', photos: ['gold'], photoCount: 1, scale: '1/6', year: '2026',
    desc: 'Transferring PO slot at cost. Ships direct from US distributor to you.',
    price: 22000, sym: '₹', currency: 'INR', condition: 'Pre-order', condNote: '',
    acq: 'preorder', poDate: '2025-11-10', poSeller: 'Sideshow', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'claimed',
  },
  {
    id: 's11', seller: 'aman_toys', posted: '2d', mine: false,
    title: 'Hot Toys Thanos — Infinity War', brand: 'Hot Toys', cat: 'figures',
    tone: 'plum', photos: ['plum','ink','gold'], photoCount: 3, scale: '1/6', year: '2020',
    desc: 'Complete with all 6 Infinity Stone props. Single owner. Gauntlet magnets perfect.',
    price: 24000, sym: '₹', currency: 'INR', condition: 'BIB', condNote: 'Box excellent, inner foam perfect.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  // ── rohit_scale additional listings ──
  {
    id: 's12', seller: 'rohit_scale', posted: '2d', mine: false,
    title: 'S.H.Figuarts Vegeta Super Saiyan Blue', brand: 'Bandai', cat: 'figures',
    tone: 'teal', photos: ['teal','ink'], photoCount: 2, scale: '1/12', year: '2024',
    desc: 'Web exclusive, BNIB. Effect parts all bagged. One of the best Vegeta releases.',
    price: 7400, sym: '₹', currency: 'INR', condition: 'MIB', condNote: 'Sealed inner box, blister untouched.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's13', seller: 'rohit_scale', posted: '12h', mine: false,
    title: 'Mini GT Nissan Skyline GT-R R32 — Group A', brand: 'Mini GT', cat: 'diecast',
    tone: 'ink', photos: ['ink','teal'], photoCount: 2, scale: '1/64', year: '2023',
    desc: 'Sealed blister. Group A livery, one of the best Mini GT releases this year.',
    price: 2100, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Blister unopened.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's14', seller: 'rohit_scale', posted: '3d', mine: false,
    title: 'S.H.Figuarts Naruto Sage Mode — PO slot', brand: 'Bandai', cat: 'figures',
    tone: 'gold', photos: ['gold'], photoCount: 1, scale: '1/12', year: '2026',
    desc: 'Pre-order slot from Japanese distributor. Transferring at cost + fees.',
    price: 6200, sym: '₹', currency: 'INR', condition: 'Pre-order', condNote: '',
    acq: 'preorder', poDate: '2026-03-01', poSeller: 'AmiAmi', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'claimed',
  },
  {
    id: 's15', seller: 'rohit_scale', posted: '5h', mine: false,
    title: 'Pop Mart Labubu — The Monsters Series 2', brand: 'Pop Mart', cat: 'designer',
    tone: 'plum', photos: ['plum','red'], photoCount: 2, scale: '—', year: '2025',
    desc: 'Single blind box, sealed. Letting go at a fair price.',
    price: 1200, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Blind box sealed.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'shown',
  },
  // ── vikram additional listings ──
  {
    id: 's16', seller: 'vikram', posted: '3d', mine: false,
    title: 'Sideshow Spider-Man Premium Format', brand: 'Sideshow', cat: 'figures',
    tone: 'red', photos: ['red','ink','teal'], photoCount: 3, scale: '1/4', year: '2017',
    desc: 'Numbered, excellent provenance. Light shelf time, never unboxed for display. Shippers intact.',
    price: 118000, sym: '₹', currency: 'INR', condition: 'BIB', condNote: 'Both boxes, foam perfect.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's17', seller: 'vikram', posted: '1d', mine: false,
    title: 'Hot Toys War Machine — Endgame', brand: 'Hot Toys', cat: 'figures',
    tone: 'ink', photos: ['ink','gold'], photoCount: 2, scale: '1/6', year: '2021',
    desc: 'Complete. All weapons accessories bagged. Single display — bought for display shelf only.',
    price: 17500, sym: '₹', currency: 'INR', condition: 'MIB', condNote: 'Box near mint.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's18', seller: 'vikram', posted: '7h', mine: false,
    title: 'XM Studios Cyclops — PO slot', brand: 'XM Studios', cat: 'figures',
    tone: 'gold', photos: ['gold'], photoCount: 1, scale: '1/4', year: '2026',
    desc: 'Slot from SG distributor. Low number allocation. Transferring at cost.',
    price: 98000, sym: '₹', currency: 'INR', condition: 'Pre-order', condNote: '',
    acq: 'preorder', poDate: '2026-01-15', poSeller: 'XM Studios SG', trade: false, shipIncl: false, returns: false, status: 'available', verify: 'claimed',
  },
  {
    id: 's19', seller: 'vikram', posted: '4d', mine: false,
    title: 'Sideshow Black Panther Premium Format', brand: 'Sideshow', cat: 'figures',
    tone: 'ink', photos: ['ink','plum'], photoCount: 2, scale: '1/4', year: '2019',
    desc: 'EX version with interchangeable chest piece. Both shippers, numbered.',
    price: 88000, sym: '₹', currency: 'INR', condition: 'BIB', condNote: 'Double-boxed, mint inside.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  // ── meera additional listings ──
  {
    id: 's20', seller: 'meera', posted: '1d', mine: false,
    title: 'S.H.Figuarts Goku Black — Rose', brand: 'Bandai', cat: 'figures',
    tone: 'plum', photos: ['plum','ink'], photoCount: 2, scale: '1/12', year: '2023',
    desc: 'Web exclusive. Blister sealed, never opened. One of the best DBS Figuarts.',
    price: 8100, sym: '₹', currency: 'INR', condition: 'MIB', condNote: 'Blister untouched.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's21', seller: 'meera', posted: '6h', mine: false,
    title: 'S.H.Figuarts Android 18 — Dragon Ball Super', brand: 'Bandai', cat: 'figures',
    tone: 'teal', photos: ['teal'], photoCount: 1, scale: '1/12', year: '2024',
    desc: 'BNIB. Sealed from tamashii nations web shop. Effect parts all in.',
    price: 6900, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Outer blister sealed.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's22', seller: 'meera', posted: '3d', mine: false,
    title: 'S.H.Figuarts Kefla — PO slot', brand: 'Bandai', cat: 'figures',
    tone: 'forest', photos: ['forest'], photoCount: 1, scale: '1/12', year: '2026',
    desc: 'Tamashii Web Exclusive PO. Transferring at cost + Yahoo Japan fees.',
    price: 7800, sym: '₹', currency: 'INR', condition: 'Pre-order', condNote: '',
    acq: 'preorder', poDate: '2026-04-20', poSeller: 'Tamashii Web', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'claimed',
  },
  {
    id: 's23', seller: 'meera', posted: '2d', mine: false,
    title: 'Bandai DX Chogokin RX-78-2 — Final Battle', brand: 'Bandai', cat: 'figures',
    tone: 'red', photos: ['red','gold','ink'], photoCount: 3, scale: '1/144', year: '2022',
    desc: 'Complete set. All beam parts, shield, sabre. Die-cast weight is unreal. Letting go for space.',
    price: 14500, sym: '₹', currency: 'INR', condition: 'BIB', condNote: 'Box has light wear, inside perfect.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  // ── saanvi additional listings ──
  {
    id: 's24', seller: 'saanvi', posted: '2d', mine: false,
    title: 'LEGO Titanic 10294', brand: 'LEGO', cat: 'kits',
    tone: 'ink', photos: ['ink','teal'], photoCount: 2, scale: '—', year: '2021',
    desc: '9090 pieces. Factory sealed, original receipt available. Stored flat.',
    price: 59999, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Factory sealed.',
    acq: 'inhand', trade: false, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's25', seller: 'saanvi', posted: '4h', mine: false,
    title: 'LEGO Icons Botanicals Orchid 10311', brand: 'LEGO', cat: 'kits',
    tone: 'forest', photos: ['forest'], photoCount: 1, scale: '—', year: '2023',
    desc: 'Sealed. Bought extra from LEGO store, letting one go.',
    price: 3999, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Mint box.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's26', seller: 'saanvi', posted: '6d', mine: false,
    title: 'LEGO Rivendell 10316 — PO slot', brand: 'LEGO', cat: 'kits',
    tone: 'gold', photos: ['gold'], photoCount: 1, scale: '—', year: '2026',
    desc: 'Pre-ordered via LEGO India. Transferring at MRP. Will ship sealed direct.',
    price: 39999, sym: '₹', currency: 'INR', condition: 'Pre-order', condNote: '',
    acq: 'preorder', poDate: '2026-02-01', poSeller: 'LEGO India', trade: false, shipIncl: false, returns: false, status: 'available', verify: 'claimed',
  },
  {
    id: 's27', seller: 'saanvi', posted: '1d', mine: false,
    title: 'LEGO Technic Bugatti Bolide 42151', brand: 'LEGO', cat: 'kits',
    tone: 'teal', photos: ['teal','ink'], photoCount: 2, scale: '—', year: '2023',
    desc: 'MISB. Impulse buy, lifestyle changed — letting go.',
    price: 8999, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Box mint.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'shown',
  },
  // ── karan_die additional listings ──
  {
    id: 's28', seller: 'karan_die', posted: '1d', mine: false,
    title: 'Mini GT Mitsubishi Lancer Evo X — WRC', brand: 'Mini GT', cat: 'diecast',
    tone: 'red', photos: ['red','ink'], photoCount: 2, scale: '1/64', year: '2022',
    desc: 'Sealed blister. WRC livery. One of my doubles — letting go.',
    price: 1800, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Blister sealed.',
    acq: 'inhand', trade: true, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's29', seller: 'karan_die', posted: '3h', mine: false,
    title: 'Hot Wheels RLC — Porsche 917 LH', brand: 'Hot Wheels', cat: 'diecast',
    tone: 'gold', photos: ['gold'], photoCount: 1, scale: '1/64', year: '2024',
    desc: "RLC exclusive. Sealed card. Didn't double-dip on this livery — letting go.",
    price: 3800, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Card sealed.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's30', seller: 'karan_die', posted: '5d', mine: false,
    title: 'Inno64 Honda Civic EK9 Type R — Championship White', brand: 'Inno64', cat: 'diecast',
    tone: 'ink', photos: ['ink','teal'], photoCount: 2, scale: '1/64', year: '2023',
    desc: 'Hard to find. Sealed. Accurate tampos, opening bonnet.',
    price: 2600, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Blister sealed.',
    acq: 'inhand', trade: true, shipIncl: false, returns: true, status: 'available', verify: 'verified',
  },
  {
    id: 's31', seller: 'karan_die', posted: '2d', mine: false,
    title: 'Mini GT Full Case — Honda NSX NA1 (12 pcs)', brand: 'Mini GT', cat: 'diecast',
    tone: 'teal', photos: ['teal','ink','gold'], photoCount: 3, scale: '1/64', year: '2024',
    desc: 'Sealed case, 12 units. 3 livery variants, chase possible. Not splitting.',
    price: 21600, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Sealed factory case.',
    acq: 'inhand', trade: false, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  // ── TCG listings ──────────────────────────────────────────
  {
    id: 's32', seller: 'rohit_scale', posted: '4h', mine: false,
    title: 'Pokémon TCG · Scarlet & Violet 151 Booster Box (EN)', brand: 'The Pokémon Company', cat: 'tcg',
    tone: 'red', photos: ['red', 'gold'], photoCount: 2, scale: '—', year: '2023',
    desc: 'Factory sealed EN booster box, 36 packs. Extra from a group order — letting one go.',
    price: 7800, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Factory sealed, no dents.',
    acq: 'inhand', trade: false, shipIncl: true, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's33', seller: 'meera', posted: '1d', mine: false,
    title: 'One Piece TCG · OP-07 500 Years in the Future Booster Box (JP)', brand: 'Bandai', cat: 'tcg',
    tone: 'gold', photos: ['gold', 'ink'], photoCount: 2, scale: '—', year: '2024',
    desc: 'Sealed JP box, 24 packs. Got two, keeping one. The Gear 5 SR is the chase here.',
    price: 3600, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Sealed JP print.',
    acq: 'inhand', trade: true, shipIncl: true, returns: false, status: 'available', verify: 'shown',
  },
  {
    id: 's34', seller: 'karan_die', posted: '6h', mine: false,
    title: 'Pokémon TCG · Temporal Forces Elite Trainer Box', brand: 'The Pokémon Company', cat: 'tcg',
    tone: 'plum', photos: ['plum'], photoCount: 1, scale: '—', year: '2024',
    desc: 'Sealed ETB, 9 packs + accessories. Bought extra at launch, clearing doubles.',
    price: 2800, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Box corners crisp.',
    acq: 'inhand', trade: false, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
  {
    id: 's35', seller: 'aman_toys', posted: '2d', mine: false,
    title: 'Magic: The Gathering · Bloomburrow Collector Booster Box', brand: 'Wizards of the Coast', cat: 'tcg',
    tone: 'forest', photos: ['forest', 'gold'], photoCount: 2, scale: '—', year: '2024',
    desc: 'Sealed collector box, 12 packs. The animal-themed art is some of the best MTG has ever done.',
    price: 14500, sym: '₹', currency: 'INR', condition: 'Sealed', condNote: 'Factory sealed.',
    acq: 'inhand', trade: false, shipIncl: false, returns: false, status: 'available', verify: 'verified',
  },
];

// ── My collection — Items (BRD §8.1, v2) ─────────────────────
// status: owned | intel | preorder | owned ; verify: claimed | shown | verified
const MY_ITEMS = [
  { id: 'i1', sku: 'MMS601',  status: 'owned',    verify: 'verified', value: 21000, listed: false, photos: 3 },
  { id: 'i2', sku: 'MG-RX78', status: 'owned',    verify: 'verified', value: 4800,  listed: true,  photos: 2 },
  { id: 'i3', sku: 'TL-R34',  status: 'owned',    verify: 'shown',    value: 5200,  listed: false, photos: 1 },
  { id: 'i4', sku: 'SS-PF-BM',status: 'owned',    verify: 'claimed',  value: 165000,listed: false, photos: 0 },
  { id: 'i5', sku: 'SHF-GUI', status: 'preorder', verify: 'claimed',  value: 6800,  listed: false, photos: 0,
    order: 'Ordered 12 May', etaPrecision: 'day', etaDay: 20, etaMonth: 5, etaYear: 2026, total: 6800, deposit: 2000, seller: 'BBToyStore' },
  { id: 'i6', sku: 'MG-RX78', status: 'preorder', verify: 'claimed',  value: 4800,  listed: false, photos: 0,
    order: 'Ordered 2 Jun', etaPrecision: 'month', etaMonth: 5, etaYear: 2026, total: 4800, deposit: 1500, seller: 'Hobby Galaxy' },
  { id: 'i7', sku: 'SS-PF-BM',status: 'preorder', verify: 'claimed',  value: 165000,listed: false, photos: 0,
    order: 'Ordered 9 Jun', etaPrecision: 'quarter', etaQuarter: 3, etaYear: 2026, total: 165000, deposit: 50000, seller: 'Sideshow Direct' },
  { id: 'i8', sku: 'MG-RX78', status: 'preorder', verify: 'claimed',  value: 9200,  listed: false, photos: 0,
    order: 'Ordered 18 Jun', etaPrecision: 'year', etaYear: 2027, total: 9200, deposit: 2500, seller: 'Gundam Planet' },
  { id: 'i9', sku: 'SHF-GUI', status: 'preorder', verify: 'claimed',  value: 7400,  listed: false, photos: 0,
    order: 'Ordered 20 Jun', etaPrecision: 'tbd', total: 7400, deposit: 1000, seller: 'Pre-order Hub' },
  { id: 'w1', sku: 'SP-TMWYW',status: 'intel', verify: 'claimed', value: 11000, listed: false, photos: 0, alert: true, intelTarget: 9000 },
  { id: 'w2', sku: '10307',   status: 'intel', verify: 'claimed', value: 52000, listed: false, photos: 0, alert: true, intelTarget: 48000 },
  { id: 'intel3', title: 'Hot Toys MMS · Thor: Love & Thunder', brand: 'Hot Toys', cat: 'figures', scale: '1/6', year: '2026', tone: 'gold',
    status: 'intel', verify: 'claimed', value: 0, listed: false, photos: 0, alert: true, isNewToDb: true, intelTarget: 26000 },
  { id: 'intel4', sku: 'PKM-151-BB', status: 'intel', verify: 'claimed', value: 8500, listed: false, photos: 0, intelTarget: 7500 },
  { id: 'intel5', sku: 'HT-THOR-LT', status: 'intel', verify: 'claimed', value: 0,    listed: false, photos: 0, isNewToDb: true, intelTarget: 26000 },
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
  {
    id: 'pkm-sv151-a', sku: 'PKM-151-BB', seller: 'rohit_scale', posted: '3h', mine: false,
    price: 7800, condition: 'Sealed', condNote: 'Factory sealed EN box, 36 packs. Group buy extra.',
    verify: 'verified', status: 'available', trade: false, qty: 1,
    ships: 'Bangalore · pan-India · ₹250', photos: 2, posted: '3h',
    saves: 22, watching: 9,
  },
  {
    id: 'pkm-sv151-b', sku: 'PKM-151-BB', seller: 'vikram', posted: '1d', mine: false,
    price: 8100, condition: 'Sealed', condNote: 'Sealed. Bought two, keeping one.',
    verify: 'shown', status: 'available', trade: true, qty: 1,
    ships: 'Pune · pan-India · ₹300', photos: 1, posted: '1d',
    saves: 11, watching: 5,
  },
];

// ── Posts (BRD §8.5) — type: showcase | discussion | review ───
const POSTS = [
  {
    id: 'p0', type: 'showcase', user: 'you', time: 'just now', community: 'itm',
    refSku: 'MMS601', tone: 'red', cat: 'figures',
    body: "Finally unboxed the Hot Toys Mark 85 — the detail on the nano-particles is unreal. Worth every rupee. 🔥",
    likes: 0, comments: 0, image: true,
  },
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

  // ── itm posts ──────────────────────────────────────────────
  { id: 'p6', type: 'showcase', user: 'aman_toys', time: '2h', community: 'itm', cat: 'figures',
    refSku: 'MMS601', tone: 'plum',
    body: "Finally completed the Avengers shelf — all 6 Hot Toys in one frame. Mark 85 anchors the centre. The only problem now is I want to add the War Machine and it won't fit.",
    likes: 214, comments: 38, image: true },
  { id: 'p7', type: 'discussion', user: 'vikram', time: '6h', community: 'itm', cat: 'figures',
    body: "For those new to 1/6 — start with Hot Toys Movie Masterpiece over Sideshow PF. The MMS line is more consistent QC and secondary market is stronger in India. Happy to answer questions.",
    likes: 142, comments: 54, image: false },
  { id: 'p8', type: 'review', user: 'meera', time: '1d', community: 'itm', cat: 'figures',
    refSku: 'SHF-GUI', tone: 'gold', rating: 5,
    body: "SHF Goku Ultra Instinct: the articulation is insane. Every pose I try it nails. The effect parts are translucent and catch the light perfectly. Best Figuarts release since SSGSS Vegeta.",
    likes: 189, comments: 31, image: true },
  { id: 'p9', type: 'showcase', user: 'rohit_scale', time: '3h', community: 'itm', cat: 'diecast',
    tone: 'teal',
    body: "Mini GT shelf update — 48 cars now. The R32 Group A is the newest addition and it might be my favourite in the collection. 1/64 scale but the detail is absurd.",
    likes: 96, comments: 22, image: true },
  { id: 'p10', type: 'discussion', user: 'karan_die', time: '8h', community: 'itm', cat: 'diecast',
    body: "Group order for the next Mini GT case closing Friday. We're splitting the NSX case — 4 members confirmed, need 2 more. Comment if you're in, DM for payment details.",
    likes: 67, comments: 18, image: false },
  { id: 'p11', type: 'showcase', user: 'vikram', time: '4d', community: 'itm', cat: 'figures',
    refSku: 'SS-PF-BM', tone: 'ink',
    body: "Sideshow Batman PF finally has a custom light rig. Added a warm amber backlight — completely changes the mood. 9 months of saving, zero regrets.",
    likes: 312, comments: 71, image: true },
  { id: 'p12', type: 'review', user: 'aman_toys', time: '2d', community: 'itm', cat: 'figures',
    tone: 'ink', rating: 4,
    body: "Hot Toys Black Widow Endgame — paint apps on the face are the best I've seen from HT this year. Only complaint: the widow's bites are a bit fiddly. 4/5 overall, strong buy.",
    likes: 134, comments: 29, image: true },
  { id: 'p13', type: 'discussion', user: 'meera', time: '5h', community: 'itm', cat: 'figures',
    body: "PSA on Tamashii Nations web exclusives: AmiAmi and HLJ are still the most reliable middlemen. TOM has faster shipping but charges a premium. Anyone using a newer agent? Curious.",
    likes: 88, comments: 43, image: false },
  { id: 'p14', type: 'showcase', user: 'saanvi', time: '1d', community: 'itm', cat: 'kits',
    tone: 'forest',
    body: "LEGO corner of the shelf got an upgrade — added the botanical collection. The Orchid is deceptively complex. Not a figure but it sparks the same joy.",
    likes: 74, comments: 16, image: true },
  { id: 'p15', type: 'discussion', user: 'rohit_scale', time: '3d', community: 'itm', cat: 'figures',
    body: "What's everyone using for display lighting? I've tried Govee, Philips Hue strips and the Elgato Key Light. Happy to share which worked best for different shelf depths.",
    likes: 156, comments: 62, image: false },
  // ── lego posts ──────────────────────────────────────────────
  { id: 'p16', type: 'showcase', user: 'saanvi', time: '1d', community: 'lego', cat: 'kits',
    tone: 'ink',
    body: "LEGO Titanic done. 9090 pieces over 4 evenings. The split hull is such a clever build technique — photos don't do the size justice. It's 1.3m long.",
    likes: 234, comments: 49, image: true },
  { id: 'p17', type: 'discussion', user: 'saanvi', time: '3h', community: 'lego', cat: 'kits',
    body: "MOC builders — what brick colours are you struggling to source in India? Trying to compile a list for a Bangalore group order from BrickLink. Dark Bluish Grey and Dark Tan seem hardest.",
    likes: 112, comments: 58, image: false },
  { id: 'p18', type: 'review', user: 'meera', time: '2d', community: 'lego', cat: 'kits',
    tone: 'forest', rating: 5,
    body: "Botanicals Orchid 10311 — this set punches way above its piece count. 608 pieces but it looks premium on any shelf. The stem articulation technique is genuinely clever. Instant 5/5.",
    likes: 167, comments: 27, image: true },
  { id: 'p19', type: 'showcase', user: 'rohit_scale', time: '5d', community: 'lego', cat: 'kits',
    tone: 'gold',
    body: "Icons Colosseum finally built after 6 months on the shelf. 9036 pieces, nearly 3 days. The cross-section detail is extraordinary. This is peak LEGO architecture.",
    likes: 198, comments: 44, image: true },
  { id: 'p20', type: 'discussion', user: 'aman_toys', time: '4h', community: 'lego', cat: 'kits',
    body: "Anyone bought from Bricks World or Bangalore Brick Co recently? Prices seem to have gone up post the GST revision. Trying to figure out if ordering direct from LEGO is worth it now.",
    likes: 78, comments: 35, image: false },
  { id: 'p21', type: 'showcase', user: 'saanvi', time: '6h', community: 'lego', cat: 'kits',
    tone: 'forest',
    body: "City MOC corner: added the new fire station wing. Took 3 weeks of planning the road layout. Micro-scale vehicles are hiding in the parking bays.",
    likes: 143, comments: 31, image: true },
  { id: 'p22', type: 'review', user: 'vikram', time: '3d', community: 'lego', cat: 'kits',
    tone: 'gold', rating: 3,
    body: "Technic Bugatti Bolide — I expected more from the flagship Technic set. The exterior is stunning but the interior mechanisms feel sparse. 3/5. The Sian was a better build experience.",
    likes: 89, comments: 52, image: true },
  { id: 'p23', type: 'discussion', user: 'karan_die', time: '1d', community: 'lego', cat: 'kits',
    body: "Is anyone interested in a Bangalore LEGO MOC display at Brick Bash? Saanvi is organising and we need 8 entries minimum. MOC or large set both count.",
    likes: 54, comments: 19, image: false },
  { id: 'p24', type: 'showcase', user: 'saanvi', time: '4d', community: 'lego', cat: 'kits',
    tone: 'gold',
    body: "Rivendell 10316 is everything. 6167 pieces and it still feels too quick to build. The elvish arches technique is something else. Library scene is my favourite micro vignette.",
    likes: 276, comments: 68, image: true },
  { id: 'p25', type: 'discussion', user: 'meera', time: '8h', community: 'lego', cat: 'kits',
    body: "For storage nerds: the Ikea Kallax with Lego sorting bins has been a game changer. Happy to photograph my setup if anyone wants the measurements for the drawer units.",
    likes: 121, comments: 47, image: false },
  // ── jdm posts ──────────────────────────────────────────────
  { id: 'p26', type: 'showcase', user: 'karan_die', time: '4h', community: 'jdm', cat: 'diecast',
    refSku: 'TL-R34', tone: 'teal',
    body: "Tomica Limited Vintage Neo haul arrived. R34 Skyline, R32 Group A and the new FD RX-7 in the same box. The R34 in Bayside Blue is still the benchmark for 1/64 tampos.",
    likes: 178, comments: 42, image: true },
  { id: 'p27', type: 'discussion', user: 'rohit_scale', time: '2h', community: 'jdm', cat: 'diecast',
    body: "Tomica vs Mini GT in 2025 — the gap has narrowed a lot. Mini GT still wins on livery accuracy but Tomica Premium has better metal weight and opening parts. Fight me.",
    likes: 234, comments: 87, image: false },
  { id: 'p28', type: 'review', user: 'karan_die', time: '1d', community: 'jdm', cat: 'diecast',
    tone: 'teal', rating: 5,
    body: "Inno64 Honda Civic EK9 Type R — the opening bonnet and engine bay detail at 1/64 is absurd. This is why Inno64 has been eating Mini GT's lunch on JDM nameplates. Full 5/5.",
    likes: 156, comments: 29, image: true },
  { id: 'p29', type: 'showcase', user: 'vikram', time: '3d', community: 'jdm', cat: 'diecast',
    tone: 'gold',
    body: "Diecast corner finally lit. 64 cars across 4 shelves. The Hot Wheels RLC Porsche 917 LH is the current pride of the shelf — that Gulf livery in 1/64 is chef's kiss.",
    likes: 112, comments: 24, image: true },
  { id: 'p30', type: 'discussion', user: 'aman_toys', time: '6h', community: 'jdm', cat: 'diecast',
    body: "1/64 beginners guide I wish I had: start with Mini GT JDM nameplates, avoid Hot Wheels mainline for display (inconsistent QC), and never pay above ₹3500 for a single unless it's RLC.",
    likes: 189, comments: 61, image: false },
  { id: 'p31', type: 'showcase', user: 'meera', time: '5d', community: 'jdm', cat: 'diecast',
    tone: 'teal',
    body: "Mini GT JDM wall done. 3×3 acrylic risers, back-lit with Govee. The NSX and R32 are the standouts. Lighting makes such a difference at this scale.",
    likes: 94, comments: 18, image: true },
  { id: 'p32', type: 'review', user: 'rohit_scale', time: '6h', community: 'jdm', cat: 'diecast',
    tone: 'ink', rating: 4,
    body: "Mini GT Nissan R32 Group A: accuracy is excellent, tampos crisp, the livery colours are true. Minor gripe — the wheels feel slightly underscale. But at ₹2100 this is the best value in 1/64 right now. 4/5.",
    likes: 143, comments: 33, image: true },
  { id: 'p33', type: 'discussion', user: 'karan_die', time: '2d', community: 'jdm', cat: 'diecast',
    body: "RLC vs Premium — is the price jump worth it? The Porsche 917 LH is ₹3800 vs ₹400 mainline. Both are the same tooling but the RLC has real rubber and better paint. For display, always RLC.",
    likes: 132, comments: 49, image: false },
  { id: 'p34', type: 'showcase', user: 'karan_die', time: '8h', community: 'jdm', cat: 'diecast',
    tone: 'red',
    body: "Group order arrived — NSX case split complete. Everyone got their cars. The chase showed up too — going to the member who called it first. Thanks all for the trust.",
    likes: 87, comments: 14, image: true },
  { id: 'p35', type: 'discussion', user: 'vikram', time: '1d', community: 'jdm', cat: 'diecast',
    body: "What makes a great 1/64? For me: correct proportions first, then livery accuracy, then texture. A model with perfect proportions but average tampos beats the reverse every time. What's your priority?",
    likes: 168, comments: 74, image: false },
  // ── kaiju posts ──────────────────────────────────────────────
  { id: 'p36', type: 'showcase', user: 'meera', time: '3h', community: 'kaiju', cat: 'designer',
    refSku: 'SP-TMWYW', tone: 'plum',
    body: "Pulled a secret chase from the Skullpanda Tell Me What You Want case — 1/72 odds. This is officially the best blind box day of my life. The all-gold colourway is unreal in person.",
    likes: 342, comments: 89, image: true },
  { id: 'p37', type: 'discussion', user: 'rohit_scale', time: '1h', community: 'kaiju', cat: 'designer',
    body: "Pop Mart drop strategy that actually works: set 3 alarms for 6pm, use mobile data not WiFi, add to cart before the official start time. Your cart holds for 3 mins. Go.",
    likes: 278, comments: 112, image: false },
  { id: 'p38', type: 'review', user: 'aman_toys', time: '2d', community: 'kaiju', cat: 'designer',
    tone: 'ink', rating: 4,
    body: "Bearbrick 400% Kaws Companion: the flocking texture is perfect and the painted details are crisp. Scale is imposing on a shelf. Docked one star only because the feet don't sit perfectly flat. 4/5.",
    likes: 198, comments: 43, image: true },
  { id: 'p39', type: 'showcase', user: 'meera', time: '6d', community: 'kaiju', cat: 'designer',
    tone: 'plum',
    body: "Blind box haul from the last two weeks: 3 Labubu, 2 Skullpanda, 1 Molly. Hit zero chases but the regular pulls are all great sculpts. The Labubu Monsters are the best series Pop Mart has done.",
    likes: 156, comments: 37, image: true },
  { id: 'p40', type: 'discussion', user: 'saanvi', time: '4h', community: 'kaiju', cat: 'designer',
    body: "Anyone want to split a Pop Mart case? I'm doing the new Skullpanda Series 3 — 12 boxes, splitting evenly. ₹1,200/box, I'll document the unboxing live on the community. DM if interested.",
    likes: 89, comments: 34, image: false },
  { id: 'p41', type: 'showcase', user: 'vikram', time: '4d', community: 'kaiju', cat: 'designer',
    tone: 'ink',
    body: "Designer toy corner: Bearbrick 1000% Darth Vader finally has its shelf. At this scale it's genuinely a piece of furniture. The 400% companion looks tiny next to it.",
    likes: 223, comments: 51, image: true },
  { id: 'p42', type: 'review', user: 'karan_die', time: '3d', community: 'kaiju', cat: 'designer',
    tone: 'plum', rating: 5,
    body: "KAWS Companion BFF (OG colourway) — five years later and this is still the best entry point into designer toys. Proportions are iconic. Secondary market has only gone one direction. 5/5.",
    likes: 187, comments: 62, image: true },
  { id: 'p43', type: 'discussion', user: 'meera', time: '1d', community: 'kaiju', cat: 'designer',
    body: "Chase hunting ethics: if you pull a chase and resell, is ₹8k over retail too much? I say no — 1/72 odds means risk was real. Curious what others think.",
    likes: 134, comments: 93, image: false },
  { id: 'p44', type: 'showcase', user: 'rohit_scale', time: '8h', community: 'kaiju', cat: 'designer',
    tone: 'plum',
    body: "Unboxed the new Labubu Monsters Series 2 case. 12 boxes, got 7 unique pulls. No chase but the Zombie colourway is surprisingly detailed for a blind box. Happy with this case.",
    likes: 112, comments: 28, image: true },
  { id: 'p45', type: 'discussion', user: 'aman_toys', time: '2d', community: 'kaiju', cat: 'designer',
    body: "Secondary market for designer toys in India is maturing fast. Skullpanda chases are now ₹15k-18k vs ₹800 retail. Anyone here selling their chases or holding long-term?",
    likes: 167, comments: 78, image: false },
  // ── grails posts ──────────────────────────────────────────────
  { id: 'p46', type: 'showcase', user: 'vikram', time: '5h', community: 'grails', cat: 'figures',
    refSku: 'SS-PF-BM', tone: 'ink',
    body: "Six years of hunting, finally mine. Sideshow Batman PF EX edition, low number, double-boxed shipper intact. This community is part of why I kept the faith. Thank you.",
    likes: 428, comments: 94, image: true },
  { id: 'p47', type: 'discussion', user: 'vikram', time: '1d', community: 'grails', cat: 'figures',
    body: "Authentication checklist for Sideshow PF: check the certificate number against Sideshow's registry (they'll confirm via email), verify cape stitching direction, weigh the base — recasts are always lighter.",
    likes: 312, comments: 67, image: false },
  { id: 'p48', type: 'review', user: 'aman_toys', time: '3d', community: 'grails', cat: 'figures',
    tone: 'ink', rating: 4,
    body: "Prime 1 vs Sideshow at the same price point: Prime 1 wins on sheer detail but Sideshow has better long-term support and resale. For first-time statue buyers I still recommend Sideshow. 4/5 for Prime 1.",
    likes: 234, comments: 58, image: true },
  { id: 'p49', type: 'showcase', user: 'aman_toys', time: '6d', community: 'grails', cat: 'figures',
    tone: 'red',
    body: "Hot Toys shelf — full MCU lineup. The dedication to getting these all in-hand took 4 years. The Mark 85 and Thanos are the anchors. Display glass installed last month.",
    likes: 356, comments: 82, image: true },
  { id: 'p50', type: 'discussion', user: 'meera', time: '2h', community: 'grails', cat: 'figures',
    body: "Recast detection thread: the most reliable tell I've found for Sideshow pieces is the cape liner — recasts use a different weave and the silver interior paint is too uniform. Photos available if you want examples.",
    likes: 289, comments: 71, image: false },
  { id: 'p51', type: 'showcase', user: 'vikram', time: '2d', community: 'grails', cat: 'figures',
    tone: 'red',
    body: "XM Studios Cyclops slot just confirmed. EX edition with light-up visor. Expected Q4. This will be the centrepiece of the X-Men corner. Patience finally rewarded.",
    likes: 178, comments: 44, image: false },
  { id: 'p52', type: 'review', user: 'vikram', time: '4d', community: 'grails', cat: 'figures',
    tone: 'ink', rating: 5,
    body: "Sideshow PF EX vs standard: the EX interchangeable head and bonus accessory are always worth the premium at the time of release. On secondary market the EX holds value 40-60% better. Buy EX if you can.",
    likes: 267, comments: 53, image: false },
  { id: 'p53', type: 'discussion', user: 'rohit_scale', time: '7h', community: 'grails', cat: 'figures',
    body: "Grail strategy that worked for me: watch the Sideshow retirement list, not the new releases. A retiring PF that's already numbered sells faster on secondary. Bought my Spider-Man PF the week before it retired.",
    likes: 198, comments: 61, image: false },
  { id: 'p54', type: 'showcase', user: 'vikram', time: '1d', community: 'grails', cat: 'figures',
    tone: 'ink',
    body: "Custom display for the premium format corner — recessed lighting, mirrored back panel. At ₹1.5L+ per piece, the display should match the investment. Total setup cost was ₹18k, worth every rupee.",
    likes: 312, comments: 76, image: true },
  { id: 'p55', type: 'discussion', user: 'aman_toys', time: '3d', community: 'grails', cat: 'figures',
    body: "Insurance for high-value collectibles in India — anyone have a policy that actually covers statues? Standard home contents doesn't. Heard Tata AIG does a fine art rider but the process is opaque.",
    likes: 143, comments: 88, image: false },
  // ── mfh posts ──────────────────────────────────────────────
  { id: 'p56', type: 'showcase', user: 'aman_toys', time: '4h', community: 'mfh', cat: 'figures',
    tone: 'gold',
    body: "Hot Toys Thor Love & Thunder just arrived. The hair sculpt is the best HT have done since Iron Man. Posting a detailed unboxing video to the community tonight.",
    likes: 67, comments: 19, image: true },
  { id: 'p57', type: 'discussion', user: 'vikram', time: '2d', community: 'mfh', cat: 'figures',
    body: "Mumbai collector spots worth visiting: Crossword Bandra for LEGO, Hamleys Lower Parel for Bandai, and the Dharavi toy market for vintage finds. Anyone has more to add to the list?",
    likes: 43, comments: 28, image: false },
  { id: 'p58', type: 'review', user: 'meera', time: '1d', community: 'mfh', cat: 'figures',
    tone: 'red', rating: 4,
    body: "Hot Toys Thanos: the face sculpt nails Brolin's likeness. Gauntlet stones are individually lit and the Infinity Gauntlet swappable is a nice touch. Only gripe — base feels cheap for a ₹24k figure. 4/5.",
    likes: 54, comments: 14, image: true },
  { id: 'p59', type: 'showcase', user: 'aman_toys', time: '3d', community: 'mfh', cat: 'figures',
    refSku: 'MMS601', tone: 'red',
    body: "Shelf update — added custom acrylic risers and backlighting this weekend. The Mark 85 is centre stage. The difference lighting makes is night and day. Used Govee T1 strips.",
    likes: 88, comments: 21, image: true },
  { id: 'p60', type: 'discussion', user: 'rohit_scale', time: '6h', community: 'mfh', cat: 'figures',
    body: "Group buy for the STARS Hot Toys set — need 4 members at ₹6,500 each for a combined order from Mumbai distributor. Saves about ₹1,800 per unit on shipping. DM if you want in.",
    likes: 31, comments: 12, image: false },
  { id: 'p61', type: 'showcase', user: 'vikram', time: '5d', community: 'mfh', cat: 'figures',
    tone: 'ink',
    body: "New display unit installed — custom glass cabinet with UV protection glass. Finally the Sideshow pieces have proper dust-free display. These pieces deserve the upgrade.",
    likes: 72, comments: 17, image: true },
  { id: 'p62', type: 'discussion', user: 'aman_toys', time: '1d', community: 'mfh', cat: 'figures',
    body: "Mumbai meetup planning for July — thinking Phoenix Marketcity again but open to suggestions. Last time we had 18 people, aiming for 25+ this time. Confirm availability in comments.",
    likes: 46, comments: 34, image: false },
  { id: 'p63', type: 'showcase', user: 'meera', time: '8h', community: 'mfh', cat: 'figures',
    tone: 'gold',
    body: "Mumbai haul from last week: Goku UI, Kefla PO confirmed, and stumbled on an old Vegeta Blue at a shop in Andheri for ₹4,200. Good day for the collection.",
    likes: 58, comments: 16, image: true },
  // ── tcgindia posts ──────────────────────────────────────────
  { id: 'p64', type: 'showcase', user: 'rohit_scale', time: '2h', community: 'tcgindia', cat: 'tcg',
    tone: 'red',
    body: "Pulled a golden Charizard ex from the SV 151 box — been hunting this one for weeks. The holo shimmer on the new SV cards is on another level. 🔥",
    likes: 312, comments: 78, image: true },
  { id: 'p65', type: 'discussion', user: 'meera', time: '6h', community: 'tcgindia', cat: 'tcg',
    body: "One Piece OP-07 vs OP-08 — which set are you pulling for? The Gear 5 Luffy SR in OP-07 is insane but OP-08's Blackbeard lineup looks equally stacked.",
    likes: 189, comments: 54, image: false },
  { id: 'p66', type: 'review', user: 'karan_die', time: '1d', community: 'tcgindia', cat: 'tcg',
    tone: 'gold', rating: 4,
    body: "Dragon Ball Super Card Game Fusion World — gameplay is surprisingly deep for a newcomer TCG. Card quality excellent, art gorgeous. 4/5 — only held back by limited India distribution.",
    likes: 134, comments: 31, image: true },
  { id: 'p67', type: 'showcase', user: 'aman_toys', time: '3h', community: 'tcgindia', cat: 'tcg',
    tone: 'plum',
    body: "Sealed booster box collection — 3 Pokémon boxes sitting pristine on the shelf. SV 151 and Temporal Forces are long-term holds for me. Not pulling these.",
    likes: 98, comments: 22, image: true },
  { id: 'p68', type: 'discussion', user: 'vikram', time: '4h', community: 'tcgindia', cat: 'tcg',
    body: "PSA grading in India — worth it? Sending to the US adds 3–4 months and ₹3,000+ fees. But a PSA 10 Charizard commands ₹40k+ vs ₹8k raw. The math checks out for true grails.",
    likes: 234, comments: 67, image: false },
  { id: 'p69', type: 'poll', user: 'rohit_scale', time: '8h', community: 'tcgindia', cat: 'tcg',
    body: "Group break for the new Pokémon Stellar Crown set — 6 spots at ₹1,200 each. Live unboxing stream. Who's in?",
    likes: 87, comments: 29, image: false,
    poll: [
      { label: "I'm in!", votes: 52 },
      { label: 'Interested — DM me', votes: 28 },
      { label: 'Not this time', votes: 14 },
    ] },
  { id: 'p70', type: 'showcase', user: 'saanvi', time: '2d', community: 'tcgindia', cat: 'tcg',
    tone: 'teal',
    body: "60 pages of One Piece cards and the binder is still growing. The art direction on the OP sets is genuinely beautiful — Bandai has set a new bar for TCG card art.",
    likes: 156, comments: 38, image: true },
  { id: 'p71', type: 'discussion', user: 'aman_toys', time: '5h', community: 'tcgindia', cat: 'tcg',
    body: "Storage question — 9-pocket binders or top-loaders for holos? I've moved my rares to top-loaders + team bags but the binder is so much easier to browse. What's your setup?",
    likes: 112, comments: 49, image: false },
  { id: 'p72', type: 'showcase', user: 'vikram', time: '3d', community: 'tcgindia', cat: 'tcg',
    tone: 'ink',
    body: "MTG corner — Bloomburrow collector box sealed alongside the Commander precons. The foil treatments this set are next-level. Waiting for rotation before I crack it.",
    likes: 143, comments: 27, image: true },
];

// ── Admin / release posts (BRD §10 return loop) ───────────────
const ADMIN_POSTS = [
  { id: 'a1', time: '2h', cat: 'figures', title: 'New release · Bandai Goku Ultra Instinct',
    body: 'POs open Friday 6pm IST. Limited to 1 per account at retail. Add it to your Intel to get notified.', sku: 'SHF-GUI', tone: 'gold' },
  { id: 'a2', time: '1d', cat: 'kits', title: 'Restock · LEGO Icons Eiffel Tower 10307',
    body: 'Back in stock at Indian distributors this week after a long gap.', sku: '10307', tone: 'gold' },
];

// ── Communities (BRD §8.8) — Facebook-Groups-style ───────────
// privacy: 'public' (anyone joins instantly, posts visible to all)
//        | 'private' (request to join; posts/members hidden until approved)
const COMMUNITIES = [
  { id: 'itm',   name: 'Indian Toy Maniacs', members: 4892, founder: 'rohit_scale', tone: 'plum', cat: 'figures',
    short: 'The OG India figure & diecast community.', tag: 'iT', joined: true, posts: 2140, privacy: 'public',
    rules: ['In-hand or clear PO terms only', 'No recasts / KOs', 'Be decent — trades are off-platform, vouch after'] },
  { id: 'lego',  name: 'Bricks Bangalore', members: 2134, founder: 'saanvi', tone: 'forest', cat: 'kits',
    short: 'Lego AFOLs, MOC builds, scarce sets.', tag: 'Bb', joined: false, posts: 980, privacy: 'public',
    rules: ['Original builds welcome', 'Mark sealed vs opened', 'Credit MOC designers'] },
  { id: 'jdm',   name: 'JDM Diecast Crew', members: 1678, founder: 'karan_die', tone: 'teal', cat: 'diecast',
    short: 'Tomica, Inno64, Mini GT — 1/64 obsessives.', tag: 'JD', joined: true, posts: 1320, privacy: 'public',
    rules: ['Scale + brand in every post', 'Photos in natural light preferred'] },
  { id: 'kaiju', name: 'Kaiju & Vinyl', members: 934, founder: 'meera', tone: 'red', cat: 'designer',
    short: 'Designer toy drops, blind boxes, soft vinyl.', tag: 'Kv', joined: false, posts: 540, privacy: 'public',
    rules: ['Tag blind-box reveals', 'No chase-figure scalping talk'] },
  { id: 'grails',name: 'Grail Hunters India', members: 612, founder: 'vikram', tone: 'ink', cat: 'figures',
    short: 'High-end statues, premium format, recast watch.', tag: 'Gh', joined: false, posts: 410, privacy: 'private', invite: true,
    rules: ['Invite-only', 'Provenance matters — show your shipper', 'Recast tells get pinned'] },
  { id: 'tcgindia', name: 'TCG India', members: 1842, founder: 'rohit_scale', tone: 'red', cat: 'tcg',
    short: 'Pokémon, One Piece, MTG & all TCGs — pulls, trades & breaks.', tag: 'Ti', joined: false, posts: 720, privacy: 'public',
    rules: ['Always specify EN vs JP print', 'Card condition: NM / LP / MP / HP', 'No proxy or fake card trading'] },
  // a community YOU run — so the admin tools are explorable out of the box
  { id: 'mfh',   name: 'Mumbai Figure Heads', members: 214, founder: 'you', tone: 'gold', cat: 'figures',
    short: 'Mumbai-based 1/6 & statue collectors. Meets, group buys, display nights.', tag: 'MF', joined: true, posts: 96, privacy: 'private',
    rules: ['Mumbai collectors first', 'Show in-hand photos', 'No recast talk', 'Be kind — vouch after trades'] },
];

// Join requests waiting on an admin (private communities) — handles
const COM_JOIN_REQUESTS = {
  mfh: ['saanvi', 'karan_die', 'meera'],
};
// Posts awaiting approval (approval-mode / private communities)
const COM_PENDING_POSTS = {
  mfh: [
    { id: 'pp1', author: 'aman_toys', type: 'showcase', time: '2h', text: 'Finally completed my Hot Toys Avengers line-up — full shelf shot. Worth a post here?', tone: 'red' },
    { id: 'pp2', author: 'vikram', type: 'discussion', time: '5h', text: 'Anyone up for a group buy on the new Prime 1 Batman? Trying to split shipping from the US.', tone: 'ink' },
  ],
};
// Seed member rosters (admins are merged in by membersOf)
const COM_MEMBERS = {
  mfh: ['you', 'aman_toys', 'rohit_scale', 'vikram', 'meera', 'saanvi', 'karan_die'],
};

// ── Events (BRD §8.9 / §9.13) ─────────────────────────────────
// Facebook-style: no tickets/QR. People RSVP Going / Interested.
// status: 'approved' | 'pending' (every event is approved by the app owner)
// going: seed attendee handles (the live "who's going" list)
const EVENTS = [
  { id: 'mumbai4', title: 'Mumbai Collector Meet · Vol 4', day: 'Sat', date: '24', month: 'May',
    when: 'Sat · 24 May · 4:00 – 8:00 pm', time: '4:00 pm', endTime: '8:00 pm',
    where: 'Phoenix Marketcity, Kurla', mode: 'In person', city: 'Mumbai',
    cats: ['figures', 'diecast'], status: 'approved', host: 'rohit_scale', community: 'itm',
    going: ['rohit_scale', 'aman_toys', 'meera', 'vikram', 'karan_die', 'saanvi'],
    interested: ['meera', 'karan_die'],
    bring: 'Bring up to 3 pieces to display or trade.',
    about: 'Our biggest meet yet. Bring 3 pieces to display or trade. Verified sellers get a table. Group dinner after.' },
  { id: 'blr3', title: 'Bengaluru Brick Bash · Vol 3', day: 'Sun', date: '08', month: 'Jun',
    when: 'Sun · 08 Jun · 11:00 am – 3:00 pm', time: '11:00 am', endTime: '3:00 pm',
    where: 'Lalbagh Glass House, Bangalore', mode: 'In person', city: 'Bangalore',
    cats: ['kits'], status: 'approved', host: 'saanvi', community: 'lego',
    going: ['saanvi', 'rohit_scale', 'aman_toys'],
    interested: ['vikram'],
    bring: 'Bring a MOC to show or spare parts to swap.',
    about: 'MOC showcase + a swap table for spare parts. Family-friendly. Best build wins a sealed set.' },
  { id: 'delhi2', title: 'Delhi Diecast Showdown', day: 'Sat', date: '14', month: 'Jun',
    when: 'Sat · 14 Jun · 2:00 – 6:00 pm', time: '2:00 pm', endTime: '6:00 pm',
    where: 'Select Citywalk, Saket', mode: 'In person', city: 'Delhi',
    cats: ['diecast'], status: 'approved', host: 'karan_die', community: 'jdm',
    going: ['karan_die', 'vikram', 'rohit_scale', 'meera'],
    interested: [],
    bring: 'Bring your 1/64 for the custom-livery contest.',
    about: '1/64 trade tables, a custom-livery contest, and a group order for the next Mini GT case.' },
  { id: 'blrcon', title: 'South India Toy Convention 2026', day: 'Sat', date: '28', month: 'Jun',
    when: 'Sat 28 – Sun 29 Jun · 10:00 am – 7:00 pm', time: '10:00 am', endTime: '7:00 pm',
    endDate: '29', endMonth: 'Jun', multiDay: true,
    where: 'KTPO Trade Centre, Whitefield', mode: 'In person', city: 'Bangalore',
    cats: ['figures', 'designer', 'kits', 'diecast'], status: 'approved', host: 'rohit_scale', community: 'itm',
    going: ['rohit_scale', 'meera', 'vikram', 'aman_toys', 'karan_die', 'saanvi'],
    interested: ['aman_toys'],
    bring: 'Bring pieces to display or trade. Sign up to join the event community for updates.',
    about: 'Two halls, 40+ seller tables, artist alley and a grail auction. Join the event community for updates and to meet attendees before the day.' },
  { id: 'tcgopen1', title: 'Pokémon TCG Open · Mumbai', day: 'Sat', date: '05', month: 'Jul',
    when: 'Sat · 05 Jul · 12:00 – 6:00 pm', time: '12:00 pm', endTime: '6:00 pm',
    where: 'Timezone, Infinity Mall, Andheri', mode: 'In person', city: 'Mumbai',
    cats: ['tcg'], status: 'approved', host: 'rohit_scale', community: 'tcgindia',
    going: ['rohit_scale', 'meera', 'saanvi'],
    interested: ['aman_toys', 'karan_die'],
    bring: 'Bring a 60-card deck or sealed product to trade.',
    about: 'Casual Pokémon TCG play + a sealed-product swap table. All formats welcome — Scarlet & Violet Standard and Expanded. Prizes for best deck build.' },
  // past / archived
  { id: 'pune1', title: 'Pune Collector Mixer · Vol 2', day: 'Sun', date: '20', month: 'Apr',
    when: 'Sun · 20 Apr · 3:00 – 7:00 pm', time: '3:00 pm', endTime: '7:00 pm',
    where: 'Seasons Mall, Magarpatta', mode: 'In person', city: 'Pune',
    cats: ['figures'], status: 'approved', past: true, host: 'vikram', community: 'itm',
    going: ['vikram', 'rohit_scale', 'aman_toys', 'meera'],
    interested: [],
    bring: 'Bring pieces to display or trade.',
    about: 'A relaxed afternoon of display, trades and chai. Thanks to everyone who came out.' },
];

function event(id, extra) {
  const all = [...(extra || []), ...EVENTS];
  return all.find(e => e.id === id);
}

// ── Deals / trade history (BRD §8.1 Deal) ─────────────────────
const TRADE_HISTORY = [
  { id: 'd1', with: 'rohit_scale', item: 'Tomica Limited · Mazda RX-7 FD', dir: 'Sold', when: 'Apr 2026', rating: 5 },
  { id: 'd2', with: 'meera', item: 'SH Figuarts · Vegeta', dir: 'Bought', when: 'Mar 2026', rating: 5 },
  { id: 'd3', with: 'karan_die', item: 'Mini GT · Lancer Evo X', dir: 'Traded', when: 'Feb 2026', rating: 4 },
];

// ── Notifications (BRD §8.10) ─────────────────────────────────
const NOTIFICATIONS = [
  { id: 'n1', kind: 'intel', text: 'A Pop Mart Skullpanda in your Intel is now listed for ₹9,600.', time: '8m', unread: true, ref: { type: 'listing', id: 'popmart-skull' } },
  { id: 'n2', kind: 'deal', user: 'rohit_scale', text: 'wants to confirm your deal on the Iron Man Mark 85.', time: '20m', unread: true, ref: { type: 'chat', id: 'rohit_scale' } },
  { id: 'n3', kind: 'vouch', user: 'saanvi', text: 'left you a trade vouch.', time: '1h', unread: true, ref: { type: 'profile', id: 'saanvi' } },
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
  deals: 6, response: '~25 min', activeListings: 1,
  vouchesReceived: 12, vouchesGiven: 9,
  xp: 1240, xpWeek: 180, xpMonth: 720,
  contrib: { social: 560, posts: 340, collection: 240, market: 100 },
  seasonBadges: [
    ...Array.from({length: 30}, (_, i) => ({ id: `you-gold-${i}`, period: 'Season', kind: 'weekly', place: 1, tier: 'gold', title: `Gold Badge` })),
    ...Array.from({length: 5},  (_, i) => ({ id: `you-silver-${i}`, period: 'Season', kind: 'weekly', place: 2, tier: 'silver', title: `Silver Badge` })),
    ...Array.from({length: 3},  (_, i) => ({ id: `you-bronze-${i}`, period: 'Season', kind: 'weekly', place: 3, tier: 'bronze', title: `Bronze Badge` })),
  ],
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
const OWN_LABELS = { figures: 'action figures', designer: 'designer toys & blind boxes', kits: 'kits & Lego', diecast: 'diecast', tcg: 'trading cards' };

// ── Community posting mode (§9.12): open | approval ───────────
const COM_POSTMODE = { grails: 'approval', kaiju: 'approval' };
// ── Visible admins / mods per community (§9.12) ─────────────
const COM_ADMINS = {
  itm:    [{ handle: 'rohit_scale', role: 'Founder' }, { handle: 'aman_toys', role: 'Mod' }],
  lego:   [{ handle: 'saanvi', role: 'Founder' }],
  jdm:    [{ handle: 'karan_die', role: 'Founder' }, { handle: 'vikram', role: 'Mod' }],
  kaiju:  [{ handle: 'meera', role: 'Founder' }],
  grails:    [{ handle: 'vikram', role: 'Founder' }, { handle: 'rohit_scale', role: 'Mod' }],
  tcgindia:  [{ handle: 'rohit_scale', role: 'Founder' }, { handle: 'meera', role: 'Mod' }],
  mfh:       [{ handle: 'you', role: 'Founder' }, { handle: 'aman_toys', role: 'Mod' }],
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
function addToCatalogue(entry) { CATALOGUE.push(entry); }
function user(h) { return USERS[h] || ME; }
function listing(id) { return LISTINGS.find(l => l.id === id) || MARKET_SEED.find(l => l.id === id); }
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
// Roster of member handles for a community — admins first, then seed members, then a sample of users.
function membersOf(id) {
  const admins = adminsOf(id).map(a => a.handle);
  const seed = COM_MEMBERS[id] || [];
  const extra = Object.keys(USERS);
  const all = [...admins, ...seed, ...extra];
  return all.filter((h, i) => all.indexOf(h) === i);   // dedupe, preserve order
}
function joinRequestsOf(id) { return COM_JOIN_REQUESTS[id] || []; }
function pendingPostsOf(id) { return COM_PENDING_POSTS[id] || []; }
function roleOf(id, handle) { const a = adminsOf(id).find(x => x.handle === handle); return a ? a.role : null; }
// ownership-stats parts, e.g. ['58 action figures', '13 designer toys']
function ownStats(u) {
  let owns;
  if (u.handle === 'you') {
    owns = {};
    MY_ITEMS.filter(i => i.status !== 'wishlist' && i.status !== 'intel').forEach(i => {
      const c = cat(i.sku); if (!c) return; owns[c.cat] = (owns[c.cat] || 0) + 1;
    });
  } else owns = OWNS[u.handle] || {};
  return Object.entries(owns).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${OWN_LABELS[k] || k}`);
}

// ── Engagement rewards: Collector XP, tiers & ways to earn ─────
// XP is earned for engagement; tier (rank) is derived from lifetime XP.
const REWARD_TIERS = [
  { id: 'rookie',    name: 'Rookie',    at: 0,     c: 'var(--ink-mute)',        icon: Icons.box,     perk: 'Welcome to the shelf' },
  { id: 'hunter',   name: 'Hunter',    at: 300,   c: 'var(--forest)',          icon: Icons.sparkle, perk: 'Profile flair unlocked' },
  { id: 'collector',name: 'Collector', at: 1000,  c: 'var(--verified-teal)',   icon: Icons.medal,   perk: 'Early drop alerts' },
  { id: 'curator',  name: 'Curator',   at: 3000,  c: 'var(--plum)',            icon: Icons.gem,     perk: 'Showcases get featured' },
  { id: 'archivist',name: 'Archivist', at: 7500,  c: 'var(--grail-gold-deep)', icon: Icons.flame,   perk: 'Priority verification' },
  { id: 'legend',   name: 'Legend',    at: 15000, c: 'var(--stamp-red)',       icon: Icons.crown,   perk: 'Legend badge + spotlight' },
  { id: 'icon',     name: 'Icon',      at: 30000, c: '#1A1A1A',               icon: Icons.crown,   perk: 'Hall of Fame · Icon status' },
];
// Contributor archetype — derived from a member's contribution MIX (their
// dominant way of adding value), independent of total XP / rank.
const ARCHETYPES = {
  posts:      { id: 'posts',      name: 'Showcaser',  icon: Icons.camera, c: 'var(--plum)',          blurb: 'Shares the most builds & photos' },
  social:     { id: 'social',     name: 'Connector',  icon: Icons.heart,  c: 'var(--stamp-red)',     blurb: 'Likes, comments & lifts the community' },
  collection: { id: 'collection', name: 'Archivist',  icon: Icons.gem,    c: 'var(--verified-teal)', blurb: 'Catalogs & verifies the deepest shelf' },
  market:     { id: 'market',     name: 'Trader',     icon: Icons.swap,   c: 'var(--grail-gold-deep)', blurb: 'Most active in deals & trades' },
};
const CONTRIB_LABELS = { posts: 'Showcases', social: 'Community', collection: 'Collection', market: 'Market' };
function archetypeOf(u) {
  const c = u.contrib || {};
  let best = 'social', max = -1;
  Object.keys(c).forEach(k => { if (c[k] > max) { max = c[k]; best = k; } });
  return ARCHETYPES[best];
}
function contribMix(u) {
  const c = u.contrib || {};
  const total = Object.values(c).reduce((a, b) => a + b, 0) || 1;
  return ['posts', 'social', 'collection', 'market']
    .map(k => ({ key: k, label: CONTRIB_LABELS[k], val: c[k] || 0, pct: Math.round(((c[k] || 0) / total) * 100), arche: ARCHETYPES[k] }))
    .sort((a, b) => b.val - a.val);
}
const EARN_ACTIONS = [
  { id: 'profile',  label: 'Complete your profile', xp: 100, icon: Icons.user,     type: 'once',  progress: { done: 3, total: 5 }, nav: { name: 'edit-profile' } },
  { id: 'refer',    label: 'Refer a friend',         xp: 150, icon: Icons.gift,     type: 'repeat', nav: { name: 'refer' } },
  { id: 'db_new',   label: 'Add new item to Scorred DB', xp: 50, icon: Icons.eye,  type: 'repeat', nav: { name: 'add-listing' }, note: 'First to add earns +50 XP' },
  { id: 'showcase', label: 'Post a showcase',        xp: 25,  icon: Icons.camera,  type: 'repeat', nav: { name: 'compose', mode: 'showcase' } },
  { id: 'review',   label: 'Write a review',         xp: 15,  icon: Icons.star,    type: 'repeat', nav: { name: 'compose', mode: 'review' } },
  { id: 'vouch',    label: 'Vouch for a collector',  xp: 15,  icon: Icons.shield,  type: 'repeat', nav: { name: 'search' } },
  { id: 'event',    label: 'RSVP to an event',       xp: 10,  icon: Icons.calendar,type: 'repeat', nav: { name: 'events' } },
  { id: 'comment',  label: 'Comment on a post',      xp: 10,  icon: Icons.comment, type: 'repeat', nav: { name: 'feed' } },
  { id: 'checkin',  label: 'Daily check-in',         xp: 5,   icon: Icons.zap,     type: 'daily',  nav: { name: 'feed' } },
  { id: 'like',     label: 'Like a post',            xp: 1,   icon: Icons.heart,   type: 'repeat', nav: { name: 'feed' } },
];
function tierIndexOf(xp) { let idx = 0; REWARD_TIERS.forEach((t, i) => { if (xp >= t.at) idx = i; }); return idx; }
function tierOf(xp) { return REWARD_TIERS[tierIndexOf(xp)]; }
function nextTierOf(xp) { return REWARD_TIERS[tierIndexOf(xp) + 1] || null; }

// ── Season badges: granted when a leaderboard cycle ends ───────
// Standings reset every cycle; the badge you earn is permanent (Duolingo-
// league model). Top finishers also bank bonus XP toward their lifetime rank.
const BADGE_TIERS = {
  gold:     { fill: '#F0C04A', ink: '#5A3D00', ring: '#CE991C', label: '1st place' },
  silver:   { fill: '#C6CCD4', ink: '#3D434C', ring: '#9BA3AD', label: '2nd place' },
  bronze:   { fill: '#D49A66', ink: '#4A2C12', ring: '#B27B43', label: '3rd place' },
  finalist: { fill: 'var(--bone)', ink: 'var(--verified-teal)', ring: 'var(--verified-teal)', label: 'Top 10' },
};
const BADGE_KIND = {
  weekly: { icon: Icons.medal, label: 'Weekly league' },
};
// bonus XP banked toward permanent rank for each finishing place
const SEASON_REWARD = { gold: 300, silver: 200, bronze: 120, finalist: 50 };
const BADGE_TIER_RANK = { gold: 0, silver: 1, bronze: 2, finalist: 3 };
function badgeMeta(b) {
  const t = BADGE_TIERS[b.tier] || BADGE_TIERS.finalist;
  const k = BADGE_KIND[b.kind] || BADGE_KIND.weekly;
  return { ...t, icon: k.icon, kindLabel: k.label, xp: SEASON_REWARD[b.tier] || 0 };
}
function badgesOf(u) {
  return [...(u.seasonBadges || [])].sort((a, b) => BADGE_TIER_RANK[a.tier] - BADGE_TIER_RANK[b.tier]);
}

// ── Badge types: First Start (permanent) + XP/Season ────
const FIRST_START_BADGES = {
  founding:      { id: 'founding',      label: 'Founding Member', emoji: '⭐', color: '#1A1A1A', textColor: '#fff',
    desc: 'One of the founding members of Scorred. A permanent badge, manually awarded — never expires.' },
  earlyBeliever: { id: 'earlyBeliever', label: 'Early Believer',  emoji: '🌱', color: '#2D5F3F', textColor: '#fff',
    desc: 'One of the first believers in Scorred — here before the crowd. A permanent badge that never expires.' },
  pioneer:       { id: 'pioneer',       label: 'Pioneer',         emoji: '🔥', color: '#6B3656', textColor: '#fff',
    desc: 'An early user who helped shape Scorred from the start. A permanent badge that never expires.' },
};


// Manually assigned badges per user handle (team-managed)
const USER_BADGE_MAP = {
  'vikram.toys':    { firstStartBadge: 'founding' },
  'aman_toys':      { firstStartBadge: 'earlyBeliever' },
  'meera.figs':     { firstStartBadge: 'pioneer' },
  'you':            { firstStartBadge: 'founding' },
};

// Single badge for feed — Priority: First Start > Rank
function feedBadge(u) {
  const map = USER_BADGE_MAP[u.handle] || {};
  if (map.firstStartBadge && FIRST_START_BADGES[map.firstStartBadge]) {
    return { type: 'firstStart', ...FIRST_START_BADGES[map.firstStartBadge] };
  }
  const tier = tierOf(u.xp || 0);
  return {
    type: 'rank', id: tier.id, label: tier.name, emoji: null,
    color: tier.c, textColor: '#fff',
    desc: `${tier.name} rank — earned by accumulating ${tier.at > 0 ? tier.at.toLocaleString('en-IN') + ' XP' : 'joining Scorred'}.`,
  };
}

// All badges for profile / leaderboard — all types combined
function allBadgesOf(u) {
  const result = [];
  const map = USER_BADGE_MAP[u.handle] || {};
  if (map.firstStartBadge && FIRST_START_BADGES[map.firstStartBadge])
    result.push({ type: 'firstStart', ...FIRST_START_BADGES[map.firstStartBadge] });
  badgesOf(u).forEach(b => {
    const m = badgeMeta(b);
    result.push({
      type: 'season', id: b.id, label: b.title, emoji: null,
      tier: b.tier, kind: b.kind, period: b.period,
      color: m.fill, textColor: m.ink,
      desc: `${m.kindLabel} · ${b.period} · ${m.label}. Earns +${m.xp} bonus XP toward your lifetime rank.`,
    });
  });
  // Always include rank badge — universal fallback so no user is ever badge-less
  const tier = tierOf(u.xp || 0);
  result.push({
    type: 'rank', id: tier.id, label: tier.name, emoji: null,
    color: tier.c, textColor: '#fff',
    desc: `${tier.name} rank — earned by accumulating ${tier.at > 0 ? tier.at.toLocaleString('en-IN') + ' XP' : 'joining Scorred'}.`,
  });
  return result;
}
function topBadge(u) { return badgesOf(u)[0] || null; }
// ranked list for the leaderboard.
// period: 'week' | 'all'  → ranks by XP earned in that window
function leaderboard(period = 'week') {
  const all = [...Object.entries(USERS).map(([key, u]) => ({ ...u, key, isMe: false })), { ...ME, key: 'you', name: 'You', isMe: true }];
  const pointsOf = (u) => u[period === 'week' ? 'xpWeek' : 'xp'];
  return all
    .map(u => ({ key: u.key, handle: u.handle, name: u.name, color: u.color, points: pointsOf(u), tier: tierOf(u.xp), isMe: u.isMe }))
    .sort((a, b) => b.points - a.points);
}

// ── ISO (In Search Of) seed posts ────────────────────────────
const ISO_POSTS = [
  { id: 'iso0', type: 'iso', user: 'rohit_scale', time: '30m', cat: 'figures',
    isoItem: 'Hot Toys MMS604 · Spider-Man (Upgraded Suit)', isoBudget: 28000, isoCond: 'Sealed', isoCity: 'Mumbai',
    body: 'Hunting the upgraded suit Spidey sealed. Reference pic attached — this exact colourway, no alternatives.',
    images: ['data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFhM2E2YyIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEzMCIgcj0iNzAiIGZpbGw9IiNjMDJkMjgiLz48cGF0aCBkPSJNMTQwIDE4MCBRMjAwIDI0MCAyNjAgMTgwIiBzdHJva2U9IiNjMDJkMjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjIwMCIgeT0iMjcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYWFhIiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+UmVmZXJlbmNlIHBob3RvPC90ZXh0Pjwvc3ZnPg=='],
    likes: 18, comments: 5 },
  { id: 'iso1', type: 'iso', user: 'rohit_scale', time: '2h', cat: 'figures',
    isoItem: 'Hot Toys MMS460 · Iron Man Mark 46', isoBudget: 22000, isoCond: 'Sealed', isoCity: 'Mumbai',
    body: 'Looking for Mark 46 sealed. Have a swap piece too — DM.',
    likes: 11, comments: 4 },
  { id: 'iso2', type: 'iso', user: 'meera', time: '5h', cat: 'figures',
    isoItem: 'SH Figuarts · Dragon Ball Super Broly', isoBudget: 5500, isoCond: 'Any', isoCity: 'Anywhere in India',
    body: 'DB Broly SHF eluded me for 2 years. Any condition, just needs to be OG not KO.',
    likes: 7, comments: 2 },
  { id: 'iso3', type: 'iso', user: 'karan_die', time: '1d', cat: 'diecast',
    isoItem: 'Mini GT · Nissan Skyline GT-R R32 · Sonic Blue', isoBudget: 1800, isoCond: 'Sealed', isoCity: 'Delhi',
    body: 'Sealed R32 in Sonic Blue. Open to trade for another 1/64.',
    likes: 5, comments: 1 },
  { id: 'iso4', type: 'iso', user: 'saanvi', time: '3h', cat: 'kits',
    isoItem: 'LEGO 75313 · AT-AT UCS (Star Wars)', isoBudget: 75000, isoCond: 'Sealed', isoCity: 'Anywhere in India',
    body: 'Hunting the AT-AT UCS sealed. Budget flexible for the right piece.',
    likes: 14, comments: 6 },
  { id: 'iso5', type: 'iso', user: 'vikram', time: '6h', cat: 'figures',
    isoItem: 'Sideshow Premium Format · Batman Begins', isoBudget: 45000, isoCond: 'MIB', isoCity: 'Worldwide',
    body: 'MIB or better. CE version preferred. Will cover international shipping.',
    likes: 9, comments: 3 },
  { id: 'iso6', type: 'iso', user: 'aman_toys', time: '1d', cat: 'designer',
    isoItem: 'Pop Mart · Labubu · The Monsters Series 1 (Full Set)', isoBudget: 12000, isoCond: 'Sealed', isoCity: 'Mumbai',
    body: 'Full Series 1 sealed box set — not looking for singles.',
    likes: 18, comments: 8 },
];

Object.assign(window, {
  CATEGORIES, USERS, CATALOGUE, MY_ITEMS, LISTINGS, MARKET_SEED, POSTS, ADMIN_POSTS, ISO_POSTS,
  COMMUNITIES, EVENTS, TRADE_HISTORY, NOTIFICATIONS, COMMENTS, THREADS, INBOX, ME,
  SCALES, UNIVERSES, PRESENCE, OWNS, OWN_LABELS, CONDITION_LADDER,
  REWARD_TIERS, EARN_ACTIONS, tierOf, tierIndexOf, nextTierOf, leaderboard,
  BADGE_TIERS, BADGE_KIND, SEASON_REWARD, badgeMeta, badgesOf, topBadge,
  catOf: cat, userOf: user, listingOf: listing, addToCatalogue,
  presenceOf, termsOf, postModeOf, ownStats, gradeOf, adminsOf, eventOf: event,
  membersOf, joinRequestsOf, pendingPostsOf, roleOf,
});

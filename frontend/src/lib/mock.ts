/**
 * CollectorHub — mock data for UI development
 *
 * Set MOCK_ENABLED = true to bypass API calls and render with this data.
 * Flip to false when the backend is running.
 */
export const MOCK_ENABLED = true;

// ── Auth user (own profile) ───────────────────────────────────────

export const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000099",
  handle: "arjun_collects",
  name: "Arjun Mehta",
  bio: "Gunpla builder, Kaws hunter. 10+ years collecting. Mumbai-based. DMs open for trades 🤝",
  city: "Mumbai",
  avatar_url: null,
  tier: "verified",
  interests: ["kits", "designer"],
  deals_count: 34,
  rating: 4.8,
  rating_count: 31,
  followers_count: 1240,
  following_count: 387,
  active_listings_count: 3,
  verified_items_count: 22,
};

// ── Profile data (same shape, used by UserProfile component) ─────

export const MOCK_PROFILE = MOCK_USER;

// ── Feed posts ────────────────────────────────────────────────────

export const MOCK_POSTS = [
  {
    id: "post-001",
    user_id: "00000000-0000-0000-0000-000000000002",
    handle: "figurehead",
    name: "Figurehead",
    avatar_url: null,
    type: "showcase",
    body: "Finally got my hands on the NECA Alien Warrior — 10-inch, fully articulated. The paint work on this one is insane. Took 6 months of hunting. Worth every rupee. 🔥",
    images: [
      "https://images.unsplash.com/photo-1608278047522-58806a6ac85b?w=800&q=80",
    ],
    category: "figures",
    likes_count: 214,
    comments_count: 38,
    saves_count: 57,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post-002",
    user_id: "00000000-0000-0000-0000-000000000003",
    handle: "blindbox_queen",
    name: "Blindbox Queen",
    avatar_url: null,
    type: "showcase",
    body: "My Labubu v2 haul from the Popmart drop last week. Got the secret edition on the 4th try! No more FOMO fr. If anyone wants to trade for the astronaut series — drop a message.",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
    category: "designer",
    likes_count: 389,
    comments_count: 71,
    saves_count: 102,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post-003",
    user_id: "00000000-0000-0000-0000-000000000004",
    handle: "brickmaster",
    name: "Brickmaster",
    avatar_url: null,
    type: "discussion",
    body: "Hot take: the MG Zaku II Ver 2.0 is still the best beginner Gunpla kit in 2026. Better proportions, better articulation, and more affordable than most modern RGs. Change my mind.",
    images: [],
    category: "kits",
    likes_count: 156,
    comments_count: 94,
    saves_count: 23,
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post-004",
    user_id: "00000000-0000-0000-0000-000000000005",
    handle: "diecast_dreams",
    name: "Diecast Dreams",
    avatar_url: null,
    type: "review",
    body: "Review: Hot Wheels RLC Porsche 993 GT2 (2025 spectraflame blue)\n\nPaint: 9/10 — deepest blue I've seen on any HW. Tampos are crisp, no bleeding. The rubber tyres are a nice touch.\n\nProportion accuracy: 8/10 — slightly wider body than real, but the profile is unmistakable.\n\nValue: 7/10 — ₹4,500 for a RLC is steep but this one earns it.\n\nOverall: Get it if you're a 993 fan.",
    images: [
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80",
    ],
    category: "diecast",
    likes_count: 88,
    comments_count: 19,
    saves_count: 44,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post-005",
    user_id: "00000000-0000-0000-0000-000000000099",
    handle: "arjun_collects",
    name: "Arjun Mehta",
    avatar_url: null,
    type: "showcase",
    body: "PG Unicorn Gundam build is finally done. 18 months on and off. Full LED kit, hand-painted ver.ka panel lines, custom base. This one's not going anywhere.",
    images: [
      "https://images.unsplash.com/photo-1619854084565-e027baf7f3a4?w=800&q=80",
    ],
    category: "kits",
    likes_count: 421,
    comments_count: 63,
    saves_count: 133,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Own profile posts (for profile → Posts tab) ───────────────────

export const MOCK_OWN_POSTS = MOCK_POSTS.filter((p) => p.handle === "arjun_collects");

// ── Collection items ──────────────────────────────────────────────

export const MOCK_COLLECTION = [
  {
    id: "item-001",
    sku: "BAN-PG-UNI-01",
    custom_title: null,
    title: "PG 1/60 Unicorn Gundam LED Set",
    status: "owned",
    verify_tier: "verified",
    value: 2800000,
    is_listed: false,
    photo_count: 6,
  },
  {
    id: "item-002",
    sku: "KAWS-COMP-BRN",
    custom_title: null,
    title: "Kaws Companion (Brown) Open Edition",
    status: "owned",
    verify_tier: "shown",
    value: 1500000,
    is_listed: false,
    photo_count: 3,
  },
  {
    id: "item-003",
    sku: "BAN-RG-WING",
    custom_title: null,
    title: "RG 1/144 Wing Gundam Zero EW",
    status: "owned",
    verify_tier: "claimed",
    value: 450000,
    is_listed: true,
    photo_count: 0,
  },
  {
    id: "item-004",
    sku: "LABU-V2-SEC",
    custom_title: null,
    title: "Labubu v2 Secret Edition",
    status: "wishlist",
    verify_tier: "claimed",
    value: 0,
    is_listed: false,
    photo_count: 0,
  },
  {
    id: "item-005",
    sku: "BAN-MG-ZAKU",
    custom_title: null,
    title: "MG 1/100 Zaku II Ver 2.0",
    status: "owned",
    verify_tier: "verified",
    value: 380000,
    is_listed: false,
    photo_count: 4,
  },
  {
    id: "item-006",
    sku: null,
    custom_title: "Hot Wheels RLC Porsche 993 GT2",
    title: "Hot Wheels RLC Porsche 993 GT2",
    status: "owned",
    verify_tier: "shown",
    value: 450000,
    is_listed: false,
    photo_count: 2,
  },
  {
    id: "item-007",
    sku: "BAN-MG-BARB",
    custom_title: null,
    title: "MG 1/100 Gundam Barbatos",
    status: "preorder",
    verify_tier: "claimed",
    value: 520000,
    is_listed: false,
    photo_count: 0,
  },
  {
    id: "item-008",
    sku: "BEARBRICK-400",
    custom_title: null,
    title: "Medicom BE@RBRICK 400% Kaws",
    status: "owned",
    verify_tier: "verified",
    value: 3200000,
    is_listed: false,
    photo_count: 5,
  },
  {
    id: "item-009",
    sku: null,
    custom_title: "NECA Alien Warrior 10-inch",
    title: "NECA Alien Warrior 10-inch",
    status: "wishlist",
    verify_tier: "claimed",
    value: 0,
    is_listed: false,
    photo_count: 0,
  },
];

// ── Listings (own active listings) ────────────────────────────────

export const MOCK_LISTINGS = [
  {
    id: "listing-001",
    item_id: "item-003",
    seller_id: "00000000-0000-0000-0000-000000000099",
    sku: "BAN-RG-WING",
    title: "RG 1/144 Wing Gundam Zero EW",
    thumbnail: null,
    price: 450000,
    condition: "opened",
    condition_notes: "Complete box, all runners sealed except one. No damage.",
    trade_willing: true,
    ships_from_city: "Mumbai",
    ships_nationwide: true,
    shipping_cost: 9900,
    saves_count: 12,
    status: "available",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { handle: "arjun_collects", name: "Arjun Mehta", rating: 4.8, deals_count: 34 },
  },
  {
    id: "listing-002",
    item_id: "item-010",
    seller_id: "00000000-0000-0000-0000-000000000002",
    sku: "NECA-PRED-2",
    title: "NECA Predator 2 Ultimate Figure",
    thumbnail: "https://images.unsplash.com/photo-1562206-fd1fb9ce3d41?w=400&q=80",
    price: 890000,
    condition: "sealed",
    condition_notes: "Factory sealed, never opened.",
    trade_willing: false,
    ships_from_city: "Delhi",
    ships_nationwide: true,
    shipping_cost: 12900,
    saves_count: 27,
    status: "available",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { handle: "figurehead", name: "Figurehead", rating: 4.9, deals_count: 68 },
  },
  {
    id: "listing-003",
    item_id: "item-011",
    seller_id: "00000000-0000-0000-0000-000000000003",
    sku: "KAWS-DISSECT",
    title: "Kaws Dissected Companion 11-inch (grey)",
    thumbnail: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=400&q=80",
    price: 2200000,
    condition: "sealed",
    condition_notes: null,
    trade_willing: true,
    ships_from_city: "Bangalore",
    ships_nationwide: true,
    shipping_cost: 0,
    saves_count: 54,
    status: "available",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    seller: { handle: "blindbox_queen", name: "Blindbox Queen", rating: 4.7, deals_count: 41 },
  },
  {
    id: "listing-004",
    item_id: "item-012",
    seller_id: "00000000-0000-0000-0000-000000000004",
    sku: "BAN-MG-EXIA",
    title: "MG 1/100 Gundam Exia Repair",
    thumbnail: "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=400&q=80",
    price: 620000,
    condition: "built",
    condition_notes: "Fully built, panel-lined, top-coated. Stable joints.",
    trade_willing: true,
    ships_from_city: "Chennai",
    ships_nationwide: false,
    shipping_cost: 0,
    saves_count: 8,
    status: "available",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    seller: { handle: "brickmaster", name: "Brickmaster", rating: 4.6, deals_count: 22 },
  },
  {
    id: "listing-005",
    item_id: "item-013",
    seller_id: "00000000-0000-0000-0000-000000000005",
    sku: "HW-RLC-993",
    title: "Hot Wheels RLC Porsche 993 GT2 (spectraflame blue)",
    thumbnail: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&q=80",
    price: 380000,
    condition: "sealed",
    condition_notes: "Purchased from RLC. Unopened.",
    trade_willing: false,
    ships_from_city: "Hyderabad",
    ships_nationwide: true,
    shipping_cost: 6900,
    saves_count: 31,
    status: "available",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    seller: { handle: "diecast_dreams", name: "Diecast Dreams", rating: 4.9, deals_count: 89 },
  },
  {
    id: "listing-006",
    item_id: "item-014",
    seller_id: "00000000-0000-0000-0000-000000000006",
    sku: "TOMICA-SKYLINE",
    title: "Tomica Limited Vintage Neo Nissan Skyline GT-R (R34)",
    thumbnail: "https://images.unsplash.com/photo-1635865168735-b2c8c93e5c90?w=400&q=80",
    price: 760000,
    condition: "opened",
    condition_notes: "Removed for photos only. All accessories present.",
    trade_willing: true,
    ships_from_city: "Pune",
    ships_nationwide: true,
    shipping_cost: 8900,
    saves_count: 19,
    status: "available",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { handle: "diecast_dreams", name: "Diecast Dreams", rating: 4.9, deals_count: 89 },
  },
];

// ── Communities ───────────────────────────────────────────────────

export const MOCK_COMMUNITIES = [
  {
    id: "comm-001",
    name: "Mumbai Gunpla Builders",
    slug: "mumbai-gunpla",
    description: "The home of Gunpla builders in Mumbai. Monthly meetups, build competitions, and paint nights.",
    category: "kits",
    member_count: 1840,
    post_count: 3420,
    is_member: true,
    accent: "var(--verified-teal)",
    emoji: "🤖",
  },
  {
    id: "comm-002",
    name: "India Diecast Collectors",
    slug: "india-diecast",
    description: "Largest diecast community in India — Hot Wheels, Tomica, 1:18 scale, and everything in between.",
    category: "diecast",
    member_count: 6210,
    post_count: 14800,
    is_member: false,
    accent: "var(--grail-gold)",
    emoji: "🚗",
  },
  {
    id: "comm-003",
    name: "Popmart India",
    slug: "popmart-india",
    description: "Labubu, Skullpanda, Molly — your hub for blind box drops, restocks, and swaps.",
    category: "designer",
    member_count: 4500,
    post_count: 9200,
    is_member: true,
    accent: "var(--plum)",
    emoji: "🎲",
  },
  {
    id: "comm-004",
    name: "Action Figure Society",
    slug: "af-society",
    description: "NECA, McFarlane, Mezco, Hot Toys — serious figure talk only.",
    category: "figures",
    member_count: 2980,
    post_count: 7100,
    is_member: false,
    accent: "var(--stamp-red)",
    emoji: "🦸",
  },
  {
    id: "comm-005",
    name: "Kaws Collectors India",
    slug: "kaws-india",
    description: "Dedicated community for Kaws and street art toy collectors across India.",
    category: "designer",
    member_count: 1220,
    post_count: 2810,
    is_member: true,
    accent: "var(--forest)",
    emoji: "✖️",
  },
  {
    id: "comm-006",
    name: "Lego India Builders",
    slug: "lego-india",
    description: "Technic, Creator Expert, Ideas, Modular — Lego fans from across India.",
    category: "kits",
    member_count: 3400,
    post_count: 5900,
    is_member: false,
    accent: "var(--grail-gold-deep)",
    emoji: "🧱",
  },
];

// ── Events ────────────────────────────────────────────────────────

export const MOCK_EVENTS = [
  {
    id: "event-001",
    title: "Toy Fair India 2026",
    description: "India's biggest annual collector toy fair. Hundreds of stalls, exclusive drops, artist signings, and trading zones.",
    mode: "in_person",
    city: "Mumbai",
    venue: "Bandra Kurla Complex Convention Centre",
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    category: null,
    interest_count: 1840,
    is_interested: true,
    host: { name: "CollectorHub", handle: "collectohub_admin" },
  },
  {
    id: "event-002",
    title: "Gunpla Open — Mumbai Chapter",
    description: "Monthly build-off. Bring your WIP or display your latest completed kit. Best paint and best build trophies.",
    mode: "in_person",
    city: "Mumbai",
    venue: "Andheri Hobbyist Hub",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: null,
    category: "kits",
    interest_count: 214,
    is_interested: true,
    host: { name: "Mumbai Gunpla Builders", handle: "brickmaster" },
  },
  {
    id: "event-003",
    title: "Popmart India Virtual Drop Party",
    description: "Live group unboxing for the new Dimoo Space Series. Jump in, share your pulls, trade duplicates.",
    mode: "online",
    city: null,
    venue: null,
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: null,
    category: "designer",
    interest_count: 680,
    is_interested: false,
    host: { name: "Popmart India", handle: "blindbox_queen" },
  },
  {
    id: "event-004",
    title: "Diecast Delhi Swap Meet",
    description: "Bi-monthly in-person swap meet for diecast collectors. Bring your duplicates, deals over chai.",
    mode: "in_person",
    city: "Delhi",
    venue: "Connaught Place, Gate 2 (outside)",
    date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: null,
    category: "diecast",
    interest_count: 92,
    is_interested: false,
    host: { name: "India Diecast Collectors", handle: "diecast_dreams" },
  },
  {
    id: "event-005",
    title: "Kaws Retrospective — Online Exhibition",
    description: "Virtual walkthrough of rare and grail-tier Kaws pieces. Community curated, free to attend.",
    mode: "online",
    city: null,
    venue: null,
    date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: null,
    category: "designer",
    interest_count: 320,
    is_interested: true,
    host: { name: "Kaws Collectors India", handle: "arjun_collects" },
  },
];

// ── Suggested collectors (right rail) ─────────────────────────────

export const MOCK_SUGGESTED_USERS = [
  {
    handle: "priya_kapoor",
    name: "Priya Kapoor",
    avatar_url: null,
    bio: "Hot Toys & Sideshow collector • Mumbai",
    tier: "verified",
    verified_items_count: 18,
    followers_count: 2100,
  },
  {
    handle: "rohan_singh",
    name: "Rohan Singh",
    avatar_url: null,
    bio: "Lego Technic & Gunpla • Delhi",
    tier: "verified",
    verified_items_count: 11,
    followers_count: 890,
  },
  {
    handle: "sneha_nair",
    name: "Sneha Nair",
    avatar_url: null,
    bio: "Popmart addict • Bangalore",
    tier: "basic",
    verified_items_count: 4,
    followers_count: 430,
  },
];

// ── Followers / following ─────────────────────────────────────────

export const MOCK_FOLLOWERS = [
  { handle: "figurehead", name: "Figurehead", avatar_url: null, tier: "verified" },
  { handle: "blindbox_queen", name: "Blindbox Queen", avatar_url: null, tier: "verified" },
  { handle: "priya_kapoor", name: "Priya Kapoor", avatar_url: null, tier: "verified" },
  { handle: "rohan_singh", name: "Rohan Singh", avatar_url: null, tier: "verified" },
  { handle: "sneha_nair", name: "Sneha Nair", avatar_url: null, tier: "basic" },
];

export const MOCK_FOLLOWING = [
  { handle: "figurehead", name: "Figurehead", avatar_url: null, tier: "verified" },
  { handle: "blindbox_queen", name: "Blindbox Queen", avatar_url: null, tier: "verified" },
  { handle: "brickmaster", name: "Brickmaster", avatar_url: null, tier: "verified" },
  { handle: "diecast_dreams", name: "Diecast Dreams", avatar_url: null, tier: "verified" },
];

// ── Helper: format price (paise → ₹) ─────────────────────────────

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// ── Helper: relative time ─────────────────────────────────────────

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// ── Helper: short date for events ────────────────────────────────

export function shortDate(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleString("en-IN", { month: "short" }).toUpperCase(),
  };
}

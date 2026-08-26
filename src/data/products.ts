import type { Product } from '../types';

// Eagerly load all image asset paths from /src/items/
const artworkImages = import.meta.glob<{ default: string }>('../items/artworks/*.jpg', {
  eager: true,
  import: 'default',
}) as unknown as Record<string, string>;

const pinImages = import.meta.glob<{ default: string }>('../items/pins/*.jpg', {
  eager: true,
  import: 'default',
}) as unknown as Record<string, string>;

const chainImages = import.meta.glob<{ default: string }>('../items/chains/*.jpg', {
  eager: true,
  import: 'default',
}) as unknown as Record<string, string>;

const stickerImages = import.meta.glob<{ default: string }>('../items/stickers/*.jpg', {
  eager: true,
  import: 'default',
}) as unknown as Record<string, string>;

export function getArtworkImageUrl(filename: string): string {
  const key = `../items/artworks/${filename}`;
  return artworkImages[key] || '';
}

export function getPinImageUrl(filename: string): string {
  const key = `../items/pins/${filename}`;
  return pinImages[key] || '';
}

export function getChainImageUrl(filename: string): string {
  const key = `../items/chains/${filename}`;
  return chainImages[key] || '';
}

export function getStickerImageUrl(filename: string): string {
  const key = `../items/stickers/${filename}`;
  return stickerImages[key] || '';
}

// Artwork Titles & Descriptions for 32 pieces
const artworkMeta = [
  { title: "Celestial Dreamscape Print", price: 280, desc: "A vibrant ethereal landscape printed on premium 300gsm textured archival paper." },
  { title: "Whispering Blossom Art Print", price: 320, desc: "Delicate botanical illustration with soft watercolor tones and rich contrast." },
  { title: "Midnight Solitude Art Print", price: 350, desc: "A moody atmospheric scene capturing the tranquility of late-night contemplation." },
  { title: "Golden Horizon Original Print", price: 420, desc: "Luminous warm hues and rich texture detailing, perfect for gallery framing." },
  { title: "Enchanted Grove Art Print", price: 250, desc: "Lush botanical foliage and subtle mystical lighting on fine art matte finish." },
  { title: "Ethereal Wanderer Art Print", price: 480, desc: "Intricate character art set amidst floating celestial lights and stardust." },
  { title: "Sunset Reverie Canvas Print", price: 380, desc: "Rich amber and violet sunset gradients printed with UV-resistant pigment inks." },
  { title: "Neon Metropolis Art Print", price: 290, desc: "Futuristic city street bathed in electric rain reflections and cyber aesthetic." },
  { title: "Serene Koi Reverie Print", price: 340, desc: "Graceful flowing water motion with gold-accented aquatic elements." },
  { title: "Starlight Voyage Art Print", price: 450, desc: "A cosmic journey through nebula clouds and distant starry galaxies." },
  { title: "Autumn Memories Fine Print", price: 260, desc: "Warm foliage, amber light, and cozy nostalgic vibes on heavy matte cardstock." },
  { title: "Moonlit Guardian Art Print", price: 500, desc: "Commanding character portrait with intricate armor motifs and glowing highlights." },
  { title: "Twilight Garden Art Print", price: 310, desc: "Nocturnal blossoms unfurling beneath a full silver moonlit sky." },
  { title: "Wanderlust Traveler Print", price: 240, desc: "An adventurer standing on a cliffside overlooking ancient mystical ruins." },
  { title: "Velvet Bloom Masterpiece", price: 490, desc: "Rich crimson and deep indigo floral composition with high-definition details." },
  { title: "Oceanic Symphony Art Print", price: 360, desc: "Dynamic ocean waves crashing against coastal rocks under morning light." },
  { title: "Shadow & Light Study Print", price: 220, desc: "Minimalist dramatic chiaroscuro composition exploring depth and form." },
  { title: "Prismatic Mirage Art Print", price: 400, desc: "Geometric prisms refracting vibrant rainbow beams across a surreal canvas." },
  { title: "Forest Spirit Art Print", price: 270, desc: "Gentle mythical creature resting in an ancient moss-covered hollow." },
  { title: "Solar Radiance Art Print", price: 460, desc: "Brilliant warm amber composition evoking energy, summer warmth, and vitality." },
  { title: "Cosmic Serenade Art Print", price: 390, desc: "Celestial symphony of planets, orbiting starlight, and sweeping nebula dust." },
  { title: "Vintage Tearoom Art Print", price: 230, desc: "Charming cafe corner featuring warm tea, pastries, and rustic wooden textures." },
  { title: "Cyber Samurai Art Print", price: 480, desc: "Sharp neo-tokyo aesthetics with glowing katana highlights and dark visor reflections." },
  { title: "Emerald Valley Art Print", price: 330, desc: "Rolling green hills framed by distant mountain peaks and morning fog." },
  { title: "Rose Quartz Sunset Print", price: 300, desc: "Pastel pink and lavender dusk clouds painted in soft impressionist strokes." },
  { title: "Arcane Library Art Print", price: 450, desc: "Towering ancient bookshelves lined with spellbooks and glowing floating orbs." },
  { title: "Sakura Reflection Art Print", price: 340, desc: "Cherry blossom petals floating gently upon a still crystal pond." },
  { title: "Astral Odyssey Fine Print", price: 410, desc: "Deep space nebula vistas with high color gamut reproduction." },
  { title: "Urban Sunset Art Print", price: 270, desc: "Golden hour glow washing over city skyscrapers and bustling streets." },
  { title: "Mystic Dragon Art Print", price: 500, desc: "Magnificent serpentine dragon soaring through swirling jade clouds." },
  { title: "Chasing Fireflies Print", price: 250, desc: "Summer night atmosphere filled with glowing warm orbs among tall reeds." },
  { title: "Dawn of Tomorrow Art Print", price: 440, desc: "Inspiring sunrise breakthrough over a dramatic panoramic horizon." },
];

// Pins Metadata for 6 items (Price 40-45 Pesos)
const pinMeta = [
  { title: "Celestial Cat Enamel Pin", price: 45, desc: "High-grade polished hard enamel pin with gold metal plating and double rubber clutch." },
  { title: "Pixel Heart Metal Pin", price: 40, desc: "Charming retro gaming pixel art badge with vibrant gloss finish." },
  { title: "Golden Monstera Leaf Pin", price: 42, desc: "Elegant botanical cutout pin with intricate leaf vein detailing." },
  { title: "Mystic Moon Phase Pin", price: 45, desc: "Silver-plated enamel pin showcasing the moon's lunar cycle." },
  { title: "Retro Coffee Cup Pin", price: 40, desc: "Cozy hot brew badge with cute steam swirl, perfect for bags and jackets." },
  { title: "Starry Mountain Pin", price: 45, desc: "Miniature mountain silhouette under starry night sky with glitter accents." },
];

// Keychains Metadata for 4 items (Price 30-40 Pesos)
const chainMeta = [
  { title: "Chibi Guardian Acrylic Keychain", price: 35, desc: "Durable double-sided acrylic charm with epoxy glitter coating and gold star clasp." },
  { title: "Boba Bear Charm Keychain", price: 40, desc: "Adorable boba cup design with floating pearls and sturdy swivel ring." },
  { title: "Retro Arcade Token Keychain", price: 30, desc: "Embossed metallic keychain with vintage arcade typography." },
  { title: "Cosmic Jellyfish Charm Keychain", price: 38, desc: "Translucent holographic acrylic with glowing tentacles and bead tassel." },
];

// Stickers Metadata for 4 items (Price 20-35 Pesos)
const stickerMeta = [
  { title: "Holographic Galaxy Sticker", price: 25, desc: "Waterproof vinyl die-cut sticker with rainbow holographic luster." },
  { title: "Cozy Matcha Frog Sticker", price: 20, desc: "Matte laminated weatherproof sticker, perfect for laptops and water bottles." },
  { title: "Retro Cyberpunk Badge Sticker", price: 30, desc: "High durability vinyl with UV protection and scratch-resistant coating." },
  { title: "Kawaii Ramen Bowl Sticker", price: 25, desc: "Vibrant die-cut vinyl sticker with glossy weather-resistant finish." },
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Keychains (4 items)
  ...chainMeta.map((item, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');
    return {
      id: `prod-chain-${numStr}`,
      seller_id: 'bb-official-store',
      title: item.title,
      description: item.desc,
      price: item.price,
      category: 'Keychains' as const,
      image_url: getChainImageUrl(`${numStr}.jpg`),
      created_at: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
    };
  }),

  // 2. Pins (6 items)
  ...pinMeta.map((item, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');
    return {
      id: `prod-pin-${numStr}`,
      seller_id: 'bb-official-store',
      title: item.title,
      description: item.desc,
      price: item.price,
      category: 'Pins' as const,
      image_url: getPinImageUrl(`${numStr}.jpg`),
      created_at: new Date(Date.now() - (idx + 5) * 3600000).toISOString(),
    };
  }),

  // 3. Stickers (4 items)
  ...stickerMeta.map((item, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');
    return {
      id: `prod-sticker-${numStr}`,
      seller_id: 'bb-official-store',
      title: item.title,
      description: item.desc,
      price: item.price,
      category: 'Stickers' as const,
      image_url: getStickerImageUrl(`${numStr}.jpg`),
      created_at: new Date(Date.now() - (idx + 11) * 3600000).toISOString(),
    };
  }),

  // 4. Artworks & Prints (32 items)
  ...artworkMeta.map((item, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');
    // Alternate or tag between 'Artworks' and 'Prints'
    const category: 'Artworks' | 'Prints' = idx % 2 === 0 ? 'Artworks' : 'Prints';
    return {
      id: `prod-art-${numStr}`,
      seller_id: 'bb-official-store',
      title: item.title,
      description: item.desc,
      price: item.price,
      category,
      image_url: getArtworkImageUrl(`${numStr}.jpg`),
      created_at: new Date(Date.now() - (idx + 15) * 3600000).toISOString(),
    };
  }),
];

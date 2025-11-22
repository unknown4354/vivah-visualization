import { PrismaClient, ItemCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed furniture items
  const furnitureItems = [
    // Tables
    {
      name: 'Round Table 8-Seater',
      slug: 'round-table-8',
      category: ItemCategory.TABLE,
      subcategory: 'round',
      modelUrl: '/models/furniture/round-table-8.glb',
      thumbnailUrl: '/thumbnails/round-table-8.png',
      dimensions: { width: 1.5, depth: 1.5, height: 0.75 },
      polyCount: 2000,
      fileSize: 150000,
      materials: [
        { name: 'White', color: '#FFFFFF' },
        { name: 'Ivory', color: '#FFFFF0' },
        { name: 'Gold', color: '#FFD700' }
      ],
      tags: ['table', 'round', 'seating', 'dining']
    },
    {
      name: 'Rectangular Table 10-Seater',
      slug: 'rect-table-10',
      category: ItemCategory.TABLE,
      subcategory: 'rectangular',
      modelUrl: '/models/furniture/rect-table-10.glb',
      thumbnailUrl: '/thumbnails/rect-table-10.png',
      dimensions: { width: 2.4, depth: 1.2, height: 0.75 },
      polyCount: 1800,
      fileSize: 140000,
      materials: [
        { name: 'White', color: '#FFFFFF' },
        { name: 'Mahogany', color: '#C04000' }
      ],
      tags: ['table', 'rectangular', 'seating', 'dining']
    },
    {
      name: 'Cocktail Table',
      slug: 'cocktail-table',
      category: ItemCategory.TABLE,
      subcategory: 'cocktail',
      modelUrl: '/models/furniture/cocktail-table.glb',
      thumbnailUrl: '/thumbnails/cocktail-table.png',
      dimensions: { width: 0.6, depth: 0.6, height: 1.1 },
      polyCount: 800,
      fileSize: 80000,
      materials: [
        { name: 'Black', color: '#000000' },
        { name: 'White', color: '#FFFFFF' }
      ],
      tags: ['table', 'cocktail', 'standing']
    },
    // Chairs
    {
      name: 'Chiavari Chair Gold',
      slug: 'chiavari-gold',
      category: ItemCategory.CHAIR,
      subcategory: 'chiavari',
      modelUrl: '/models/furniture/chiavari-gold.glb',
      thumbnailUrl: '/thumbnails/chiavari-gold.png',
      dimensions: { width: 0.4, depth: 0.4, height: 0.9 },
      polyCount: 1500,
      fileSize: 120000,
      materials: [
        { name: 'Gold', color: '#FFD700' },
        { name: 'Silver', color: '#C0C0C0' },
        { name: 'White', color: '#FFFFFF' }
      ],
      tags: ['chair', 'chiavari', 'elegant', 'wedding']
    },
    {
      name: 'Folding Chair White',
      slug: 'folding-white',
      category: ItemCategory.CHAIR,
      subcategory: 'folding',
      modelUrl: '/models/furniture/folding-white.glb',
      thumbnailUrl: '/thumbnails/folding-white.png',
      dimensions: { width: 0.45, depth: 0.45, height: 0.8 },
      polyCount: 1000,
      fileSize: 90000,
      materials: [
        { name: 'White', color: '#FFFFFF' },
        { name: 'Black', color: '#000000' }
      ],
      tags: ['chair', 'folding', 'simple']
    },
    {
      name: 'Ghost Chair',
      slug: 'ghost-chair',
      category: ItemCategory.CHAIR,
      subcategory: 'modern',
      modelUrl: '/models/furniture/ghost-chair.glb',
      thumbnailUrl: '/thumbnails/ghost-chair.png',
      dimensions: { width: 0.4, depth: 0.5, height: 0.9 },
      polyCount: 1200,
      fileSize: 100000,
      materials: [
        { name: 'Clear', color: '#FFFFFF' }
      ],
      tags: ['chair', 'modern', 'transparent', 'elegant']
    },
    // Decorations
    {
      name: 'Floral Centerpiece',
      slug: 'floral-centerpiece',
      category: ItemCategory.DECORATION,
      subcategory: 'centerpiece',
      modelUrl: '/models/furniture/floral-centerpiece.glb',
      thumbnailUrl: '/thumbnails/floral-centerpiece.png',
      dimensions: { width: 0.3, depth: 0.3, height: 0.4 },
      polyCount: 3000,
      fileSize: 200000,
      materials: [
        { name: 'Rose', color: '#FF007F' },
        { name: 'White', color: '#FFFFFF' },
        { name: 'Peach', color: '#FFDAB9' }
      ],
      tags: ['decoration', 'floral', 'centerpiece', 'flowers']
    },
    {
      name: 'Candle Holder',
      slug: 'candle-holder',
      category: ItemCategory.DECORATION,
      subcategory: 'candles',
      modelUrl: '/models/furniture/candle-holder.glb',
      thumbnailUrl: '/thumbnails/candle-holder.png',
      dimensions: { width: 0.15, depth: 0.15, height: 0.35 },
      polyCount: 500,
      fileSize: 50000,
      materials: [
        { name: 'Gold', color: '#FFD700' },
        { name: 'Silver', color: '#C0C0C0' }
      ],
      tags: ['decoration', 'candle', 'lighting']
    },
    // Lighting
    {
      name: 'Crystal Chandelier',
      slug: 'crystal-chandelier',
      category: ItemCategory.LIGHTING,
      subcategory: 'chandelier',
      modelUrl: '/models/furniture/crystal-chandelier.glb',
      thumbnailUrl: '/thumbnails/crystal-chandelier.png',
      dimensions: { width: 1.0, depth: 1.0, height: 1.2 },
      polyCount: 5000,
      fileSize: 350000,
      materials: [
        { name: 'Crystal', color: '#E0E0E0' }
      ],
      tags: ['lighting', 'chandelier', 'crystal', 'elegant']
    },
    {
      name: 'String Lights',
      slug: 'string-lights',
      category: ItemCategory.LIGHTING,
      subcategory: 'string',
      modelUrl: '/models/furniture/string-lights.glb',
      thumbnailUrl: '/thumbnails/string-lights.png',
      dimensions: { width: 5.0, depth: 0.1, height: 0.1 },
      polyCount: 800,
      fileSize: 60000,
      materials: [
        { name: 'Warm White', color: '#FFF5E6' },
        { name: 'Cool White', color: '#F0F8FF' }
      ],
      tags: ['lighting', 'string', 'fairy', 'romantic']
    },
    // Structures
    {
      name: 'Wedding Arch',
      slug: 'wedding-arch',
      category: ItemCategory.STRUCTURE,
      subcategory: 'arch',
      modelUrl: '/models/furniture/wedding-arch.glb',
      thumbnailUrl: '/thumbnails/wedding-arch.png',
      dimensions: { width: 2.5, depth: 0.8, height: 2.8 },
      polyCount: 2500,
      fileSize: 180000,
      materials: [
        { name: 'White', color: '#FFFFFF' },
        { name: 'Natural Wood', color: '#DEB887' }
      ],
      tags: ['structure', 'arch', 'ceremony', 'backdrop']
    },
    {
      name: 'Stage Platform',
      slug: 'stage-platform',
      category: ItemCategory.STRUCTURE,
      subcategory: 'stage',
      modelUrl: '/models/furniture/stage-platform.glb',
      thumbnailUrl: '/thumbnails/stage-platform.png',
      dimensions: { width: 4.0, depth: 3.0, height: 0.3 },
      polyCount: 500,
      fileSize: 40000,
      materials: [
        { name: 'White', color: '#FFFFFF' },
        { name: 'Black', color: '#000000' }
      ],
      tags: ['structure', 'stage', 'platform']
    },
    // Floral
    {
      name: 'Rose Bouquet',
      slug: 'rose-bouquet',
      category: ItemCategory.FLORAL,
      subcategory: 'bouquet',
      modelUrl: '/models/furniture/rose-bouquet.glb',
      thumbnailUrl: '/thumbnails/rose-bouquet.png',
      dimensions: { width: 0.25, depth: 0.25, height: 0.35 },
      polyCount: 4000,
      fileSize: 280000,
      materials: [
        { name: 'Red', color: '#FF0000' },
        { name: 'Pink', color: '#FFC0CB' },
        { name: 'White', color: '#FFFFFF' }
      ],
      tags: ['floral', 'roses', 'bouquet', 'flowers']
    },
    {
      name: 'Aisle Runner',
      slug: 'aisle-runner',
      category: ItemCategory.DECORATION,
      subcategory: 'aisle',
      modelUrl: '/models/furniture/aisle-runner.glb',
      thumbnailUrl: '/thumbnails/aisle-runner.png',
      dimensions: { width: 1.2, depth: 10.0, height: 0.01 },
      polyCount: 100,
      fileSize: 20000,
      materials: [
        { name: 'White', color: '#FFFFFF' },
        { name: 'Red', color: '#8B0000' },
        { name: 'Ivory', color: '#FFFFF0' }
      ],
      tags: ['decoration', 'aisle', 'runner', 'ceremony']
    }
  ]

  for (const item of furnitureItems) {
    await prisma.furnitureItem.upsert({
      where: { slug: item.slug },
      update: item,
      create: item
    })
  }

  console.log(`Seeded ${furnitureItems.length} furniture items`)

  // Seed sample venues
  const venues = [
    {
      name: 'Grand Ballroom',
      slug: 'grand-ballroom',
      address: '123 Wedding Lane',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      capacity: 500,
      area: 5000,
      dimensions: { length: 50, width: 40, height: 8 },
      features: ['ac', 'parking', 'catering', 'sound-system'],
      images: ['/venues/grand-ballroom-1.jpg']
    },
    {
      name: 'Garden Terrace',
      slug: 'garden-terrace',
      address: '456 Nature Road',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      capacity: 300,
      area: 4000,
      dimensions: { length: 40, width: 35, height: 0 },
      features: ['outdoor', 'garden', 'parking', 'tent-optional'],
      images: ['/venues/garden-terrace-1.jpg']
    },
    {
      name: 'Lakeside Pavilion',
      slug: 'lakeside-pavilion',
      address: '789 Lake View',
      city: 'Mysore',
      state: 'Karnataka',
      country: 'India',
      capacity: 200,
      area: 3000,
      dimensions: { length: 30, width: 30, height: 6 },
      features: ['waterfront', 'outdoor', 'scenic', 'parking'],
      images: ['/venues/lakeside-pavilion-1.jpg']
    }
  ]

  for (const venue of venues) {
    await prisma.venue.upsert({
      where: { slug: venue.slug },
      update: venue,
      create: venue
    })
  }

  console.log(`Seeded ${venues.length} venues`)

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

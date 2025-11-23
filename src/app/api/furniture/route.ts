import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/furniture - List all furniture items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where = {
      isActive: true,
      ...(category && { category: category as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { tags: { has: search.toLowerCase() } }
        ]
      })
    }

    const items = await prisma.furnitureItem.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Group by category
    const grouped = items.reduce((acc, item) => {
      const cat = item.category
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(item)
      return acc
    }, {} as Record<string, typeof items>)

    return NextResponse.json({
      items,
      grouped,
      total: items.length
    })
  } catch (error) {
    console.error('Error fetching furniture:', error)
    return NextResponse.json(
      { error: 'Failed to fetch furniture items' },
      { status: 500 }
    )
  }
}

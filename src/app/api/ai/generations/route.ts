import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/ai/generations - Get user's AI generations
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = { userId: user.id }
    if (type) {
      where.type = type
    }

    const generations = await prisma.aIGeneration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        prompt: true,
        model: true,
        resultUrl: true,
        metadata: true,
        credits: true,
        createdAt: true
      }
    })

    // Format for 3D gallery
    const formattedGenerations = generations.map(gen => ({
      id: gen.id,
      glbUrl: gen.resultUrl,
      name: gen.prompt.substring(0, 50),
      createdAt: gen.createdAt,
      metadata: gen.metadata
    }))

    return NextResponse.json({
      generations: formattedGenerations
    })
  } catch (error) {
    console.error('Fetch generations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    )
  }
}

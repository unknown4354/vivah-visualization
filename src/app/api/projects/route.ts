import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CreateProjectSchema } from '@/lib/validators/project'
import { z } from 'zod'

// GET /api/projects - List user's projects
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    // Validate and clamp pagination params
    const MAX_LIMIT = 100
    const parsedPage = parseInt(searchParams.get('page') || '1')
    const parsedLimit = parseInt(searchParams.get('limit') || '10')

    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(MAX_LIMIT, Math.max(1, parsedLimit))
      : 10
    const skip = (page - 1) * limit

    const where = {
      userId: user.id,
      ...(status && { status: status as any })
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          venue: true,
          images: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = CreateProjectSchema.parse(body)

    // Ensure user exists in database (sync with Supabase Auth)
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        emailVerified: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
      }
    })

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        venueId: validatedData.venueId,
        eventDate: validatedData.eventDate,
        guestCount: validatedData.guestCount,
        budget: validatedData.budget,
        userId: user.id,
        sceneData: {
          version: '1.0',
          camera: {
            position: [10, 10, 10],
            target: [0, 0, 0]
          },
          environment: {
            preset: 'studio',
            background: '#f0f0f0'
          },
          grid: {
            size: 20,
            divisions: 20
          }
        }
      },
      include: {
        venue: true
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: project.id,
        action: 'project.created',
        metadata: { projectName: project.name }
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

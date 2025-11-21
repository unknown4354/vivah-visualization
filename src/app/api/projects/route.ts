import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { CreateProjectSchema } from '@/lib/validators/project'
import { z } from 'zod'

// GET /api/projects - List user's projects
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = {
      userId: session.user.id,
      ...(status && { status: status as any })
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          venue: true,
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = CreateProjectSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        venueId: validatedData.venueId,
        eventDate: validatedData.eventDate,
        guestCount: validatedData.guestCount,
        budget: validatedData.budget,
        userId: session.user.id,
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
        userId: session.user.id,
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

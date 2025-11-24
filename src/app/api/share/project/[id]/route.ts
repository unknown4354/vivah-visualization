import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      )
    }

    // Verify token has access to this project
    const shareLink = await prisma.shareLink.findFirst({
      where: {
        token,
        projectId: id
      }
    })

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch project with limited data for public view
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        eventDate: true,
        guestCount: true,
        sceneData: true,
        thumbnail: true,
        venue: {
          select: {
            name: true,
            address: true,
            city: true
          }
        },
        items: {
          include: {
            furnitureItem: {
              select: {
                id: true,
                name: true,
                category: true,
                thumbnailUrl: true
              }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching shared project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const AddImageSchema = z.object({
  imageUrl: z.string().url(),
  name: z.string().optional(),
  isOriginal: z.boolean().optional()
})

// POST /api/projects/[id]/images - Add image to project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const body = await req.json()
    const validatedData = AddImageSchema.parse(body)

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Add image to project
    const image = await prisma.projectImage.create({
      data: {
        projectId,
        url: validatedData.imageUrl,
        name: validatedData.name,
        isOriginal: validatedData.isOriginal || false
      }
    })

    // Update project thumbnail if it's the first image
    const imageCount = await prisma.projectImage.count({
      where: { projectId }
    })

    if (imageCount === 1) {
      await prisma.project.update({
        where: { id: projectId },
        data: { thumbnail: validatedData.imageUrl }
      })
    }

    return NextResponse.json({ image })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Add image error:', error)
    return NextResponse.json(
      { error: 'Failed to add image' },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/images - Get all images for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const images = await prisma.projectImage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Get images error:', error)
    return NextResponse.json(
      { error: 'Failed to get images' },
      { status: 500 }
    )
  }
}

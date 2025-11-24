import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const CreateShareLinkSchema = z.object({
  projectId: z.string().cuid(),
  canEdit: z.boolean().optional().default(false),
  canComment: z.boolean().optional().default(true),
  canExport: z.boolean().optional().default(false),
  password: z.string().min(4).optional(),
  expiresIn: z.number().min(1).max(720).optional(), // hours, max 30 days
  maxViews: z.number().min(1).max(1000).optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = CreateShareLinkSchema.parse(body)

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Hash password if provided
    let hashedPassword: string | null = null
    if (validatedData.password) {
      hashedPassword = await bcrypt.hash(validatedData.password, 10)
    }

    // Calculate expiration
    let expiresAt: Date | null = null
    if (validatedData.expiresIn) {
      expiresAt = new Date(Date.now() + validatedData.expiresIn * 60 * 60 * 1000)
    }

    // Create share link
    const shareLink = await prisma.shareLink.create({
      data: {
        projectId: validatedData.projectId,
        canEdit: validatedData.canEdit,
        canComment: validatedData.canComment,
        canExport: validatedData.canExport,
        password: hashedPassword,
        expiresAt,
        maxViews: validatedData.maxViews
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        projectId: validatedData.projectId,
        action: 'project.shared',
        metadata: {
          shareLinkId: shareLink.id,
          hasPassword: !!hashedPassword,
          expiresAt
        }
      }
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/shared/${shareLink.token}`

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        url: shareUrl,
        expiresAt: shareLink.expiresAt,
        maxViews: shareLink.maxViews,
        permissions: {
          canEdit: shareLink.canEdit,
          canComment: shareLink.canComment,
          canExport: shareLink.canExport
        }
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create share link error:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    )
  }
}

// GET - List share links for a project
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      )
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const shareLinks = await prisma.shareLink.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      shareLinks: shareLinks.map(link => ({
        id: link.id,
        token: link.token,
        url: `${baseUrl}/shared/${link.token}`,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        currentViews: link.currentViews,
        maxViews: link.maxViews,
        lastViewedAt: link.lastViewedAt,
        hasPassword: !!link.password,
        permissions: {
          canEdit: link.canEdit,
          canComment: link.canComment,
          canExport: link.canExport
        }
      }))
    })
  } catch (error) {
    console.error('List share links error:', error)
    return NextResponse.json(
      { error: 'Failed to list share links' },
      { status: 500 }
    )
  }
}

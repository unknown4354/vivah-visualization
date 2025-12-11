import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { exportService } from '@/lib/services/export-service'
import { StorageService } from '@/lib/services/storage-service'

interface RouteParams {
  params: Promise<{ format: string }>
}

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { format } = await context.params
    const body = await req.json()
    const { projectId, options = {} } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    let result: Buffer
    let contentType: string
    let filename: string

    switch (format.toLowerCase()) {
      case 'pdf':
        result = await exportService.exportToPDF(projectId)
        contentType = 'application/pdf'
        filename = `${project.name.replace(/[^a-z0-9]/gi, '-')}-export.pdf`
        break

      case 'png':
        result = await exportService.exportToImage(projectId, {
          ...options,
          format: 'png'
        })
        contentType = 'image/png'
        filename = `${project.name.replace(/[^a-z0-9]/gi, '-')}-export.png`
        break

      case 'jpg':
      case 'jpeg':
        result = await exportService.exportToImage(projectId, {
          ...options,
          format: 'jpeg'
        })
        contentType = 'image/jpeg'
        filename = `${project.name.replace(/[^a-z0-9]/gi, '-')}-export.jpg`
        break

      case 'webp':
        result = await exportService.exportToImage(projectId, {
          ...options,
          format: 'webp'
        })
        contentType = 'image/webp'
        filename = `${project.name.replace(/[^a-z0-9]/gi, '-')}-export.webp`
        break

      case 'glb':
        result = await exportService.exportToGLB(projectId)
        contentType = 'model/gltf-binary'
        filename = `${project.name.replace(/[^a-z0-9]/gi, '-')}-export.glb`
        break

      default:
        return NextResponse.json(
          { error: `Invalid format: ${format}. Supported: pdf, png, jpg, webp, glb` },
          { status: 400 }
        )
    }

    // Upload to storage
    const uploadResult = await StorageService.uploadBuffer(
      result,
      `exports/${projectId}`,
      contentType
    )

    // Save export record
    const exportRecord = await prisma.export.create({
      data: {
        projectId,
        format: format.toLowerCase(),
        url: uploadResult.url,
        resolution: options.width && options.height
          ? `${options.width}x${options.height}`
          : null,
        settings: options,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        projectId,
        action: 'project.exported',
        metadata: {
          format,
          exportId: exportRecord.id,
          fileSize: uploadResult.size
        }
      }
    })

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename,
      format,
      size: uploadResult.size,
      expiresAt: exportRecord.expiresAt
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      {
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET - List user's exports for a project
export async function GET(req: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const exports = await prisma.export.findMany({
      where: {
        projectId,
        expiresAt: {
          gte: new Date()
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({ exports })
  } catch (error) {
    console.error('Error fetching exports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    )
  }
}

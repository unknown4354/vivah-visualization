import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { imageTo3DService } from '@/lib/services/image-to-3d-service'
import { z } from 'zod'

const ImageTo3DSchema = z.object({
  imageUrl: z.string().url(),
  removeBackground: z.boolean().optional(),
  foregroundRatio: z.number().min(0.5).max(1).optional(),
  useInstantMesh: z.boolean().optional(),
  projectId: z.string().optional()
})

// POST /api/ai/image-to-3d - Convert 2D image to 3D model
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = ImageTo3DSchema.parse(body)

    // Check user credits
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { subscription: true }
    })

    if (dbUser?.subscription && dbUser.subscription.credits < 5) {
      return NextResponse.json(
        { error: 'Insufficient credits. 3D conversion requires 5 credits.' },
        { status: 402 }
      )
    }

    let result

    if (validatedData.useInstantMesh) {
      // Higher quality but slower
      result = await imageTo3DService.convertWithInstantMesh({
        imageUrl: validatedData.imageUrl
      })
    } else {
      // Default: TripoSR (faster)
      result = await imageTo3DService.convertToGLB({
        imageUrl: validatedData.imageUrl,
        removeBackground: validatedData.removeBackground,
        foregroundRatio: validatedData.foregroundRatio
      })
    }

    // Log the generation
    await prisma.aIGeneration.create({
      data: {
        userId: user.id,
        projectId: validatedData.projectId,
        type: 'image_to_3d',
        prompt: 'Image to 3D conversion',
        model: validatedData.useInstantMesh ? 'instantmesh' : 'triposr',
        resultUrl: result.glbUrl,
        credits: 5,
        metadata: {
          processingTime: result.processingTime,
          removeBackground: validatedData.removeBackground,
          foregroundRatio: validatedData.foregroundRatio
        }
      }
    })

    // Deduct credits if user has subscription
    if (dbUser?.subscription) {
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { credits: { decrement: 5 } }
      })
    }

    return NextResponse.json({
      glbUrl: result.glbUrl,
      processingTime: result.processingTime
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Image to 3D error:', error)
    return NextResponse.json(
      { error: '3D conversion failed' },
      { status: 500 }
    )
  }
}

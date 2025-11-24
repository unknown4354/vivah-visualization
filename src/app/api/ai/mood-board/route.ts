import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { aiService } from '@/lib/services/ai-service'
import { MoodBoardSchema } from '@/lib/validators/ai'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = MoodBoardSchema.parse(body)

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has credits (free users get 5 credits)
    const credits = user.subscription?.credits ?? 5
    if (credits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan.' },
        { status: 402 }
      )
    }

    // Generate mood board images
    const startTime = Date.now()
    const imageUrls = await aiService.generateMoodBoard({
      prompt: validatedData.prompt,
      style: validatedData.style,
      count: validatedData.count
    })
    const processingTime = Date.now() - startTime

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate images. Please try again.' },
        { status: 500 }
      )
    }

    // Save to database
    const generation = await prisma.aIGeneration.create({
      data: {
        userId: session.user.id,
        projectId: validatedData.projectId,
        type: 'mood_board',
        prompt: validatedData.prompt,
        model: 'flux-schnell',
        resultUrl: imageUrls[0],
        metadata: {
          style: validatedData.style,
          count: validatedData.count,
          allImages: imageUrls
        },
        credits: 1,
        processingTime
      }
    })

    // Deduct credits
    if (user.subscription) {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { credits: { decrement: 1 } }
      })
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        projectId: validatedData.projectId,
        action: 'ai.mood_board_generated',
        metadata: {
          generationId: generation.id,
          imageCount: imageUrls.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      images: imageUrls,
      generation: {
        id: generation.id,
        type: generation.type,
        createdAt: generation.createdAt
      },
      creditsRemaining: credits - 1
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Mood board generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate mood board' },
      { status: 500 }
    )
  }
}

// GET - Retrieve user's mood board generations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const generations = await prisma.aIGeneration.findMany({
      where: {
        userId: session.user.id,
        type: 'mood_board',
        ...(projectId && { projectId })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ generations })
  } catch (error) {
    console.error('Error fetching generations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generations' },
      { status: 500 }
    )
  }
}

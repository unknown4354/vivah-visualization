import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { fluxInpaintService } from '@/lib/services/flux-inpaint-service'
import { StorageService } from '@/lib/services/storage-service'
import { promptEnhancerService } from '@/lib/services/prompt-enhancer'
import { imagePostProcessor, PostProcessOptions } from '@/lib/services/image-post-processor'
import { z } from 'zod'
import sharp from 'sharp'

// Resize image if too large (max 2048px on longest side, max 5MB)
async function resizeIfNeeded(base64: string, maxSize: number = 2048, maxBytes: number = 5 * 1024 * 1024): Promise<string> {
  const buffer = Buffer.from(base64, 'base64')

  // Check if already small enough
  if (buffer.length <= maxBytes) {
    const metadata = await sharp(buffer).metadata()
    if (metadata.width && metadata.height &&
        metadata.width <= maxSize && metadata.height <= maxSize) {
      return base64
    }
  }

  // Resize
  const resized = await sharp(buffer)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .png({ quality: 90 })
    .toBuffer()

  return resized.toString('base64')
}

export const runtime = 'nodejs'

const PreciseEditSchema = z.object({
  imageBase64: z.string(),
  maskBase64: z.string(),
  prompt: z.string().min(1).max(500),
  strength: z.number().min(0).max(1).optional(),
  projectId: z.string().optional(),
  // New fields
  iterations: z.number().min(1).max(4).default(1),
  enhancePrompt: z.boolean().default(true),
  parentGenerationId: z.string().optional(),
  useComposite: z.boolean().default(true), // Whether to composite onto original or return raw
  postProcess: z.object({
    autoEnhance: z.boolean().optional(),
    colorCorrection: z.object({
      saturation: z.number().optional(),
      brightness: z.number().optional(),
      contrast: z.number().optional()
    }).optional(),
    sharpen: z.enum(['light', 'medium', 'strong']).optional(),
    upscale: z.union([z.literal(2), z.literal(4)]).optional()
  }).optional()
})

// POST /api/ai/edit/precise - Precise inpainting using SDXL
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Debug logging
    console.log('Precise edit request body:', {
      hasImageBase64: !!body.imageBase64,
      imageBase64Length: body.imageBase64?.length,
      hasMaskBase64: !!body.maskBase64,
      maskBase64Length: body.maskBase64?.length,
      prompt: body.prompt,
      strength: body.strength,
      projectId: body.projectId,
      iterations: body.iterations,
      enhancePrompt: body.enhancePrompt,
      parentGenerationId: body.parentGenerationId,
      postProcess: body.postProcess
    })

    const validatedData = PreciseEditSchema.parse(body)

    // Check user credits
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { subscription: true }
    })

    if (dbUser?.subscription && dbUser.subscription.credits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Generate prompt variations
    const iterations = validatedData.iterations || 1
    let prompts: string[]

    if (validatedData.enhancePrompt) {
      const enhanced = promptEnhancerService.quickEnhance(validatedData.prompt)
      prompts = promptEnhancerService.generateVariations(enhanced, iterations)
    } else {
      prompts = promptEnhancerService.generateVariations(validatedData.prompt, iterations)
    }

    const iterationGroup = crypto.randomUUID()
    const results: Array<{ imageUrl: string; prompt: string; enhancedPrompt: string }> = []

    const generateOne = async (promptToUse: string): Promise<string> => {
      // Use nano-banana-pro on Replicate
      // Resize images if too large
      const resizedImage = await resizeIfNeeded(validatedData.imageBase64)
      const resizedMask = await resizeIfNeeded(validatedData.maskBase64)

      const imageBuffer = Buffer.from(resizedImage, 'base64')
      const imageUpload = await StorageService.uploadBuffer(
        imageBuffer,
        `images/${user.id}`,
        'image/png'
      )

      const maskBuffer = Buffer.from(resizedMask, 'base64')
      const maskUpload = await StorageService.uploadBuffer(
        maskBuffer,
        `masks/${user.id}`,
        'image/png'
      )

      const result = await fluxInpaintService.inpaint({
        imageUrl: imageUpload.url,
        maskUrl: maskUpload.url,
        prompt: promptToUse,
        strength: validatedData.strength
      })

      // Return composited or raw based on user preference
      if (validatedData.useComposite && result.compositedBuffer) {
        const compositedUpload = await StorageService.uploadBuffer(
          result.compositedBuffer,
          `results/${user.id}`,
          'image/png'
        )
        return compositedUpload.url
      }

      // Return raw generated image (not composited)
      return result.imageUrl
    }

    // Run all iterations
    const generationPromises = prompts.map(async (prompt, index) => {
      const resultUrl = await generateOne(prompt)

      // Save to database - only use parentGenerationId if it's a valid UUID that exists
      const generation = await prisma.aIGeneration.create({
        data: {
          userId: user.id,
          projectId: validatedData.projectId,
          type: 'precise_edit',
          prompt: validatedData.prompt,
          enhancedPrompt: prompt,
          model: 'nano-banana-pro',
          resultUrl,
          credits: 2,
          // Don't pass parentGenerationId as it's client-generated and may not exist
          iterationGroup,
          isChosen: index === 0,
          postProcessing: validatedData.postProcess || undefined,
          metadata: {
            strength: validatedData.strength
          }
        }
      })

      results.push({
        imageUrl: resultUrl,
        prompt: validatedData.prompt,
        enhancedPrompt: prompt,
        generationId: generation.id // Return actual DB ID
      })

      // Also save to project images if projectId is provided
      if (validatedData.projectId) {
        await prisma.projectImage.create({
          data: {
            projectId: validatedData.projectId,
            url: resultUrl,
            name: `Edit: ${validatedData.prompt.substring(0, 50)}`,
            isOriginal: false
          }
        })
      }
    })

    await Promise.all(generationPromises)

    // Deduct credits (2 per iteration for precise edits)
    const totalCredits = iterations * 2
    if (dbUser?.subscription) {
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { credits: { decrement: totalCredits } }
      })
    }

    return NextResponse.json({
      results,
      iterationGroup,
      creditsUsed: totalCredits
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Precise edit Zod validation error:', JSON.stringify(error.issues, null, 2))
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Precise edit error:', error)
    return NextResponse.json(
      { error: 'Edit failed' },
      { status: 500 }
    )
  }
}

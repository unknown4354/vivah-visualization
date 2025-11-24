import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { fluxInpaintService } from '@/lib/services/flux-inpaint-service'
import { StorageService } from '@/lib/services/storage-service'
import { promptEnhancerService } from '@/lib/services/prompt-enhancer'
import { z } from 'zod'
import sharp from 'sharp'

// Resize image if too large (max 2048px on longest side, max 5MB)
async function resizeIfNeeded(base64: string, maxSize: number = 2048, maxBytes: number = 5 * 1024 * 1024): Promise<string> {
  const buffer = Buffer.from(base64, 'base64')

  if (buffer.length <= maxBytes) {
    const metadata = await sharp(buffer).metadata()
    if (metadata.width && metadata.height &&
        metadata.width <= maxSize && metadata.height <= maxSize) {
      return base64
    }
  }

  const resized = await sharp(buffer)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .png({ quality: 90 })
    .toBuffer()

  return resized.toString('base64')
}

export const runtime = 'nodejs'

const LightingEditSchema = z.object({
  imageUrl: z.string().optional(),
  imageBase64: z.string().optional(),
  prompt: z.string().min(1).max(500),
  projectId: z.string().optional(),
  // New fields
  iterations: z.number().min(1).max(4).default(1),
  enhancePrompt: z.boolean().default(true),
  parentGenerationId: z.string().optional(),
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

// POST /api/ai/edit/lighting - Global lighting/theme edits using Qwen
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Debug logging
    console.log('Lighting edit request body:', {
      hasImageUrl: !!body.imageUrl,
      hasImageBase64: !!body.imageBase64,
      imageBase64Length: body.imageBase64?.length,
      prompt: body.prompt,
      projectId: body.projectId,
      iterations: body.iterations,
      enhancePrompt: body.enhancePrompt,
      parentGenerationId: body.parentGenerationId,
      postProcess: body.postProcess
    })

    const validatedData = LightingEditSchema.parse(body)

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

    // Get base64 image
    let imageBase64: string

    if (validatedData.imageBase64) {
      imageBase64 = validatedData.imageBase64
    } else if (validatedData.imageUrl) {
      const https = await import('https')
      const http = await import('http')

      imageBase64 = await new Promise<string>((resolve, reject) => {
        const url = new URL(validatedData.imageUrl!)
        const client = url.protocol === 'https:' ? https : http

        client.get(url.toString(), (res) => {
          const chunks: Buffer[] = []
          res.on('data', (chunk) => chunks.push(chunk))
          res.on('end', () => {
            const buffer = Buffer.concat(chunks)
            resolve(buffer.toString('base64'))
          })
          res.on('error', reject)
        }).on('error', reject)
      })
    } else {
      return NextResponse.json(
        { error: 'Either imageUrl or imageBase64 is required' },
        { status: 400 }
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

    // Generate all iterations in parallel
    const iterationGroup = crypto.randomUUID()
    const results: Array<{ imageUrl: string; prompt: string; enhancedPrompt: string; generationId: string }> = []

    const generateOne = async (promptToUse: string): Promise<{ imageUrl: string; imageBase64Result: string }> => {
      // Use nano-banana-pro on Replicate
      let imageUrlToUse = validatedData.imageUrl
      if (!imageUrlToUse) {
        // Resize if needed
        const resizedImage = await resizeIfNeeded(imageBase64)
        const imageBuffer = Buffer.from(resizedImage, 'base64')
        const imageUpload = await StorageService.uploadBuffer(
          imageBuffer,
          `images/${user.id}`,
          'image/png'
        )
        imageUrlToUse = imageUpload.url
      }

      const resultUrl = await fluxInpaintService.editLighting({
        imageUrl: imageUrlToUse,
        prompt: promptToUse
      })
      return { imageUrl: resultUrl, imageBase64Result: '' }
    }

    // Run all iterations
    const generationPromises = prompts.map(async (prompt, index) => {
      const result = await generateOne(prompt)

      // Save to database
      const generation = await prisma.aIGeneration.create({
        data: {
          userId: user.id,
          projectId: validatedData.projectId,
          type: 'lighting_edit',
          prompt: validatedData.prompt,
          enhancedPrompt: prompt,
          model: 'nano-banana-pro',
          resultUrl: result.imageUrl,
          credits: 1,
          // Don't pass parentGenerationId as it's client-generated and may not exist
          iterationGroup,
          isChosen: index === 0,
          postProcessing: validatedData.postProcess || undefined
        }
      })

      results.push({
        imageUrl: result.imageUrl,
        prompt: validatedData.prompt,
        enhancedPrompt: prompt,
        generationId: generation.id
      })
    })

    await Promise.all(generationPromises)

    // Deduct credits (1 per iteration)
    const totalCredits = iterations
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
      console.error('Lighting edit Zod validation error:', JSON.stringify(error.issues, null, 2))
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Lighting edit error:', error)
    return NextResponse.json(
      { error: 'Edit failed' },
      { status: 500 }
    )
  }
}

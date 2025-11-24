import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { StorageService } from '@/lib/services/storage-service'
import { promptEnhancerService } from '@/lib/services/prompt-enhancer'
import { imagePostProcessor, PostProcessOptions } from '@/lib/services/image-post-processor'
import { z } from 'zod'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

const QuickEditSchema = z.object({
  imageBase64: z.string(),
  mimeType: z.string(),
  prompt: z.string().min(1).max(500),
  projectId: z.string().optional(),
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

// POST /api/ai/edit/quick - Quick edit using Gemini
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = QuickEditSchema.parse(body)

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

    // Upload image to storage first (Replicate needs a URL)
    const imageBuffer = Buffer.from(validatedData.imageBase64, 'base64')
    const imageUpload = await StorageService.uploadBuffer(
      imageBuffer,
      `images/${user.id}`,
      validatedData.mimeType
    )

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
    const results: Array<{ imageUrl: string; prompt: string; enhancedPrompt: string; generationId: string }> = []

    // Generate all iterations
    const generationPromises = prompts.map(async (promptToUse, index) => {
      // Enhanced wedding-specific prompt for better results
      const weddingPrompt = `${promptToUse}. Style: Professional wedding photography, elegant and romantic atmosphere, soft natural lighting, rich colors, luxurious details, high-end event photography, magazine quality, sharp focus on details`

      // Perform quick edit with google/nano-banana-pro
      const output = await replicate.run(
        "google/nano-banana-pro",
        {
          input: {
            prompt: weddingPrompt,
            image_input: [imageUpload.url],
            resolution: "2K",
            aspect_ratio: "4:3",
            output_format: "png",
            safety_filter_level: "block_only_high"
          }
        }
      )

      // Get the URL from the output (FileOutput object returns URL)
      let resultUrl: string
      if (output && typeof output === 'object') {
        if ('href' in output) {
          resultUrl = (output as URL).href
        } else if ('url' in output) {
          const url = (output as any).url
          resultUrl = typeof url === 'function' ? url().href || url().toString() : String(url)
        } else {
          resultUrl = String(output)
        }
      } else {
        resultUrl = String(output)
      }

      // Apply post-processing if requested
      if (validatedData.postProcess) {
        try {
          const response = await fetch(resultUrl)
          const buffer = await response.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')

          const postProcessOptions: PostProcessOptions = {
            autoEnhance: validatedData.postProcess.autoEnhance,
            colorCorrection: validatedData.postProcess.colorCorrection,
            sharpen: validatedData.postProcess.sharpen,
            upscale: validatedData.postProcess.upscale
          }
          const processed = await imagePostProcessor.process(base64, postProcessOptions)

          // Upload processed image
          const processedBuffer = Buffer.from(processed.imageBase64, 'base64')
          const processedUpload = await StorageService.uploadBuffer(
            processedBuffer,
            `results/${user.id}`,
            'image/png'
          )
          resultUrl = processedUpload.url
        } catch (postErr) {
          console.error('Post-processing failed:', postErr)
        }
      }

      // Log the generation
      const generation = await prisma.aIGeneration.create({
        data: {
          userId: user.id,
          projectId: validatedData.projectId,
          type: 'quick_edit',
          prompt: validatedData.prompt,
          enhancedPrompt: promptToUse,
          model: 'nano-banana-pro',
          resultUrl,
          credits: 1,
          // Don't pass parentGenerationId as it's client-generated and may not exist
          iterationGroup,
          isChosen: index === 0,
          postProcessing: validatedData.postProcess || undefined
        }
      })

      results.push({
        imageUrl: resultUrl,
        prompt: validatedData.prompt,
        enhancedPrompt: promptToUse,
        generationId: generation.id
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

    // Deduct credits if user has subscription
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
      creditsUsed: totalCredits,
      // Backward compatibility
      imageUrl: results[0]?.imageUrl
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Quick edit error:', error)

    // Check for rate limit error
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again in a few seconds or use Precise Edit mode.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Edit failed' },
      { status: 500 }
    )
  }
}

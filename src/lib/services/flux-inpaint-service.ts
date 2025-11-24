import Replicate from 'replicate'
import sharp from 'sharp'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

// Composite edited image onto original using mask
async function compositeWithMask(
  originalUrl: string,
  editedUrl: string,
  maskUrl: string
): Promise<Buffer> {
  // Fetch all images
  const [originalRes, editedRes, maskRes] = await Promise.all([
    fetch(originalUrl),
    fetch(editedUrl),
    fetch(maskUrl)
  ])

  const [originalBuffer, editedBuffer, maskBuffer] = await Promise.all([
    originalRes.arrayBuffer().then(b => Buffer.from(b)),
    editedRes.arrayBuffer().then(b => Buffer.from(b)),
    maskRes.arrayBuffer().then(b => Buffer.from(b))
  ])

  // Get dimensions from original
  const originalMeta = await sharp(originalBuffer).metadata()
  const width = originalMeta.width!
  const height = originalMeta.height!

  // Resize edited and mask to match original
  const [editedResized, maskResizedInitial] = await Promise.all([
    sharp(editedBuffer).resize(width, height).toBuffer(),
    sharp(maskBuffer).resize(width, height).grayscale().toBuffer()
  ])

  // Calculate adaptive radii based on image size
  const minDim = Math.min(width, height)

  // More aggressive dilation to cover gaps (2% of image)
  const dilationRadius = Math.max(5, Math.round(minDim * 0.02))
  // Larger feather for smoother blending (3% of image)
  const featherRadius = Math.max(8, Math.round(minDim * 0.03))

  // Step 1: Dilate mask to expand coverage area
  // Lower threshold = more expansion of white areas
  const maskDilated = await sharp(maskResizedInitial)
    .blur(dilationRadius)
    .threshold(128) // Mid threshold for balanced expansion
    .toBuffer()

  // Step 2: Apply Gaussian blur for smooth feathered edges
  const maskFeathered = await sharp(maskDilated)
    .blur(featherRadius)
    .toBuffer()

  // Step 3: Ensure proper RGBA format for edited image
  const editedRGBA = await sharp(editedResized)
    .ensureAlpha()
    .toBuffer()

  // Step 4: Use feathered mask as alpha channel
  const editedWithMask = await sharp(editedRGBA)
    .joinChannel(maskFeathered)
    .toBuffer()

  // Step 5: Composite edited onto original
  const result = await sharp(originalBuffer)
    .ensureAlpha()
    .composite([{ input: editedWithMask, blend: 'over' }])
    .png()
    .toBuffer()

  return result
}

// Helper function to retry with delay on rate limit
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 7000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if it's a rate limit error (429)
      if (lastError.message.includes('429') || lastError.message.includes('rate limit')) {
        const delay = initialDelay * Math.pow(1.5, attempt)
        console.log(`Rate limited, retrying in ${delay/1000}s (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // Not a rate limit error, don't retry
        throw lastError
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

export interface FluxInpaintParams {
  imageUrl: string
  maskUrl: string
  prompt: string
  guidanceScale?: number
  numInferenceSteps?: number
  strength?: number
}

export interface FluxInpaintResult {
  imageUrl: string
  compositedBuffer?: Buffer
}

export interface QwenEditParams {
  imageUrl: string
  prompt: string
}

export interface DepthEditParams {
  imageUrl: string
  prompt: string
  strength?: number
}

export class FluxInpaintService {
  /**
   * FLUX Fill Pro - Precise inpainting with mask
   * Best for: Changing specific elements (flowers, drapes, props)
   * Cost: ~$0.05/image
   */
  async inpaint(params: FluxInpaintParams): Promise<FluxInpaintResult> {
    const {
      imageUrl,
      maskUrl,
      prompt
    } = params

    try {
      // Use nano-banana-pro for high quality generation
      // Enhanced wedding-specific system prompt for better results
      const weddingPrompt = `${prompt}. Style: Professional wedding photography, elegant and romantic atmosphere, soft natural lighting, rich colors, luxurious details, high-end event photography, magazine quality, sharp focus on details`

      const output = await retryWithDelay(() => replicate.run(
        "google/nano-banana-pro",
        {
          input: {
            prompt: weddingPrompt,
            image_input: [imageUrl],
            resolution: "2K",
            aspect_ratio: "4:3",
            output_format: "png",
            safety_filter_level: "block_only_high"
          }
        }
      ))

      // Extract URL from output
      let editedUrl: string
      if (output && typeof output === 'object' && 'href' in output) {
        editedUrl = (output as URL).href
      } else if (Array.isArray(output)) {
        editedUrl = String(output[0])
      } else {
        editedUrl = String(output)
      }

      // Composite the edited image onto original using the mask
      const compositedBuffer = await compositeWithMask(imageUrl, editedUrl, maskUrl)

      return {
        imageUrl: editedUrl,
        compositedBuffer
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Nano Banana Pro inpaint error:', message)
      throw new Error(message)
    }
  }

  /**
   * Qwen Image Edit - Global edits without mask
   * Best for: Lighting changes, color adjustments, atmosphere/theme
   * Cost: ~$0.02/image
   */
  async editLighting(params: QwenEditParams): Promise<string> {
    const { imageUrl, prompt } = params

    try {
      // Use nano-banana-pro for lighting edits too with retry on rate limit
      // Enhanced wedding-specific prompt for atmosphere and lighting
      const weddingPrompt = `${prompt}. Style: Professional wedding photography, romantic and elegant mood, cinematic lighting, warm tones for indoor scenes, dreamy atmosphere, high-end event photography, magazine quality`

      const output = await retryWithDelay(() => replicate.run(
        "google/nano-banana-pro",
        {
          input: {
            prompt: weddingPrompt,
            image_input: [imageUrl],
            resolution: "2K",
            aspect_ratio: "4:3",
            output_format: "png",
            safety_filter_level: "block_only_high"
          }
        }
      ))

      if (output && typeof output === 'object' && 'href' in output) {
        return (output as URL).href
      }
      return String(output)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Nano Banana Pro error:', message)
      throw new Error(message)
    }
  }

  /**
   * FLUX Depth Pro - Structure-aware editing
   * Best for: Edits that need to preserve spatial structure
   * Cost: ~$0.05/image
   */
  async depthAwareEdit(params: DepthEditParams): Promise<string> {
    const { imageUrl, prompt, strength = 0.85 } = params

    try {
      const output = await replicate.run(
        "black-forest-labs/flux-depth-pro",
        {
          input: {
            image: imageUrl,
            prompt: `${prompt}, wedding venue, professional photography`,
            strength
          }
        }
      )

      const resultUrl = Array.isArray(output) ? output[0] : output
      return resultUrl as string
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('FLUX Depth Pro error:', message)
      throw new Error(message)
    }
  }

  /**
   * Bria Eraser - Remove objects cleanly
   * Best for: Removing unwanted elements
   * Cost: ~$0.02/image
   */
  async removeObject(imageUrl: string, maskUrl: string): Promise<string> {
    try {
      const output = await replicate.run(
        "bria-ai/bria-eraser" as `${string}/${string}`,
        {
          input: {
            image: imageUrl,
            mask: maskUrl
          }
        }
      )

      const resultUrl = Array.isArray(output) ? output[0] : output
      return resultUrl as string
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Bria Eraser error:', message)
      throw new Error(message)
    }
  }
}

export const fluxInpaintService = new FluxInpaintService()

import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

export interface SDXLInpaintParams {
  imageUrl: string
  maskUrl: string
  prompt: string
  negativePrompt?: string
  strength?: number
  guidanceScale?: number
  numInferenceSteps?: number
}

export interface SDXLInpaintResult {
  imageUrl: string
  seed: number
}

export interface SAMSegmentParams {
  imageUrl: string
  points?: { x: number; y: number }[]
  labels?: number[] // 1 for foreground, 0 for background
  box?: { x1: number; y1: number; x2: number; y2: number }
}

export class SDXLInpaintService {
  /**
   * Precise inpainting using SDXL with mask
   * Best for: Complex edits requiring specific areas to be modified
   * Speed: 5-15 seconds
   */
  async inpaint(params: SDXLInpaintParams): Promise<SDXLInpaintResult> {
    const {
      imageUrl,
      maskUrl,
      prompt,
      negativePrompt = 'blurry, low quality, distorted, ugly, bad anatomy',
      strength = 0.85,
      guidanceScale = 7.5,
      numInferenceSteps = 30
    } = params

    try {
      const output = await replicate.run(
        "stability-ai/stable-diffusion-xl-inpainting:c4a3f5bb6e8d5db3f1e4f5c8e5e5e5e5",
        {
          input: {
            image: imageUrl,
            mask: maskUrl,
            prompt: `${prompt}, wedding venue, professional photography, high quality, 8k`,
            negative_prompt: negativePrompt,
            strength,
            guidance_scale: guidanceScale,
            num_inference_steps: numInferenceSteps,
            scheduler: 'K_EULER_ANCESTRAL'
          }
        }
      )

      // Replicate returns array of URLs
      const resultUrl = Array.isArray(output) ? output[0] : output

      return {
        imageUrl: resultUrl as string,
        seed: 0 // Replicate doesn't always return seed
      }
    } catch (error) {
      console.error('SDXL inpaint error:', error)
      throw error
    }
  }

  /**
   * Generate mask using SAM2 (Segment Anything Model)
   */
  async generateMask(params: SAMSegmentParams): Promise<string> {
    const { imageUrl, points, labels, box } = params

    try {
      const input: any = {
        image: imageUrl,
        multimask_output: false
      }

      if (points && labels) {
        input.input_points = points.map(p => [p.x, p.y])
        input.input_labels = labels
      }

      if (box) {
        input.input_box = [box.x1, box.y1, box.x2, box.y2]
      }

      const output = await replicate.run(
        "meta/sam-2-hiera-large" as `${string}/${string}`,
        { input }
      )

      // SAM2 returns mask URLs
      const maskUrl = Array.isArray(output) ? output[0] : output

      return maskUrl as string
    } catch (error) {
      console.error('SAM2 segmentation error:', error)
      throw error
    }
  }

  /**
   * Auto-segment all objects in image
   */
  async autoSegment(imageUrl: string): Promise<string[]> {
    try {
      const output = await replicate.run(
        "meta/sam-2-hiera-large" as `${string}/${string}`,
        {
          input: {
            image: imageUrl,
            multimask_output: true
          }
        }
      )

      return Array.isArray(output) ? output : [output as string]
    } catch (error) {
      console.error('Auto segment error:', error)
      throw error
    }
  }

  /**
   * Image-to-image transformation (for style changes without mask)
   */
  async img2img(params: {
    imageUrl: string
    prompt: string
    strength?: number
  }): Promise<string> {
    const { imageUrl, prompt, strength = 0.7 } = params

    try {
      const output = await replicate.run(
        "stability-ai/sdxl:c4a3f5bb6e8d5db3f1e4f5c8e5e5e5e5",
        {
          input: {
            image: imageUrl,
            prompt: `${prompt}, wedding venue, professional photography`,
            strength,
            num_inference_steps: 30,
            guidance_scale: 7.5
          }
        }
      )

      const resultUrl = Array.isArray(output) ? output[0] : output
      return resultUrl as string
    } catch (error) {
      console.error('SDXL img2img error:', error)
      throw error
    }
  }
}

export const sdxlInpaintService = new SDXLInpaintService()

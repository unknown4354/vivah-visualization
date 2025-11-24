import sharp from 'sharp'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

export interface PostProcessOptions {
  upscale?: 2 | 4
  colorCorrection?: {
    saturation?: number    // 1.0 = normal, 1.2 = 20% boost
    brightness?: number    // 1.0 = normal
    contrast?: number      // 1.0 = normal
  }
  sharpen?: 'light' | 'medium' | 'strong'
  autoEnhance?: boolean
}

export interface PostProcessResult {
  imageBase64: string
  appliedProcessing: string[]
}

export class ImagePostProcessor {
  /**
   * Upscale image using Real-ESRGAN via Replicate
   */
  async upscale(imageBase64: string, scale: 2 | 4 = 2): Promise<string> {
    try {
      // Convert base64 to data URL for Replicate
      const dataUrl = `data:image/png;base64,${imageBase64}`

      const output = await replicate.run(
        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
        {
          input: {
            image: dataUrl,
            scale,
            face_enhance: false
          }
        }
      )

      // Fetch the result and convert back to base64
      const resultUrl = output as string
      const response = await fetch(resultUrl)
      const buffer = Buffer.from(await response.arrayBuffer())
      return buffer.toString('base64')
    } catch (error) {
      console.error('Upscale error:', error)
      throw error
    }
  }

  /**
   * Apply color corrections using Sharp
   */
  async correctColors(
    imageBase64: string,
    options: {
      saturation?: number
      brightness?: number
      contrast?: number
    }
  ): Promise<string> {
    const { saturation = 1.0, brightness = 1.0, contrast = 1.0 } = options

    let pipeline = sharp(Buffer.from(imageBase64, 'base64'))

    // Apply modulation for saturation and brightness
    if (saturation !== 1.0 || brightness !== 1.0) {
      pipeline = pipeline.modulate({
        saturation,
        brightness
      })
    }

    // Apply contrast adjustment via linear transformation
    if (contrast !== 1.0) {
      pipeline = pipeline.linear(contrast, -(128 * (contrast - 1)))
    }

    const buffer = await pipeline.png().toBuffer()
    return buffer.toString('base64')
  }

  /**
   * Apply sharpening using Sharp
   */
  async sharpen(imageBase64: string, strength: 'light' | 'medium' | 'strong'): Promise<string> {
    const sigmaValues = {
      light: 0.5,
      medium: 1.0,
      strong: 1.5
    }

    const buffer = await sharp(Buffer.from(imageBase64, 'base64'))
      .sharpen({ sigma: sigmaValues[strength] })
      .png()
      .toBuffer()

    return buffer.toString('base64')
  }

  /**
   * Auto-enhance: normalize levels for better exposure
   */
  async autoEnhance(imageBase64: string): Promise<string> {
    const buffer = await sharp(Buffer.from(imageBase64, 'base64'))
      .normalize() // Auto-adjusts levels
      .png()
      .toBuffer()

    return buffer.toString('base64')
  }

  /**
   * Apply full post-processing pipeline
   */
  async process(imageBase64: string, options: PostProcessOptions): Promise<PostProcessResult> {
    let result = imageBase64
    const appliedProcessing: string[] = []

    // 1. Auto enhance (do first if enabled)
    if (options.autoEnhance) {
      result = await this.autoEnhance(result)
      appliedProcessing.push('auto-enhance')
    }

    // 2. Color correction
    if (options.colorCorrection) {
      result = await this.correctColors(result, options.colorCorrection)
      appliedProcessing.push('color-correction')
    }

    // 3. Sharpening (before upscale for better results)
    if (options.sharpen) {
      result = await this.sharpen(result, options.sharpen)
      appliedProcessing.push(`sharpen-${options.sharpen}`)
    }

    // 4. Upscale (do last as it's the most expensive)
    if (options.upscale) {
      result = await this.upscale(result, options.upscale)
      appliedProcessing.push(`upscale-${options.upscale}x`)
    }

    return {
      imageBase64: result,
      appliedProcessing
    }
  }

  /**
   * Quick presets for common use cases
   */
  getPreset(preset: 'quick' | 'high-quality' | 'print-ready'): PostProcessOptions {
    switch (preset) {
      case 'quick':
        return {
          autoEnhance: true,
          sharpen: 'light'
        }
      case 'high-quality':
        return {
          autoEnhance: true,
          colorCorrection: {
            saturation: 1.1,
            contrast: 1.05
          },
          sharpen: 'medium',
          upscale: 2
        }
      case 'print-ready':
        return {
          autoEnhance: true,
          colorCorrection: {
            saturation: 1.15,
            contrast: 1.1
          },
          sharpen: 'strong',
          upscale: 4
        }
    }
  }
}

export const imagePostProcessor = new ImagePostProcessor()

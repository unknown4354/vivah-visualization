import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

export interface ImageTo3DParams {
  imageUrl: string
  removeBackground?: boolean
  foregroundRatio?: number
}

export interface ImageTo3DResult {
  glbUrl: string
  processingTime?: number
}

export class ImageTo3DService {
  /**
   * Convert 2D image to 3D model using TripoSR
   * Best for: Converting venue/stage photos to 3D models
   * Speed: 10-30 seconds
   */
  async convertToGLB(params: ImageTo3DParams): Promise<ImageTo3DResult> {
    const {
      imageUrl,
      removeBackground = true,
      foregroundRatio = 0.85
    } = params

    const startTime = Date.now()

    try {
      const output = await replicate.run(
        "stability-ai/triposr:latest",
        {
          input: {
            image: imageUrl,
            do_remove_background: removeBackground,
            foreground_ratio: foregroundRatio,
            mc_resolution: 256,
            render_resolution: 512
          }
        }
      )

      const processingTime = Date.now() - startTime

      // TripoSR returns GLB file URL
      return {
        glbUrl: output as string,
        processingTime
      }
    } catch (error) {
      console.error('TripoSR error:', error)
      throw error
    }
  }

  /**
   * Alternative: Use InstantMesh for higher quality
   * Slower but better topology
   */
  async convertWithInstantMesh(params: ImageTo3DParams): Promise<ImageTo3DResult> {
    const { imageUrl } = params

    const startTime = Date.now()

    try {
      const output = await replicate.run(
        "camenduru/instantmesh:latest",
        {
          input: {
            input_image: imageUrl
          }
        }
      )

      const processingTime = Date.now() - startTime

      // InstantMesh returns multiple outputs, we want the GLB
      const result = output as any
      const glbUrl = result.glb || result[0]

      return {
        glbUrl,
        processingTime
      }
    } catch (error) {
      console.error('InstantMesh error:', error)
      throw error
    }
  }

  /**
   * Generate multiple views from single image
   * Useful for better 3D reconstruction
   */
  async generateMultiView(imageUrl: string): Promise<string[]> {
    try {
      const output = await replicate.run(
        "camenduru/zero123plus:latest",
        {
          input: {
            image: imageUrl,
            num_views: 6
          }
        }
      )

      return Array.isArray(output) ? output : [output as string]
    } catch (error) {
      console.error('Multi-view generation error:', error)
      throw error
    }
  }
}

export const imageTo3DService = new ImageTo3DService()

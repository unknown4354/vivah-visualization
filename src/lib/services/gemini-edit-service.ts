import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export interface GeminiEditParams {
  imageBase64: string
  mimeType: string
  prompt: string
}

export interface GeminiEditResult {
  editedImageBase64: string
  mimeType: string
}

export class GeminiEditService {
  private model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseModalities: ['image', 'text'],
    }
  })

  /**
   * Quick edit using Gemini's native image editing
   * Best for: Simple edits like color changes, adding/removing elements
   * Speed: <1 second
   */
  async editImage(params: GeminiEditParams): Promise<GeminiEditResult> {
    const { imageBase64, mimeType, prompt } = params

    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType,
            data: imageBase64
          }
        },
        {
          text: `Edit this wedding venue/stage image: ${prompt}.
                 Keep the overall composition and lighting consistent.
                 Return only the edited image.`
        }
      ])

      const response = result.response
      const candidates = response.candidates

      if (!candidates || candidates.length === 0) {
        throw new Error('No response from Gemini')
      }

      // Find the image part in the response
      for (const candidate of candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            return {
              editedImageBase64: part.inlineData.data,
              mimeType: part.inlineData.mimeType
            }
          }
        }
      }

      throw new Error('No image in Gemini response')
    } catch (error) {
      console.error('Gemini edit error:', error)
      throw error
    }
  }

  /**
   * Generate multiple edit suggestions
   */
  async generateEditSuggestions(params: {
    imageBase64: string
    mimeType: string
    style: string
  }): Promise<string[]> {
    const { imageBase64, mimeType, style } = params

    const textModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const result = await textModel.generateContent([
      {
        inlineData: {
          mimeType,
          data: imageBase64
        }
      },
      {
        text: `Analyze this wedding venue/stage image and suggest 5 specific edits
               that would improve it for a ${style} wedding theme.
               Focus on: colors, flowers, fabrics, lighting, decorations.
               Return only a JSON array of strings with the edit suggestions.
               Example: ["Add pink rose centerpieces to tables", "Change backdrop to ivory drapes"]`
      }
    ])

    const text = result.response.text()

    try {
      // Extract JSON array from response
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        return JSON.parse(match[0])
      }
      return []
    } catch {
      return []
    }
  }
}

export const geminiEditService = new GeminiEditService()

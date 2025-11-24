import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export interface ImageContext {
  type: 'mandap' | 'stage' | 'reception' | 'entrance' | 'outdoor' | 'general'
  elements: string[]
  style: 'traditional' | 'modern' | 'rustic' | 'minimalist' | 'luxury' | 'mixed'
  colors: string[]
}

export class PromptEnhancerService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  // Quality boosters to append
  private qualityBoosters = [
    'professional photography',
    'high resolution',
    'detailed',
    'realistic lighting',
    'sharp focus'
  ]

  // Context-specific keywords
  private contextKeywords: Record<ImageContext['type'], string[]> = {
    mandap: ['traditional Indian wedding mandap', 'ornate decorations', 'sacred canopy', 'ceremonial setting'],
    stage: ['elegant wedding stage', 'romantic ambiance', 'grand backdrop', 'decorative elements'],
    reception: ['reception hall', 'banquet setting', 'guest seating arrangement', 'celebratory atmosphere'],
    entrance: ['grand entrance', 'welcoming decor', 'floral archway', 'impressive gateway'],
    outdoor: ['garden venue', 'natural setting', 'outdoor ceremony', 'scenic backdrop'],
    general: ['wedding venue', 'celebration setting', 'elegant decor']
  }

  // Style-specific modifiers
  private styleModifiers: Record<ImageContext['style'], string[]> = {
    traditional: ['classic elegance', 'timeless design', 'cultural heritage', 'ornate details'],
    modern: ['contemporary style', 'clean lines', 'sleek design', 'minimalist elegance'],
    rustic: ['natural textures', 'organic elements', 'warm tones', 'countryside charm'],
    minimalist: ['simple beauty', 'uncluttered', 'subtle elegance', 'refined simplicity'],
    luxury: ['opulent', 'lavish decorations', 'premium materials', 'extravagant details'],
    mixed: ['eclectic blend', 'fusion style', 'unique combination']
  }

  /**
   * Analyze image to detect context using Gemini
   */
  async analyzeImageContext(imageBase64: string): Promise<ImageContext> {
    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64
          }
        },
        {
          text: `Analyze this wedding venue/decoration image and return a JSON object with:
          - type: one of "mandap", "stage", "reception", "entrance", "outdoor", "general"
          - elements: array of detected elements like "flowers", "drapes", "lights", "chairs", "tables", etc.
          - style: one of "traditional", "modern", "rustic", "minimalist", "luxury", "mixed"
          - colors: array of dominant colors like "gold", "pink", "white", "red", etc.

          Return ONLY the JSON object, no other text.`
        }
      ])

      const text = result.response.text()
      const match = text.match(/\{[\s\S]*\}/)

      if (match) {
        return JSON.parse(match[0]) as ImageContext
      }

      // Default context if analysis fails
      return {
        type: 'general',
        elements: [],
        style: 'mixed',
        colors: []
      }
    } catch (error) {
      console.error('Image context analysis failed:', error)
      return {
        type: 'general',
        elements: [],
        style: 'mixed',
        colors: []
      }
    }
  }

  /**
   * Enhance user prompt with context and quality boosters
   */
  enhancePrompt(userPrompt: string, context?: ImageContext): string {
    const parts: string[] = [userPrompt]

    if (context) {
      // Add context-specific keywords
      const contextWords = this.contextKeywords[context.type]
      if (contextWords.length > 0) {
        parts.push(contextWords[0]) // Add primary context keyword
      }

      // Add style modifiers
      const styleWords = this.styleModifiers[context.style]
      if (styleWords.length > 0) {
        parts.push(styleWords[0])
      }

      // Mention existing elements for coherence
      if (context.elements.length > 0) {
        parts.push(`maintaining ${context.elements.slice(0, 2).join(' and ')}`)
      }

      // Include color palette
      if (context.colors.length > 0) {
        parts.push(`${context.colors[0]} color scheme`)
      }
    }

    // Add quality boosters
    parts.push(...this.qualityBoosters.slice(0, 3))

    return parts.join(', ')
  }

  /**
   * Generate prompt variations for multi-iteration generation
   */
  generateVariations(basePrompt: string, count: number): string[] {
    if (count <= 1) return [basePrompt]

    const variations: string[] = [basePrompt]

    const modifiers = [
      ['vibrant colors', 'soft pastel tones', 'rich jewel tones', 'neutral palette'],
      ['dramatic lighting', 'natural daylight', 'warm golden hour', 'soft diffused light'],
      ['intricate details', 'bold statement pieces', 'delicate accents', 'layered textures'],
      ['romantic atmosphere', 'celebratory mood', 'serene ambiance', 'festive energy']
    ]

    for (let i = 1; i < count; i++) {
      // Pick different modifiers for each variation
      const modifierSet = modifiers[i % modifiers.length]
      const modifier = modifierSet[Math.floor(Math.random() * modifierSet.length)]
      variations.push(`${basePrompt}, ${modifier}`)
    }

    return variations
  }

  /**
   * Build context-aware prompt for iterative refinement
   */
  buildIterativePrompt(
    userPrompt: string,
    previousEdits: string[],
    context?: ImageContext
  ): string {
    let enhancedPrompt = this.enhancePrompt(userPrompt, context)

    if (previousEdits.length > 0) {
      const contextSummary = previousEdits.slice(-3).join(', ')
      enhancedPrompt = `Building on previous edits (${contextSummary}), ${enhancedPrompt}`
    }

    return enhancedPrompt
  }

  /**
   * Quick enhance without image analysis - smarter context-aware enhancement
   */
  quickEnhance(userPrompt: string): string {
    const prompt = userPrompt.toLowerCase()
    const enhancements: string[] = []

    // Detect and enhance based on keywords
    if (prompt.includes('light') || prompt.includes('fairy') || prompt.includes('lamp')) {
      enhancements.push('warm ambient glow', 'romantic atmosphere')
    }
    if (prompt.includes('flower') || prompt.includes('floral') || prompt.includes('rose') || prompt.includes('petal')) {
      enhancements.push('fresh lush arrangement', 'professionally styled')
    }
    if (prompt.includes('drape') || prompt.includes('curtain') || prompt.includes('fabric') || prompt.includes('cloth')) {
      enhancements.push('flowing luxurious fabric', 'elegant draping')
    }
    if (prompt.includes('color') || prompt.includes('pink') || prompt.includes('gold') || prompt.includes('red') || prompt.includes('white')) {
      enhancements.push('rich vibrant tones', 'cohesive color palette')
    }
    if (prompt.includes('candle') || prompt.includes('diya') || prompt.includes('flame')) {
      enhancements.push('soft candlelight glow', 'romantic ambiance')
    }
    if (prompt.includes('mandap') || prompt.includes('stage') || prompt.includes('altar')) {
      enhancements.push('ornate traditional design', 'ceremonial grandeur')
    }
    if (prompt.includes('table') || prompt.includes('chair') || prompt.includes('seating')) {
      enhancements.push('elegant arrangement', 'cohesive styling')
    }

    // Detect action intent
    if (prompt.includes('add') || prompt.includes('put') || prompt.includes('place')) {
      enhancements.push('seamlessly integrated')
    }
    if (prompt.includes('change') || prompt.includes('replace') || prompt.includes('make')) {
      enhancements.push('natural transformation')
    }
    if (prompt.includes('remove') || prompt.includes('delete') || prompt.includes('clear')) {
      enhancements.push('clean result')
    }

    // Default wedding context if no specific matches
    if (enhancements.length === 0) {
      enhancements.push('elegant wedding setting', 'sophisticated styling')
    }

    // Build final prompt - keep it concise and specific
    return `${userPrompt}, ${enhancements.join(', ')}`
  }
}

export const promptEnhancerService = new PromptEnhancerService()

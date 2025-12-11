import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

interface MoodBoardParams {
  prompt: string
  style?: string
  count?: number
}

interface LayoutSuggestionParams {
  venueSize: { width: number; length: number }
  guestCount: number
  style: string
}

interface LayoutItem {
  type: string
  position: { x: number; z: number }
  rotation?: number
}

export class AIService {
  // Generate mood board images using FLUX Schnell
  async generateMoodBoard(params: MoodBoardParams): Promise<string[]> {
    const { prompt, style = 'modern', count = 4 } = params

    const stylePrompts: Record<string, string> = {
      modern: 'modern minimalist wedding',
      traditional: 'traditional ornate Indian wedding',
      rustic: 'rustic barn wedding',
      bohemian: 'bohemian outdoor wedding',
      luxury: 'luxury elegant wedding',
      royal: 'royal palace wedding India'
    }

    const fullPrompt = `${prompt}, ${stylePrompts[style] || style}, professional photography, high quality, 8k, wedding decoration, beautiful lighting`

    const results: string[] = []

    for (let i = 0; i < count; i++) {
      try {
        const output = await replicate.run(
          "black-forest-labs/flux-schnell",
          {
            input: {
              prompt: fullPrompt,
              aspect_ratio: "16:9",
              output_format: "webp",
              output_quality: 80,
              num_outputs: 1,
              seed: Math.floor(Math.random() * 1000000)
            }
          }
        )

        // FLUX returns an array of URLs
        if (Array.isArray(output) && output.length > 0) {
          results.push(output[0] as string)
        }
      } catch (error) {
        console.error(`Error generating image ${i + 1}:`, error)
      }
    }

    return results
  }

  // Generate layout suggestions based on venue and guest count
  async generateLayoutSuggestion(params: LayoutSuggestionParams): Promise<{ items: LayoutItem[] }> {
    const { venueSize, guestCount, style } = params

    // Calculate optimal table arrangement
    const tablesNeeded = Math.ceil(guestCount / 8) // 8 guests per table
    const layout = this.calculateOptimalLayout(venueSize, tablesNeeded, style)

    return layout
  }

  // Extract color palette from an image
  async extractColorPalette(imageUrl: string): Promise<string[]> {
    // Default wedding color palettes based on common themes
    // In production, this could use an actual color extraction API
    const defaultPalettes: Record<string, string[]> = {
      traditional: ['#FFD700', '#800020', '#FFFFFF', '#F0E68C', '#8B0000'],
      modern: ['#000000', '#FFFFFF', '#C0C0C0', '#FFD700', '#F5F5F5'],
      rustic: ['#8B4513', '#F5DEB3', '#228B22', '#FFF8DC', '#D2691E'],
      bohemian: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'],
      royal: ['#4B0082', '#FFD700', '#800020', '#FFFFFF', '#DAA520']
    }

    return defaultPalettes.traditional
  }

  // Calculate optimal layout based on style
  private calculateOptimalLayout(
    venue: { width: number; length: number },
    tableCount: number,
    style: string
  ): { items: LayoutItem[] } {
    switch (style) {
      case 'banquet':
        return this.banquetLayout(venue, tableCount)
      case 'theater':
        return this.theaterLayout(venue, tableCount)
      case 'cocktail':
        return this.cocktailLayout(venue, tableCount)
      case 'classroom':
        return this.classroomLayout(venue, tableCount)
      case 'u-shape':
        return this.uShapeLayout(venue, tableCount)
      default:
        return this.banquetLayout(venue, tableCount)
    }
  }

  // Standard banquet layout with round tables
  private banquetLayout(
    venue: { width: number; length: number },
    tableCount: number
  ): { items: LayoutItem[] } {
    const items: LayoutItem[] = []

    // Calculate grid arrangement
    const cols = Math.ceil(Math.sqrt(tableCount * (venue.width / venue.length)))
    const rows = Math.ceil(tableCount / cols)

    // Calculate spacing
    const xSpacing = venue.width / (cols + 1)
    const zSpacing = venue.length / (rows + 1)

    let itemCount = 0
    for (let r = 0; r < rows && itemCount < tableCount; r++) {
      for (let c = 0; c < cols && itemCount < tableCount; c++) {
        // Add table
        items.push({
          type: 'round-table',
          position: {
            x: (c + 1) * xSpacing,
            z: (r + 1) * zSpacing
          }
        })

        // Add chairs around each table (8 per table)
        const tableX = (c + 1) * xSpacing
        const tableZ = (r + 1) * zSpacing
        for (let chair = 0; chair < 8; chair++) {
          const angle = (chair / 8) * Math.PI * 2
          items.push({
            type: 'chair',
            position: {
              x: tableX + Math.cos(angle) * 1.2,
              z: tableZ + Math.sin(angle) * 1.2
            },
            rotation: angle + Math.PI // Face inward
          })
        }

        itemCount++
      }
    }

    // Add stage/mandap area at the front
    items.push({
      type: 'stage',
      position: {
        x: venue.width / 2,
        z: venue.length * 0.1
      }
    })

    return { items }
  }

  // Theater style with rows of chairs
  private theaterLayout(
    venue: { width: number; length: number },
    tableCount: number
  ): { items: LayoutItem[] } {
    const items: LayoutItem[] = []
    const totalChairs = tableCount * 8

    const chairsPerRow = Math.floor(venue.width / 0.6) // 60cm per chair
    const rows = Math.ceil(totalChairs / chairsPerRow)

    let chairCount = 0
    for (let r = 0; r < rows && chairCount < totalChairs; r++) {
      for (let c = 0; c < chairsPerRow && chairCount < totalChairs; c++) {
        items.push({
          type: 'chair',
          position: {
            x: 0.6 + c * 0.6,
            z: venue.length * 0.3 + r * 0.8
          },
          rotation: 0 // All facing forward
        })
        chairCount++
      }
    }

    // Add stage
    items.push({
      type: 'stage',
      position: {
        x: venue.width / 2,
        z: venue.length * 0.1
      }
    })

    return { items }
  }

  // Cocktail style with high tables scattered
  private cocktailLayout(
    venue: { width: number; length: number },
    tableCount: number
  ): { items: LayoutItem[] } {
    const items: LayoutItem[] = []

    // Fewer tables for cocktail style, more spread out
    const cocktailTables = Math.ceil(tableCount * 0.6)

    for (let i = 0; i < cocktailTables; i++) {
      // Random-ish placement with some structure
      const angle = (i / cocktailTables) * Math.PI * 2
      const radius = Math.min(venue.width, venue.length) * 0.35

      items.push({
        type: 'cocktail-table',
        position: {
          x: venue.width / 2 + Math.cos(angle) * radius * (0.7 + Math.random() * 0.3),
          z: venue.length / 2 + Math.sin(angle) * radius * (0.7 + Math.random() * 0.3)
        }
      })
    }

    // Add bar area
    items.push({
      type: 'bar',
      position: {
        x: venue.width * 0.85,
        z: venue.length * 0.5
      }
    })

    return { items }
  }

  // Classroom style with rectangular tables
  private classroomLayout(
    venue: { width: number; length: number },
    tableCount: number
  ): { items: LayoutItem[] } {
    const items: LayoutItem[] = []

    const tablesPerRow = Math.floor(venue.width / 2.5) // 2.5m per table
    const rows = Math.ceil(tableCount / tablesPerRow)

    let count = 0
    for (let r = 0; r < rows && count < tableCount; r++) {
      for (let c = 0; c < tablesPerRow && count < tableCount; c++) {
        items.push({
          type: 'rectangular-table',
          position: {
            x: 1.5 + c * 2.5,
            z: venue.length * 0.3 + r * 2
          }
        })

        // Add 2 chairs per side
        const tableX = 1.5 + c * 2.5
        const tableZ = venue.length * 0.3 + r * 2

        for (let side = 0; side < 2; side++) {
          for (let seat = 0; seat < 2; seat++) {
            items.push({
              type: 'chair',
              position: {
                x: tableX - 0.5 + seat * 1,
                z: tableZ + (side === 0 ? -0.6 : 0.6)
              },
              rotation: side === 0 ? 0 : Math.PI
            })
          }
        }

        count++
      }
    }

    return { items }
  }

  // U-shape layout for smaller gatherings
  private uShapeLayout(
    venue: { width: number; length: number },
    tableCount: number
  ): { items: LayoutItem[] } {
    const items: LayoutItem[] = []

    // Distribute tables in U shape
    const bottomTables = Math.ceil(tableCount * 0.4)
    const sideTables = Math.floor((tableCount - bottomTables) / 2)

    // Bottom of U
    for (let i = 0; i < bottomTables; i++) {
      items.push({
        type: 'rectangular-table',
        position: {
          x: venue.width * 0.2 + (i / bottomTables) * venue.width * 0.6,
          z: venue.length * 0.7
        }
      })
    }

    // Left side
    for (let i = 0; i < sideTables; i++) {
      items.push({
        type: 'rectangular-table',
        position: {
          x: venue.width * 0.15,
          z: venue.length * 0.3 + (i / sideTables) * venue.length * 0.35
        },
        rotation: Math.PI / 2
      })
    }

    // Right side
    for (let i = 0; i < sideTables; i++) {
      items.push({
        type: 'rectangular-table',
        position: {
          x: venue.width * 0.85,
          z: venue.length * 0.3 + (i / sideTables) * venue.length * 0.35
        },
        rotation: Math.PI / 2
      })
    }

    return { items }
  }
}

// Export singleton instance
export const aiService = new AIService()

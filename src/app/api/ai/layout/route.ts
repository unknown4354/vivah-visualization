import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { aiService } from '@/lib/services/ai-service'
import { LayoutSuggestionSchema } from '@/lib/validators/ai'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = LayoutSuggestionSchema.parse(body)

    // Generate layout suggestion
    const layout = await aiService.generateLayoutSuggestion({
      venueSize: validatedData.venueSize,
      guestCount: validatedData.guestCount,
      style: validatedData.style
    })

    // Calculate statistics
    const tableCount = layout.items.filter(item =>
      item.type.includes('table')
    ).length
    const chairCount = layout.items.filter(item =>
      item.type === 'chair'
    ).length

    // Log activity if associated with a project
    if (validatedData.projectId) {
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          projectId: validatedData.projectId,
          action: 'ai.layout_generated',
          metadata: {
            style: validatedData.style,
            guestCount: validatedData.guestCount,
            tableCount,
            chairCount
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      layout,
      statistics: {
        totalItems: layout.items.length,
        tables: tableCount,
        chairs: chairCount,
        guestsPerTable: Math.ceil(validatedData.guestCount / tableCount),
        venueUtilization: calculateUtilization(
          validatedData.venueSize,
          layout.items.length
        )
      },
      recommendations: generateRecommendations(
        validatedData.style,
        validatedData.guestCount,
        validatedData.venueSize
      )
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Layout suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate layout suggestion' },
      { status: 500 }
    )
  }
}

// Calculate venue space utilization percentage
function calculateUtilization(
  venueSize: { width: number; length: number },
  itemCount: number
): number {
  const totalArea = venueSize.width * venueSize.length
  // Assume average item footprint of 2 sq meters
  const usedArea = itemCount * 2
  return Math.min(100, Math.round((usedArea / totalArea) * 100))
}

// Generate helpful recommendations based on parameters
function generateRecommendations(
  style: string,
  guestCount: number,
  venueSize: { width: number; length: number }
): string[] {
  const recommendations: string[] = []
  const area = venueSize.width * venueSize.length
  const sqFtPerGuest = area / guestCount

  // Space recommendations
  if (sqFtPerGuest < 10) {
    recommendations.push('Consider reducing guest count or choosing a larger venue. Recommended: 10-15 sq ft per guest.')
  } else if (sqFtPerGuest > 20) {
    recommendations.push('Venue has ample space. Consider adding lounge areas or a dance floor.')
  }

  // Style-specific recommendations
  switch (style) {
    case 'banquet':
      recommendations.push('Round tables work best for conversation and networking.')
      if (guestCount > 100) {
        recommendations.push('Consider a raised head table for the couple to be visible.')
      }
      break
    case 'theater':
      recommendations.push('Ensure center aisle is at least 4 feet wide.')
      recommendations.push('Consider adding a few chairs at the back for late arrivals.')
      break
    case 'cocktail':
      recommendations.push('Plan for 60% seated capacity - guests will mingle.')
      recommendations.push('Position bar away from entrance to prevent congestion.')
      break
    case 'classroom':
      recommendations.push('Best for conferences or working sessions.')
      recommendations.push('Ensure good sightlines to presentation area.')
      break
    case 'u-shape':
      recommendations.push('Great for intimate gatherings under 50 guests.')
      recommendations.push('Center area can be used for entertainment.')
      break
  }

  // General recommendations
  recommendations.push('Leave 3-4 feet walkways between table groups.')
  recommendations.push('Position stage/mandap for best visibility from all seats.')

  return recommendations
}

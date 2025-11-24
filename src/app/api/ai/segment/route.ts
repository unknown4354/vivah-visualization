import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sdxlInpaintService } from '@/lib/services/sdxl-inpaint-service'
import { z } from 'zod'

const SegmentSchema = z.object({
  imageUrl: z.string().url(),
  points: z.array(z.object({
    x: z.number(),
    y: z.number()
  })).optional(),
  labels: z.array(z.number()).optional(),
  box: z.object({
    x1: z.number(),
    y1: z.number(),
    x2: z.number(),
    y2: z.number()
  }).optional(),
  autoSegment: z.boolean().optional()
})

// POST /api/ai/segment - Generate mask using SAM2
// Note: SAM2 segmentation is optional and may have availability issues
// Consider using manual mask drawing as primary method
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = SegmentSchema.parse(body)

    // For now, return an error suggesting manual mask creation
    // SAM2 models on Replicate have availability issues
    return NextResponse.json({
      error: 'Auto-segmentation temporarily unavailable. Please use manual mask drawing.',
      suggestion: 'Use the brush tool to paint over areas you want to edit'
    }, { status: 503 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Segment error:', error)
    return NextResponse.json(
      { error: 'Segmentation failed' },
      { status: 500 }
    )
  }
}

import { z } from 'zod'

export const MoodBoardSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(500, 'Prompt too long'),
  style: z.enum(['modern', 'traditional', 'rustic', 'bohemian', 'luxury', 'royal']).optional().default('modern'),
  count: z.number().min(1).max(8).optional().default(4),
  projectId: z.string().cuid().optional()
})

export const LayoutSuggestionSchema = z.object({
  venueSize: z.object({
    width: z.number().positive('Width must be positive'),
    length: z.number().positive('Length must be positive')
  }),
  guestCount: z.number().int().min(1, 'Guest count must be at least 1').max(5000, 'Guest count too large'),
  style: z.enum(['banquet', 'theater', 'cocktail', 'classroom', 'u-shape']).default('banquet'),
  projectId: z.string().cuid().optional()
})

export const ColorPaletteSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  projectId: z.string().cuid().optional()
})

export type MoodBoardInput = z.infer<typeof MoodBoardSchema>
export type LayoutSuggestionInput = z.infer<typeof LayoutSuggestionSchema>
export type ColorPaletteInput = z.infer<typeof ColorPaletteSchema>

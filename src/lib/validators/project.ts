import { z } from 'zod'

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  venueId: z.string().optional(),
  eventDate: z.string().datetime().optional(),
  guestCount: z.number().int().positive().optional(),
  budget: z.number().positive().optional(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']).optional(),
  sceneData: z.record(z.string(), z.unknown()).optional(),
  thumbnail: z.string().url().optional(),
})

export const ProjectItemSchema = z.object({
  furnitureItemId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  scale: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  materialOverride: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const ShareLinkSchema = z.object({
  canEdit: z.boolean().default(false),
  canComment: z.boolean().default(true),
  canExport: z.boolean().default(false),
  password: z.string().optional(),
  expiresIn: z.number().int().positive().optional(), // hours
  maxViews: z.number().int().positive().optional(),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>
export type ProjectItemInput = z.infer<typeof ProjectItemSchema>
export type ShareLinkInput = z.infer<typeof ShareLinkSchema>

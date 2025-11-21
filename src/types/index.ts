import { User, Project, Venue, FurnitureItem, ProjectItem } from '@prisma/client'

// Extended types with relations
export type UserWithSubscription = User & {
  subscription: {
    tier: string
    credits: number
  } | null
}

export type ProjectWithRelations = Project & {
  venue: Venue | null
  items: (ProjectItem & {
    furnitureItem: FurnitureItem
  })[]
  _count?: {
    items: number
  }
}

// Canvas types
export interface CanvasItem {
  id: string
  furnitureItemId: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  selected: boolean
  locked: boolean
  visible: boolean
  materialOverride?: Record<string, unknown>
}

export interface SceneData {
  version: string
  camera: {
    position: [number, number, number]
    target: [number, number, number]
  }
  environment: {
    preset: string
    background: string
  }
  grid: {
    size: number
    divisions: number
  }
  items: CanvasItem[]
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// Auth types
export interface SessionUser {
  id: string
  email: string
  name?: string
  role: string
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser
  }

  interface User {
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}

# Wedding Visualization Platform - Claude Code Implementation Guide

## Overview for Claude Code
This guide provides exact implementation instructions for building a wedding stage visualization platform. Follow each section sequentially, implementing the code patterns and structures as specified.

---

## Project Architecture

```
src/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Auth group routes
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── edit/
│   │   │   │   ├── 3d/
│   │   │   │   └── share/
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── venues/
│   │   ├── ai/
│   │   ├── export/
│   │   └── webhooks/
│   └── shared/[token]/           # Public share links
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── canvas/                   # 3D/2D canvas components
│   ├── editor/                   # Editor UI components
│   ├── furniture/                # Furniture library
│   └── layouts/                  # Layout components
├── lib/
│   ├── actions/                  # Server actions
│   ├── hooks/                    # React hooks
│   ├── utils/                    # Utilities
│   ├── services/                 # Service layer
│   ├── validators/               # Zod schemas
│   └── three/                    # Three.js utilities
├── stores/                       # Zustand stores
├── types/                        # TypeScript types
└── assets/                       # Static assets
    ├── models/                   # 3D models
    └── textures/                 # Textures
```

---

## Phase 1: Core Infrastructure

### 1.1 Database Schema Implementation

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum UserRole {
  ADMIN
  PLANNER
  CLIENT
  VIEWER
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  REVIEW
  COMPLETED
  ARCHIVED
}

enum ItemCategory {
  TABLE
  CHAIR
  DECORATION
  LIGHTING
  STRUCTURE
  FLORAL
  MISC
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  name              String?
  passwordHash      String?
  role              UserRole  @default(PLANNER)
  image             String?
  
  // Relations
  projects          Project[]
  aiGenerations     AIGeneration[]
  activities        Activity[]
  subscription      Subscription?
  
  // Metadata
  settings          Json      @default("{}")
  onboardingComplete Boolean  @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([email])
}

model Project {
  id                String        @id @default(cuid())
  name              String
  description       String?
  userId            String
  venueId           String?
  
  // Event details
  eventDate         DateTime?
  guestCount        Int?
  budget            Float?
  
  // Scene data
  sceneData         Json          @default("{}")
  floorPlanUrl      String?
  thumbnail         String?
  
  // Status
  status            ProjectStatus @default(DRAFT)
  isTemplate        Boolean       @default(false)
  
  // Relations
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  venue             Venue?        @relation(fields: [venueId], references: [id])
  items             ProjectItem[]
  shareLinks        ShareLink[]
  exports           Export[]
  aiGenerations     AIGeneration[]
  activities        Activity[]
  snapshots         Snapshot[]
  
  // Timestamps
  lastAccessedAt    DateTime      @default(now())
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([userId, status])
  @@index([venueId])
}

model Venue {
  id                String    @id @default(cuid())
  name              String
  slug              String    @unique
  
  // Location
  address           String
  city              String
  state             String?
  country           String    @default("India")
  coordinates       Json?     // {lat, lng}
  
  // Specifications
  capacity          Int
  area              Float?    // Square feet
  dimensions        Json      // {length, width, height}
  features          String[]  // ["parking", "ac", "outdoor", etc.]
  
  // Media
  images            String[]
  floorPlanUrl      String?
  model3DUrl        String?  // Gaussian splat or photogrammetry
  
  // Relations
  projects          Project[]
  
  // Metadata
  metadata          Json      @default("{}")
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([slug])
  @@index([city])
}

model FurnitureItem {
  id                String        @id @default(cuid())
  name              String
  slug              String        @unique
  category          ItemCategory
  subcategory       String?
  
  // 3D Model data
  modelUrl          String        // GLB file URL
  thumbnailUrl      String
  iconUrl           String?
  
  // Specifications
  dimensions        Json          // {width, depth, height}
  defaultScale      Float         @default(1.0)
  polyCount         Int
  fileSize          Int          // bytes
  
  // Variations
  materials         Json[]        // Available materials/colors
  variations        Json?         // Size variations, etc.
  
  // Metadata
  tags              String[]
  isActive          Boolean       @default(true)
  isPremium         Boolean       @default(false)
  
  // Relations
  projectItems      ProjectItem[]
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([category])
  @@index([slug])
  @@index([tags])
}

model ProjectItem {
  id                String        @id @default(cuid())
  projectId         String
  furnitureItemId   String
  
  // Transform data
  position          Json          // {x, y, z}
  rotation          Json          // {x, y, z}
  scale             Json          // {x, y, z}
  
  // Customization
  materialOverride  Json?         // Custom color/texture
  metadata          Json?         // Additional properties
  
  // Relations
  project           Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  furnitureItem     FurnitureItem @relation(fields: [furnitureItemId], references: [id])
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([projectId])
  @@unique([projectId, id])
}

model ShareLink {
  id                String    @id @default(cuid())
  projectId         String
  token             String    @unique @default(cuid())
  
  // Permissions
  canEdit           Boolean   @default(false)
  canComment        Boolean   @default(true)
  canExport         Boolean   @default(false)
  
  // Security
  password          String?
  expiresAt         DateTime?
  maxViews          Int?
  currentViews      Int       @default(0)
  
  // Relations
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Metadata
  lastViewedAt      DateTime?
  createdAt         DateTime  @default(now())
  
  @@index([token])
  @@index([projectId])
}

model Snapshot {
  id                String    @id @default(cuid())
  projectId         String
  name              String
  description       String?
  
  // Snapshot data
  sceneData         Json
  thumbnail         String?
  
  // Relations
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime  @default(now())
  
  @@index([projectId])
}

model AIGeneration {
  id                String    @id @default(cuid())
  userId            String
  projectId         String?
  
  // Generation details
  type              String    // "mood_board", "layout", "style"
  prompt            String    @db.Text
  model             String    // "flux", "stable-diffusion", etc.
  
  // Results
  resultUrl         String
  metadata          Json?     // Model parameters, seed, etc.
  
  // Cost tracking
  credits           Int       @default(1)
  processingTime    Int?      // milliseconds
  
  // Relations
  user              User      @relation(fields: [userId], references: [id])
  project           Project?  @relation(fields: [projectId], references: [id], onDelete: SetNull)
  
  createdAt         DateTime  @default(now())
  
  @@index([userId])
  @@index([projectId])
}

model Export {
  id                String    @id @default(cuid())
  projectId         String
  
  // Export details
  format            String    // "pdf", "png", "jpg", "glb"
  url               String
  
  // Specifications
  resolution        String?   // "1920x1080", "4K", etc.
  settings          Json?     // Export-specific settings
  
  // Relations
  project           Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime  @default(now())
  expiresAt         DateTime? // For temporary exports
  
  @@index([projectId])
}

model Activity {
  id                String    @id @default(cuid())
  userId            String
  projectId         String?
  
  // Activity details
  action            String    // "project.created", "item.added", etc.
  metadata          Json?     // Additional context
  
  // Relations
  user              User      @relation(fields: [userId], references: [id])
  project           Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime  @default(now())
  
  @@index([userId])
  @@index([projectId])
}

model Subscription {
  id                String    @id @default(cuid())
  userId            String    @unique
  
  // Stripe data
  stripeCustomerId  String?   @unique
  stripePriceId     String?
  stripeStatus      String?
  
  // Subscription details
  tier              String    @default("free")
  credits           Int       @default(5)
  
  // Billing
  currentPeriodEnd  DateTime?
  cancelAtPeriodEnd Boolean   @default(false)
  
  // Relations
  user              User      @relation(fields: [userId], references: [id])
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([stripeCustomerId])
}
```

### 1.2 Authentication Implementation

```typescript
// lib/auth/config.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          throw new Error('User not found')
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  }
}

// lib/auth/actions.ts
'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { RegisterSchema, LoginSchema } from '@/lib/validators/auth'
import { signIn } from 'next-auth/react'

export async function register(values: z.infer<typeof RegisterSchema>) {
  const validatedFields = RegisterSchema.safeParse(values)
  
  if (!validatedFields.success) {
    return { error: 'Invalid fields' }
  }

  const { email, password, name } = validatedFields.data
  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return { error: 'Email already in use' }
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        subscription: {
          create: {
            tier: 'free',
            credits: 5
          }
        }
      }
    })

    // Auto sign in after registration
    await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    return { success: true, userId: user.id }
  } catch (error) {
    return { error: 'Failed to create account' }
  }
}
```

### 1.3 API Route Structure

```typescript
// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { CreateProjectSchema } from '@/lib/validators/project'
import { z } from 'zod'

// GET /api/projects - List user's projects
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as ProjectStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = {
      userId: session.user.id,
      ...(status && { status })
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          venue: true,
          _count: {
            select: { items: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.project.count({ where })
    ])

    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = CreateProjectSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        sceneData: {
          version: '1.0',
          camera: {
            position: [10, 10, 10],
            target: [0, 0, 0]
          },
          environment: {
            preset: 'studio',
            background: '#f0f0f0'
          },
          grid: {
            size: 20,
            divisions: 20
          }
        }
      },
      include: {
        venue: true
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        projectId: project.id,
        action: 'project.created',
        metadata: { projectName: project.name }
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

// app/api/projects/[id]/route.ts
interface RouteParams {
  params: { id: string }
}

// GET /api/projects/[id] - Get single project
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        venue: true,
        items: {
          include: {
            furnitureItem: true
          }
        },
        shareLinks: {
          where: {
            expiresAt: {
              gte: new Date()
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Update last accessed
    await prisma.project.update({
      where: { id: params.id },
      data: { lastAccessedAt: new Date() }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: body,
      include: {
        venue: true,
        items: {
          include: {
            furnitureItem: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Delete associated files from storage
    // TODO: Implement S3/R2 cleanup

    await prisma.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
```

---

## Phase 2: 2D/3D Canvas Implementation

### 2.1 Canvas Store (Zustand)

```typescript
// stores/canvas-store.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

interface CanvasItem {
  id: string
  furnitureItemId: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  selected: boolean
  locked: boolean
  visible: boolean
  materialOverride?: any
}

interface CanvasState {
  // View state
  viewMode: '2D' | '3D'
  cameraPosition: THREE.Vector3
  cameraTarget: THREE.Vector3
  zoom: number
  
  // Selection
  selectedItems: string[]
  hoveredItem: string | null
  
  // Items
  items: Map<string, CanvasItem>
  
  // Tools
  activeTool: 'select' | 'move' | 'rotate' | 'scale' | 'delete'
  snapToGrid: boolean
  gridSize: number
  
  // History
  history: any[]
  historyIndex: number
  
  // Actions
  setViewMode: (mode: '2D' | '3D') => void
  addItem: (item: CanvasItem) => void
  updateItem: (id: string, updates: Partial<CanvasItem>) => void
  removeItem: (id: string) => void
  selectItem: (id: string, multi?: boolean) => void
  clearSelection: () => void
  
  // Transforms
  moveSelected: (delta: THREE.Vector3) => void
  rotateSelected: (delta: THREE.Euler) => void
  scaleSelected: (delta: THREE.Vector3) => void
  
  // History
  undo: () => void
  redo: () => void
  saveSnapshot: () => void
  
  // Utils
  exportScene: () => any
  importScene: (data: any) => void
}

export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    viewMode: '2D',
    cameraPosition: new THREE.Vector3(10, 10, 10),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    zoom: 1,
    
    selectedItems: [],
    hoveredItem: null,
    
    items: new Map(),
    
    activeTool: 'select',
    snapToGrid: true,
    gridSize: 0.5,
    
    history: [],
    historyIndex: -1,
    
    // Actions
    setViewMode: (mode) => set({ viewMode: mode }),
    
    addItem: (item) => set((state) => {
      const newItems = new Map(state.items)
      newItems.set(item.id, item)
      
      // Save to history
      const newState = { ...state, items: newItems }
      const newHistory = state.history.slice(0, state.historyIndex + 1)
      newHistory.push(newState)
      
      return {
        items: newItems,
        history: newHistory,
        historyIndex: newHistory.length - 1
      }
    }),
    
    updateItem: (id, updates) => set((state) => {
      const newItems = new Map(state.items)
      const item = newItems.get(id)
      if (item) {
        newItems.set(id, { ...item, ...updates })
      }
      return { items: newItems }
    }),
    
    removeItem: (id) => set((state) => {
      const newItems = new Map(state.items)
      newItems.delete(id)
      return {
        items: newItems,
        selectedItems: state.selectedItems.filter(i => i !== id)
      }
    }),
    
    selectItem: (id, multi = false) => set((state) => {
      if (multi) {
        const isSelected = state.selectedItems.includes(id)
        return {
          selectedItems: isSelected
            ? state.selectedItems.filter(i => i !== id)
            : [...state.selectedItems, id]
        }
      }
      return { selectedItems: [id] }
    }),
    
    clearSelection: () => set({ selectedItems: [] }),
    
    moveSelected: (delta) => set((state) => {
      const newItems = new Map(state.items)
      state.selectedItems.forEach(id => {
        const item = newItems.get(id)
        if (item && !item.locked) {
          const newPos = item.position.clone().add(delta)
          
          // Snap to grid if enabled
          if (state.snapToGrid) {
            newPos.x = Math.round(newPos.x / state.gridSize) * state.gridSize
            newPos.z = Math.round(newPos.z / state.gridSize) * state.gridSize
          }
          
          newItems.set(id, { ...item, position: newPos })
        }
      })
      return { items: newItems }
    }),
    
    rotateSelected: (delta) => set((state) => {
      const newItems = new Map(state.items)
      state.selectedItems.forEach(id => {
        const item = newItems.get(id)
        if (item && !item.locked) {
          const newRot = new THREE.Euler(
            item.rotation.x + delta.x,
            item.rotation.y + delta.y,
            item.rotation.z + delta.z
          )
          newItems.set(id, { ...item, rotation: newRot })
        }
      })
      return { items: newItems }
    }),
    
    scaleSelected: (delta) => set((state) => {
      const newItems = new Map(state.items)
      state.selectedItems.forEach(id => {
        const item = newItems.get(id)
        if (item && !item.locked) {
          const newScale = item.scale.clone().add(delta)
          newScale.x = Math.max(0.1, newScale.x)
          newScale.y = Math.max(0.1, newScale.y)
          newScale.z = Math.max(0.1, newScale.z)
          newItems.set(id, { ...item, scale: newScale })
        }
      })
      return { items: newItems }
    }),
    
    undo: () => set((state) => {
      if (state.historyIndex > 0) {
        const previousState = state.history[state.historyIndex - 1]
        return {
          ...previousState,
          historyIndex: state.historyIndex - 1
        }
      }
      return state
    }),
    
    redo: () => set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1]
        return {
          ...nextState,
          historyIndex: state.historyIndex + 1
        }
      }
      return state
    }),
    
    saveSnapshot: () => set((state) => {
      const snapshot = {
        items: Array.from(state.items.entries()),
        cameraPosition: state.cameraPosition.toArray(),
        cameraTarget: state.cameraTarget.toArray(),
        zoom: state.zoom
      }
      return { history: [...state.history, snapshot] }
    }),
    
    exportScene: () => {
      const state = get()
      return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        viewMode: state.viewMode,
        camera: {
          position: state.cameraPosition.toArray(),
          target: state.cameraTarget.toArray(),
          zoom: state.zoom
        },
        items: Array.from(state.items.values()).map(item => ({
          ...item,
          position: item.position.toArray(),
          rotation: item.rotation.toArray(),
          scale: item.scale.toArray()
        }))
      }
    },
    
    importScene: (data) => set(() => {
      const items = new Map()
      data.items.forEach((item: any) => {
        items.set(item.id, {
          ...item,
          position: new THREE.Vector3(...item.position),
          rotation: new THREE.Euler(...item.rotation),
          scale: new THREE.Vector3(...item.scale)
        })
      })
      
      return {
        items,
        viewMode: data.viewMode,
        cameraPosition: new THREE.Vector3(...data.camera.position),
        cameraTarget: new THREE.Vector3(...data.camera.target),
        zoom: data.camera.zoom
      }
    })
  }))
)
```

### 2.2 3D Scene Component

```typescript
// components/canvas/ThreeScene.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { 
  OrbitControls, 
  Grid, 
  Environment, 
  TransformControls,
  GizmoHelper,
  GizmoViewport,
  Stats,
  Select,
  Bounds
} from '@react-three/drei'
import { Suspense, useRef, useEffect } from 'react'
import { useCanvasStore } from '@/stores/canvas-store'
import { FurnitureModel } from './FurnitureModel'
import { Perf } from 'r3f-perf'

export function ThreeScene() {
  const { 
    items, 
    selectedItems, 
    activeTool,
    cameraPosition,
    moveSelected,
    rotateSelected,
    scaleSelected
  } = useCanvasStore()
  
  const transformRef = useRef<any>()
  
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ 
          position: cameraPosition.toArray(),
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.8
        }}
      >
        {/* Performance monitoring in dev */}
        {process.env.NODE_ENV === 'development' && <Perf position="top-left" />}
        
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          {/* Environment */}
          <Environment preset="apartment" background blur={0.5} />
          
          {/* Grid */}
          <Grid
            args={[30, 30]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#374151"
            fadeDistance={50}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />
          
          {/* Camera Controls */}
          <OrbitControls
            makeDefault
            minDistance={2}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2}
            enableDamping
            dampingFactor={0.05}
          />
          
          {/* Gizmo */}
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport />
          </GizmoHelper>
          
          {/* Furniture Items */}
          <Select multiple box onChange={console.log}>
            <Bounds fit clip observe damping={6} margin={1.2}>
              {Array.from(items.values()).map(item => (
                <FurnitureModel
                  key={item.id}
                  {...item}
                  selected={selectedItems.includes(item.id)}
                />
              ))}
            </Bounds>
          </Select>
          
          {/* Transform Controls for selected items */}
          {selectedItems.length === 1 && (
            <TransformControls
              ref={transformRef}
              mode={activeTool === 'move' ? 'translate' : 
                    activeTool === 'rotate' ? 'rotate' : 
                    activeTool === 'scale' ? 'scale' : 'translate'}
              object={selectedItems[0]}
              onObjectChange={(e) => {
                // Handle transform updates
                console.log('Transform change', e)
              }}
            />
          )}
        </Suspense>
        
        <Stats showPanel={0} />
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 z-10">
        <ViewModeToggle />
      </div>
      
      <div className="absolute bottom-4 right-4 z-10">
        <CameraControls />
      </div>
    </div>
  )
}

// components/canvas/FurnitureModel.tsx
import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface FurnitureModelProps {
  id: string
  furnitureItemId: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  selected: boolean
  onSelect?: () => void
}

export function FurnitureModel({ 
  id, 
  furnitureItemId, 
  position, 
  rotation, 
  scale, 
  selected,
  onSelect 
}: FurnitureModelProps) {
  const meshRef = useRef<THREE.Mesh>()
  const { scene } = useGLTF(`/models/${furnitureItemId}.glb`)
  
  // Clone scene to avoid sharing materials
  const clonedScene = scene.clone()
  
  useEffect(() => {
    if (meshRef.current) {
      // Apply selection highlight
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (selected) {
            child.material = new THREE.MeshStandardMaterial({
              ...child.material,
              emissive: new THREE.Color(0xffff00),
              emissiveIntensity: 0.2
            })
          }
        }
      })
    }
  }, [selected])
  
  return (
    <group
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onSelect}
      castShadow
      receiveShadow
    >
      <primitive object={clonedScene} />
      
      {/* Selection indicator */}
      {selected && (
        <mesh>
          <boxGeometry args={[1, 0.01, 1]} />
          <meshBasicMaterial color="yellow" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

// Preload models
useGLTF.preload('/models/chair.glb')
useGLTF.preload('/models/table.glb')
```

### 2.3 2D Canvas Implementation

```typescript
// components/canvas/Canvas2D.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { useCanvasStore } from '@/stores/canvas-store'

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const { items, selectedItems, addItem, updateItem, selectItem } = useCanvasStore()
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Initialize Fabric canvas
    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: '#f5f5f5',
      selection: true,
      preserveObjectStacking: true
    })
    
    const canvas = fabricRef.current
    
    // Add grid
    const gridSize = 20
    for (let i = 0; i < (canvas.width! / gridSize); i++) {
      canvas.add(new fabric.Line(
        [i * gridSize, 0, i * gridSize, canvas.height!],
        { stroke: '#e0e0e0', selectable: false, evented: false }
      ))
    }
    for (let i = 0; i < (canvas.height! / gridSize); i++) {
      canvas.add(new fabric.Line(
        [0, i * gridSize, canvas.width!, i * gridSize],
        { stroke: '#e0e0e0', selectable: false, evented: false }
      ))
    }
    
    // Event handlers
    canvas.on('selection:created', (e) => {
      const selected = e.selected?.map(obj => obj.data?.id).filter(Boolean) || []
      selected.forEach(id => selectItem(id, true))
    })
    
    canvas.on('object:modified', (e) => {
      const obj = e.target
      if (obj && obj.data?.id) {
        updateItem(obj.data.id, {
          position: new THREE.Vector3(obj.left!, 0, obj.top!),
          rotation: new THREE.Euler(0, obj.angle! * Math.PI / 180, 0),
          scale: new THREE.Vector3(obj.scaleX!, 1, obj.scaleY!)
        })
      }
    })
    
    return () => {
      canvas.dispose()
    }
  }, [])
  
  // Sync items to canvas
  useEffect(() => {
    if (!fabricRef.current) return
    const canvas = fabricRef.current
    
    // Clear existing objects (except grid)
    canvas.getObjects().forEach(obj => {
      if (obj.data?.id) {
        canvas.remove(obj)
      }
    })
    
    // Add items
    items.forEach(item => {
      // Load furniture icon/shape
      fabric.Image.fromURL(`/icons/${item.furnitureItemId}.png`, (img) => {
        img.set({
          left: item.position.x,
          top: item.position.z,
          angle: item.rotation.y * 180 / Math.PI,
          scaleX: item.scale.x,
          scaleY: item.scale.z,
          data: { id: item.id }
        })
        canvas.add(img)
      })
    })
  }, [items])
  
  return (
    <div className="relative w-full h-full overflow-auto">
      <canvas ref={canvasRef} />
      
      {/* 2D Toolbar */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2">
        <Canvas2DToolbar />
      </div>
    </div>
  )
}

// components/canvas/Canvas2DToolbar.tsx
export function Canvas2DToolbar() {
  const { activeTool, setActiveTool, snapToGrid, setSnapToGrid } = useCanvasStore()
  
  const tools = [
    { id: 'select', icon: 'cursor', label: 'Select' },
    { id: 'move', icon: 'move', label: 'Move' },
    { id: 'rotate', icon: 'rotate', label: 'Rotate' },
    { id: 'scale', icon: 'resize', label: 'Scale' },
    { id: 'delete', icon: 'trash', label: 'Delete' }
  ]
  
  return (
    <div className="flex gap-1">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id as any)}
          className={cn(
            "p-2 rounded hover:bg-gray-100",
            activeTool === tool.id && "bg-blue-100"
          )}
          title={tool.label}
        >
          <Icon name={tool.icon} className="w-5 h-5" />
        </button>
      ))}
      
      <div className="border-l mx-2" />
      
      <button
        onClick={() => setSnapToGrid(!snapToGrid)}
        className={cn(
          "p-2 rounded hover:bg-gray-100",
          snapToGrid && "bg-blue-100"
        )}
        title="Snap to Grid"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
    </div>
  )
}
```

---

## Phase 3: AI Integration

### 3.1 AI Service Layer

```typescript
// lib/services/ai-service.ts
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!
})

export class AIService {
  // Generate mood board images
  async generateMoodBoard(params: {
    prompt: string
    style?: string
    count?: number
  }): Promise<string[]> {
    const { prompt, style = 'modern', count = 4 } = params
    
    const stylePrompts = {
      modern: 'modern minimalist wedding',
      traditional: 'traditional ornate wedding',
      rustic: 'rustic barn wedding',
      bohemian: 'bohemian outdoor wedding',
      luxury: 'luxury elegant wedding'
    }
    
    const fullPrompt = `${prompt}, ${stylePrompts[style]}, professional photography, high quality, 8k`
    
    const results: string[] = []
    
    for (let i = 0; i < count; i++) {
      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: fullPrompt,
            aspect_ratio: "16:9",
            output_format: "webp",
            output_quality: 80,
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      )
      
      results.push(output as string)
    }
    
    return results
  }
  
  // Generate layout suggestions
  async generateLayoutSuggestion(params: {
    venueSize: { width: number, length: number }
    guestCount: number
    style: string
  }): Promise<any> {
    const { venueSize, guestCount, style } = params
    
    // Calculate optimal table arrangement
    const tablesNeeded = Math.ceil(guestCount / 8)
    const layout = this.calculateOptimalLayout(venueSize, tablesNeeded, style)
    
    return layout
  }
  
  // Face swap for personalization
  async personalizeImage(params: {
    sourceImage: string
    targetImage: string
    faceIndex?: number
  }): Promise<string> {
    const output = await replicate.run(
      "lucataco/faceswap",
      {
        input: {
          source_image: params.sourceImage,
          target_image: params.targetImage,
          face_index: params.faceIndex || 0
        }
      }
    )
    
    return output as string
  }
  
  // Generate style transfer
  async applyStyleTransfer(params: {
    contentImage: string
    styleReference: string
    strength?: number
  }): Promise<string> {
    const output = await replicate.run(
      "stability-ai/stable-diffusion-img2img",
      {
        input: {
          image: params.contentImage,
          prompt: "wedding venue decoration",
          strength: params.strength || 0.7
        }
      }
    )
    
    return output as string
  }
  
  // Color palette extraction
  async extractColorPalette(imageUrl: string): Promise<string[]> {
    // Use a color extraction library or API
    // Return hex color codes
    return ['#FFD700', '#800020', '#FFFFFF', '#F0E68C']
  }
  
  // Private helper methods
  private calculateOptimalLayout(
    venue: { width: number, length: number },
    tableCount: number,
    style: string
  ): any {
    // Layout algorithms for different styles
    const layouts = {
      banquet: this.banquetLayout,
      theater: this.theaterLayout,
      cocktail: this.cocktailLayout,
      classroom: this.classroomLayout
    }
    
    return layouts[style]?.(venue, tableCount) || this.defaultLayout(venue, tableCount)
  }
  
  private banquetLayout(venue: any, tables: number) {
    // Calculate grid arrangement
    const cols = Math.ceil(Math.sqrt(tables))
    const rows = Math.ceil(tables / cols)
    const spacing = 2 // meters
    
    const items = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (items.length >= tables) break
        items.push({
          type: 'table',
          position: {
            x: (c + 1) * (venue.width / (cols + 1)),
            z: (r + 1) * (venue.length / (rows + 1))
          }
        })
      }
    }
    
    return { items }
  }
  
  private defaultLayout(venue: any, tables: number) {
    // Simple grid layout
    return this.banquetLayout(venue, tables)
  }
}

// app/api/ai/mood-board/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { AIService } from '@/lib/services/ai-service'
import { uploadToStorage } from '@/lib/services/storage-service'

const aiService = new AIService()

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { prompt, style, projectId } = await req.json()
    
    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })
    
    if (!user?.subscription || user.subscription.credits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }
    
    // Generate images
    const imageUrls = await aiService.generateMoodBoard({
      prompt,
      style,
      count: 4
    })
    
    // Upload to storage
    const storedUrls = await Promise.all(
      imageUrls.map(url => uploadToStorage(url, `mood-boards/${projectId}`))
    )
    
    // Save to database
    const generation = await prisma.aIGeneration.create({
      data: {
        userId: session.user.id,
        projectId,
        type: 'mood_board',
        prompt,
        model: 'flux-schnell',
        resultUrl: storedUrls[0],
        metadata: {
          style,
          allImages: storedUrls
        },
        credits: 1
      }
    })
    
    // Deduct credits
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: { credits: { decrement: 1 } }
    })
    
    return NextResponse.json({
      images: storedUrls,
      generation
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    )
  }
}
```

---

## Phase 4: Export & Sharing

### 4.1 Export Service

```typescript
// lib/services/export-service.ts
import puppeteer from 'puppeteer'
import { PDFDocument, rgb } from 'pdf-lib'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter'

export class ExportService {
  // Export to PDF
  async exportToPDF(projectId: string): Promise<Buffer> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        venue: true,
        items: {
          include: { furnitureItem: true }
        }
      }
    })
    
    if (!project) throw new Error('Project not found')
    
    // Create PDF
    const pdfDoc = await PDFDocument.create()
    
    // Add cover page
    const coverPage = pdfDoc.addPage()
    coverPage.drawText(project.name, {
      x: 50,
      y: 750,
      size: 30,
      color: rgb(0, 0, 0)
    })
    
    // Add venue info
    if (project.venue) {
      coverPage.drawText(`Venue: ${project.venue.name}`, {
        x: 50,
        y: 700,
        size: 16
      })
      coverPage.drawText(`Date: ${project.eventDate?.toLocaleDateString() || 'TBD'}`, {
        x: 50,
        y: 670,
        size: 16
      })
    }
    
    // Add floor plan page
    const planPage = pdfDoc.addPage()
    // Render 2D floor plan to image and embed
    
    // Add 3D views page
    const viewsPage = pdfDoc.addPage()
    // Render multiple 3D angles
    
    // Add inventory list
    const inventoryPage = pdfDoc.addPage()
    let yPos = 750
    inventoryPage.drawText('Inventory List', {
      x: 50,
      y: yPos,
      size: 20
    })
    
    // Group items by category
    const itemsByCategory = new Map<string, any[]>()
    project.items.forEach(item => {
      const category = item.furnitureItem.category
      if (!itemsByCategory.has(category)) {
        itemsByCategory.set(category, [])
      }
      itemsByCategory.get(category)!.push(item)
    })
    
    yPos -= 30
    itemsByCategory.forEach((items, category) => {
      inventoryPage.drawText(`${category}: ${items.length} items`, {
        x: 50,
        y: yPos,
        size: 14
      })
      yPos -= 20
    })
    
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }
  
  // Export to image
  async exportToImage(
    projectId: string,
    options: {
      width?: number
      height?: number
      format?: 'png' | 'jpg' | 'webp'
      quality?: number
    } = {}
  ): Promise<Buffer> {
    const {
      width = 1920,
      height = 1080,
      format = 'png',
      quality = 90
    } = options
    
    // Launch headless browser
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width, height })
    
    // Navigate to project viewer
    await page.goto(
      `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/viewer`,
      { waitUntil: 'networkidle0' }
    )
    
    // Wait for 3D scene to load
    await page.waitForSelector('#three-canvas', { timeout: 10000 })
    await page.waitForTimeout(2000) // Let scene render
    
    // Take screenshot
    const screenshot = await page.screenshot({
      type: format as any,
      quality: format === 'jpg' ? quality : undefined,
      fullPage: false
    })
    
    await browser.close()
    
    return screenshot as Buffer
  }
  
  // Export to GLB
  async exportToGLB(sceneData: any): Promise<ArrayBuffer> {
    // Reconstruct Three.js scene
    const scene = new THREE.Scene()
    
    // Add items to scene
    sceneData.items.forEach((item: any) => {
      // Load model and add to scene
      // This would need actual model loading
    })
    
    // Export using GLTFExporter
    const exporter = new GLTFExporter()
    
    return new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (gltf) => {
          resolve(gltf as ArrayBuffer)
        },
        (error) => {
          reject(error)
        },
        { binary: true }
      )
    })
  }
  
  // Generate shareable link
  async createShareLink(
    projectId: string,
    options: {
      canEdit?: boolean
      canComment?: boolean
      canExport?: boolean
      password?: string
      expiresIn?: number // hours
    } = {}
  ): Promise<string> {
    const shareLink = await prisma.shareLink.create({
      data: {
        projectId,
        ...options,
        expiresAt: options.expiresIn
          ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
          : null
      }
    })
    
    return `${process.env.NEXT_PUBLIC_APP_URL}/shared/${shareLink.token}`
  }
}

// app/api/export/[format]/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { format: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { projectId, options } = await req.json()
    const exportService = new ExportService()
    
    let result: Buffer | ArrayBuffer
    let contentType: string
    let filename: string
    
    switch (params.format) {
      case 'pdf':
        result = await exportService.exportToPDF(projectId)
        contentType = 'application/pdf'
        filename = 'project-export.pdf'
        break
        
      case 'png':
      case 'jpg':
      case 'webp':
        result = await exportService.exportToImage(projectId, {
          ...options,
          format: params.format as any
        })
        contentType = `image/${params.format}`
        filename = `project-export.${params.format}`
        break
        
      case 'glb':
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        })
        result = await exportService.exportToGLB(project!.sceneData)
        contentType = 'model/gltf-binary'
        filename = 'project-export.glb'
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        )
    }
    
    // Upload to storage and return URL
    const url = await uploadToStorage(
      Buffer.from(result),
      `exports/${projectId}/${filename}`
    )
    
    // Save export record
    await prisma.export.create({
      data: {
        projectId,
        format: params.format,
        url,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    })
    
    return NextResponse.json({ url, filename })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}
```

---

## Phase 5: Performance & Optimization

### 5.1 Performance Optimizations

```typescript
// lib/three/optimizations.ts
import * as THREE from 'three'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'

export class SceneOptimizer {
  // Implement LOD (Level of Detail)
  static createLOD(modelUrls: string[]): THREE.LOD {
    const lod = new THREE.LOD()
    
    // High detail
    const highDetail = new THREE.Mesh(/* load high poly model */)
    lod.addLevel(highDetail, 0)
    
    // Medium detail
    const mediumDetail = new THREE.Mesh(/* load medium poly model */)
    lod.addLevel(mediumDetail, 10)
    
    // Low detail
    const lowDetail = new THREE.Mesh(/* load low poly model */)
    lod.addLevel(lowDetail, 25)
    
    return lod
  }
  
  // Instance repeated objects
  static createInstances(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    positions: THREE.Vector3[]
  ): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      positions.length
    )
    
    const matrix = new THREE.Matrix4()
    positions.forEach((pos, i) => {
      matrix.setPosition(pos)
      mesh.setMatrixAt(i, matrix)
    })
    
    mesh.instanceMatrix.needsUpdate = true
    return mesh
  }
  
  // Merge static geometries
  static mergeStaticObjects(objects: THREE.Mesh[]): THREE.Mesh {
    const geometries = objects.map(obj => obj.geometry)
    const merged = mergeBufferGeometries(geometries)
    
    return new THREE.Mesh(
      merged,
      objects[0].material
    )
  }
  
  // Texture optimization
  static optimizeTexture(texture: THREE.Texture): THREE.Texture {
    // Set appropriate filtering
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    
    // Generate mipmaps
    texture.generateMipmaps = true
    
    // Set anisotropy
    texture.anisotropy = 4
    
    return texture
  }
  
  // Frustum culling setup
  static setupFrustumCulling(camera: THREE.Camera, scene: THREE.Scene) {
    const frustum = new THREE.Frustum()
    const cameraMatrix = new THREE.Matrix4()
    
    return () => {
      cameraMatrix.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
      frustum.setFromProjectionMatrix(cameraMatrix)
      
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.visible = frustum.intersectsObject(obj)
        }
      })
    }
  }
}

// hooks/useOptimizedScene.ts
export function useOptimizedScene() {
  const [fps, setFps] = useState(60)
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high')
  
  useEffect(() => {
    // Monitor FPS
    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        setFps(frameCount)
        
        // Auto-adjust quality based on FPS
        if (frameCount < 30 && quality !== 'low') {
          setQuality('low')
        } else if (frameCount < 45 && quality === 'high') {
          setQuality('medium')
        } else if (frameCount > 55 && quality !== 'high') {
          setQuality('high')
        }
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    measureFPS()
  }, [quality])
  
  return { fps, quality }
}
```

### 5.2 Caching Strategy

```typescript
// lib/cache/redis-client.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export class CacheService {
  // Cache project data
  static async cacheProject(projectId: string, data: any, ttl = 3600) {
    await redis.setex(`project:${projectId}`, ttl, JSON.stringify(data))
  }
  
  static async getCachedProject(projectId: string) {
    const cached = await redis.get(`project:${projectId}`)
    return cached ? JSON.parse(cached as string) : null
  }
  
  // Cache furniture models metadata
  static async cacheFurnitureMetadata() {
    const furniture = await prisma.furnitureItem.findMany({
      where: { isActive: true }
    })
    
    await redis.setex(
      'furniture:metadata',
      86400, // 24 hours
      JSON.stringify(furniture)
    )
  }
  
  // Session-based caching
  static async cacheUserSession(userId: string, data: any) {
    await redis.setex(
      `session:${userId}`,
      7200, // 2 hours
      JSON.stringify(data)
    )
  }
  
  // Invalidation
  static async invalidateProject(projectId: string) {
    await redis.del(`project:${projectId}`)
  }
}

// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Add caching headers for static assets
  if (request.nextUrl.pathname.startsWith('/models/')) {
    const response = NextResponse.next()
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
    return response
  }
  
  // Add caching for API responses
  if (request.nextUrl.pathname.startsWith('/api/furniture')) {
    const response = NextResponse.next()
    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
    )
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/models/:path*', '/api/:path*']
}
```

---

## Testing Strategy

### Unit Testing

```typescript
// __tests__/services/ai-service.test.ts
import { AIService } from '@/lib/services/ai-service'

describe('AIService', () => {
  let service: AIService
  
  beforeEach(() => {
    service = new AIService()
  })
  
  describe('generateMoodBoard', () => {
    it('should generate specified number of images', async () => {
      const images = await service.generateMoodBoard({
        prompt: 'elegant wedding',
        count: 4
      })
      
      expect(images).toHaveLength(4)
      expect(images[0]).toMatch(/^https?:\/\//)
    })
  })
  
  describe('generateLayoutSuggestion', () => {
    it('should calculate correct number of tables', () => {
      const layout = service.generateLayoutSuggestion({
        venueSize: { width: 20, length: 30 },
        guestCount: 100,
        style: 'banquet'
      })
      
      expect(layout.items.length).toBeGreaterThanOrEqual(13) // 100/8
    })
  })
})
```

### Integration Testing

```typescript
// __tests__/api/projects.test.ts
import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/projects/route'

describe('/api/projects', () => {
  it('should create project with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'Test Wedding',
        venueId: 'test-venue',
        eventDate: '2024-06-15'
      }
    })
    
    await POST(req)
    
    expect(res._getStatusCode()).toBe(200)
    const json = JSON.parse(res._getData())
    expect(json.name).toBe('Test Wedding')
  })
})
```

### E2E Testing

```typescript
// e2e/project-workflow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Project Workflow', () => {
  test('should create and edit project', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    
    // Create project
    await page.goto('/dashboard')
    await page.click('text="New Project"')
    await page.fill('[name="name"]', 'E2E Test Wedding')
    await page.click('text="Create"')
    
    // Verify redirect to editor
    await expect(page).toHaveURL(/\/projects\/[\w-]+\/edit/)
    
    // Add furniture
    await page.click('[data-furniture="chair"]')
    await page.click('#canvas')
    
    // Verify item added
    const items = await page.locator('[data-testid="item-count"]').textContent()
    expect(items).toBe('1')
  })
})
```

---

## Deployment Configuration

### Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn test
      - run: yarn build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Environment Variables

```bash
# .env.example
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wedding_viz
DIRECT_URL=postgresql://user:password@localhost:5432/wedding_viz

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
REPLICATE_API_TOKEN=
OPENAI_API_KEY=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_NAME=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Redis Cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Monitoring
SENTRY_DSN=
```

---

## Claude Code Implementation Instructions

### Step 1: Initial Setup (2 hours)
1. Create Next.js project with TypeScript
2. Set up Prisma with schema
3. Configure authentication
4. Create basic layout components

### Step 2: Dashboard & Projects (4 hours)
1. Implement dashboard page
2. Create project CRUD operations
3. Add project list with filters
4. Implement file upload

### Step 3: 2D Canvas (6 hours)
1. Set up Fabric.js canvas
2. Implement furniture library
3. Add drag-and-drop
4. Create manipulation tools
5. Implement save/load

### Step 4: 3D Viewer (8 hours)
1. Set up Three.js scene
2. Implement model loading
3. Add transform controls
4. Sync with 2D canvas
5. Optimize performance

### Step 5: AI Integration (4 hours)
1. Set up Replicate API
2. Implement mood board generator
3. Add layout suggestions
4. Create AI UI components

### Step 6: Export & Sharing (4 hours)
1. Implement PDF export
2. Add image export
3. Create share links
4. Build public viewer

### Step 7: Testing & Polish (4 hours)
1. Write unit tests
2. Add E2E tests
3. Fix bugs
4. Optimize performance
5. Deploy to staging

Total estimated time: 32 hours of focused development

This implementation guide provides Claude Code with specific, actionable instructions to build the complete wedding visualization platform. Each component has detailed code examples that can be directly implemented or adapted as needed.
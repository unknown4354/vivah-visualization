# Wedding Stage Visualization Platform - Complete Implementation Plan

## Executive Summary
**Timeline**: 4-6 months to production MVP  
**Budget**: $240-1,350/month operational costs  
**Target**: $5K MRR by Month 12 ($60K ARR)  
**Stack**: Next.js 15, TypeScript, Prisma, PostgreSQL, Three.js, 8th Wall AR  
**Key Strategy**: Start with proven tech (avoid SAM-3D-Objects), target B2B planners, leverage AI assistance

---

## Phase 0: Pre-Development Setup (Week 0)

### Business Foundation
- [ ] **Legal Setup**
  - Register "Vivah Visualization" as product line under Vivah Technologies
  - Review and obtain necessary licenses for AI tools (InstantID, PhotoMaker)
  - Prepare terms of service and privacy policy templates

- [ ] **Market Validation**
  - Schedule interviews with 15-20 wedding planners in Bangalore
  - Create survey focusing on:
    - Current visualization pain points
    - Budget for software tools (validate $50-99/month pricing)
    - Must-have vs nice-to-have features
  - Join wedding planner associations/groups on LinkedIn

- [ ] **Infrastructure Preparation**
  - AWS account setup with billing alerts
  - Domain purchase: vivah3d.com or vivahvisuals.com
  - GitHub repository initialization
  - Development environment setup

---

## Phase 1: MVP Foundation (Months 1-4)

### Month 1: Core Infrastructure & Authentication

#### Week 1: Project Setup & Planning
**Day 1-2: Development Environment**
```typescript
// Tech Stack Setup
- Next.js 15 with App Router
- TypeScript strict mode
- Prisma with PostgreSQL (Supabase)
- Tailwind CSS + shadcn/ui
- ESLint + Prettier configuration
```

**Day 3-4: Database Schema Design**
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          UserRole  @default(PLANNER)
  subscription  Subscription?
  projects      Project[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Venue {
  id            String    @id @default(cuid())
  name          String
  address       String
  floorPlan     String?   // S3 URL
  dimensions    Json      // {width, height, scale}
  projects      Project[]
  createdAt     DateTime  @default(now())
}

model Project {
  id            String    @id @default(cuid())
  name          String
  userId        String
  venueId       String?
  status        ProjectStatus @default(DRAFT)
  sceneData     Json      // Three.js scene JSON
  decorItems    DecorItem[]
  shareLinks    ShareLink[]
  user          User      @relation(fields: [userId], references: [id])
  venue         Venue?    @relation(fields: [venueId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model DecorItem {
  id            String    @id @default(cuid())
  projectId     String
  itemType      String    // chair, table, flower, lighting
  position      Json      // {x, y, z}
  rotation      Json      // {x, y, z}
  scale         Json      // {x, y, z}
  metadata      Json      // color, material, etc
  project       Project   @relation(fields: [projectId], references: [id])
}
```

**Day 5-7: Authentication System**
- Implement Supabase Auth or Clerk ($25/month)
- User registration/login flows
- Protected routes middleware
- Session management

#### Week 2: User Dashboard & Project Management
**Day 8-10: Dashboard UI**
```typescript
// app/dashboard/page.tsx
export default function Dashboard() {
  // Claude Code: 85% implementation
  // Components: ProjectList, CreateProjectModal, UserStats
  // Features: Grid/List view, Search, Filters
}
```

**Day 11-12: Project CRUD Operations**
```typescript
// app/api/projects/route.ts
// CREATE, READ, UPDATE, DELETE endpoints
// Input validation with Zod
// Error handling middleware
```

**Day 13-14: File Upload System**
- Cloudflare R2 setup ($0.015/GB)
- Upload endpoint for floor plans
- Image optimization pipeline
- Progress indicators

#### Week 3: 2D Floor Planning Foundation
**Day 15-17: Floor Plan Viewer**
```typescript
// components/FloorPlanCanvas.tsx
// Using Konva.js or Fabric.js for 2D manipulation
// Features: Pan, Zoom, Grid overlay
// Claude Code: 70% implementation
```

**Day 18-19: Furniture Library Setup**
```typescript
// Initial 50-item catalog
const furnitureLibrary = {
  tables: {
    round: { sizes: [4, 6, 8, 10], icon: 'table-round.svg' },
    rectangular: { sizes: [6, 8, 10], icon: 'table-rect.svg' }
  },
  chairs: {
    chiavari: { colors: ['gold', 'silver', 'white'] },
    folding: { colors: ['white', 'black'] }
  },
  decorations: {
    centerpieces: ['floral', 'candles', 'mixed'],
    lighting: ['uplighting', 'string', 'chandeliers']
  }
}
```

**Day 20-21: Drag & Drop Implementation**
- React DnD or native HTML5 drag
- Snap-to-grid functionality
- Collision detection
- Undo/Redo system

#### Week 4: 3D Viewer Integration
**Day 22-24: Three.js Scene Setup**
```typescript
// components/ThreeViewer.tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls, Grid } from '@react-three/drei'

// Basic scene with:
// - Perspective/Orthographic camera toggle
// - Lighting setup (ambient + directional)
// - Grid helper
// - Stats panel (FPS counter)
// Claude Code: 60% implementation
```

**Day 25-26: 2D to 3D Conversion**
```typescript
// Convert 2D floor plan items to 3D objects
// Load GLB models from CDN
// Position mapping algorithm
// Height calculations for walls
```

**Day 27-28: Model Loading & Optimization**
- GLTF/GLB loader implementation
- Progressive loading (LOD system)
- Texture compression
- Target: <5MB total scene size

### Month 2: AI Integration & Enhanced 3D

#### Week 5: Replicate API Integration
**Day 29-31: AI Service Setup**
```typescript
// services/ai-generation.ts
import Replicate from 'replicate'

class AIGenerationService {
  async generateMoodBoard(prompt: string) {
    // FLUX Schnell for fast generation
    // Cost: ~$0.002 per image
    // Response time: 2-5 seconds
  }
  
  async generateDecorSuggestion(style: string, venue: VenueData) {
    // Custom prompt engineering
    // Return furniture placement suggestions
  }
}
```

**Day 32-33: Mood Board Generator**
- Text prompt interface
- Style presets (Rustic, Modern, Traditional, Bohemian)
- Gallery view for generated images
- Save to project functionality

**Day 34-35: AI Assistant Features**
```typescript
// Decor recommendation engine
const getAIRecommendations = async (params: {
  budget: number,
  guestCount: number,
  style: string,
  venue: VenueData
}) => {
  // Generate layout suggestions
  // Color palette recommendations
  // Furniture quantity calculator
}
```

#### Week 6: Advanced 3D Features
**Day 36-38: Transform Controls**
```typescript
// Enhanced manipulation tools
// - Multi-select with bounding box
// - Precise input fields (X, Y, Z)
// - Rotation snapping (15° increments)
// - Scale constraints (maintain proportions)
```

**Day 39-40: Material & Color System**
```typescript
// Dynamic material switching
const materials = {
  tablecloth: ['white', 'ivory', 'burgundy', 'navy'],
  chairs: ['gold', 'silver', 'mahogany'],
  flowers: generateFlowerPalette(weddingColors)
}
```

**Day 41-42: Lighting System**
- Dynamic lighting preview
- Time of day simulation
- Uplighting color changes
- Performance optimization (max 4 lights)

#### Week 7: Collaboration Features
**Day 43-45: Sharing System**
```typescript
// Share link generation
// View-only mode for clients
// Comment system with annotations
// Email notifications
// Claude Code: 85% implementation
```

**Day 46-47: Export Functionality**
- PDF generation with floor plan + 3D renders
- High-resolution image export
- Material/furniture list export
- Budget breakdown export

**Day 48-49: Real-time Updates (Optional)**
```typescript
// WebSocket for live collaboration
// Using Supabase Realtime or custom Socket.io
// Cursor position sharing
// Optimistic updates
```

#### Week 8: Payment & Launch Preparation
**Day 50-52: Stripe Integration**
```typescript
// Subscription tiers implementation
const pricingTiers = {
  free: {
    projects: 1,
    aiGenerations: 5,
    support: 'community'
  },
  pro: {
    price: 4999, // ₹4,999/month (~$60)
    projects: 5,
    aiGenerations: 50,
    support: 'email'
  },
  agency: {
    price: 12499, // ₹12,499/month (~$150)
    projects: 'unlimited',
    aiGenerations: 200,
    support: 'priority',
    whiteLabel: true
  }
}
```

**Day 53-54: Testing & Bug Fixes**
- End-to-end testing with Playwright
- Load testing (target: 100 concurrent users)
- Mobile responsiveness check
- Cross-browser compatibility

**Day 55-56: Soft Launch Preparation**
- Landing page with demo
- Onboarding flow
- Documentation/tutorials
- Support system setup

### Month 3: AR Implementation & Optimization

#### Week 9: 8th Wall AR Setup
**Day 57-59: 8th Wall Integration**
```typescript
// AR viewer component
// Cost: $99/month for starter plan
// Supports iOS Safari + Android Chrome

const ARViewer = () => {
  // QR code generation
  // Marker-based initialization
  // Markerless SLAM tracking
  // Surface detection
}
```

**Day 60-61: AR Model Optimization**
```typescript
// Model preparation pipeline
const optimizeForAR = (model) => {
  // Reduce to <10,000 polygons
  // Compress textures to 1024x1024
  // Apply DRACO compression
  // Target: <2MB per model
}
```

**Day 62-63: AR Placement Features**
- Floor detection for table placement
- Wall detection for backdrop
- Scale calibration
- Multi-item placement

#### Week 10: Performance Optimization
**Day 64-66: 3D Performance**
```typescript
// Optimization strategies
- Instanced rendering for repeated items
- Frustum culling
- Level of Detail (LOD) system
- Texture atlasing
- Target: 60 FPS on mid-range devices
```

**Day 67-68: Database Optimization**
- Query optimization
- Indexing strategy
- Connection pooling
- Redis caching layer

**Day 69-70: CDN & Asset Delivery**
- CloudFront setup with flat-rate plan ($15/month)
- Image optimization pipeline
- Lazy loading implementation
- Browser caching strategy

#### Week 11: Quality Assurance
**Day 71-73: Comprehensive Testing**
- Unit tests (Jest) - 70% coverage
- Integration tests (Playwright)
- Performance testing (Lighthouse)
- Security audit (OWASP Top 10)

**Day 74-75: User Acceptance Testing**
- Beta test with 10 wedding planners
- Feedback collection
- Bug tracking (Linear/GitHub Issues)
- Priority fixes

**Day 76-77: Documentation**
- API documentation
- User guide
- Video tutorials
- FAQ section

#### Week 12: Production Launch
**Day 78-80: Infrastructure Setup**
```yaml
# Production deployment
- Vercel Pro ($20/month)
- Supabase Pro ($25/month) 
- AWS GPU instances (on-demand)
- Monitoring: Sentry + Vercel Analytics
- Backup strategy: Daily snapshots
```

**Day 81-82: Launch Preparation**
- Product Hunt launch assets
- Social media templates
- Email campaigns
- Press release

**Day 83-84: Go Live**
- DNS cutover
- SSL certificates
- Rate limiting
- DDoS protection
- Launch announcement

### Month 4: Growth & Enhancement

#### Week 13-14: Marketing Push
- Product Hunt launch (target Top 5)
- IndieHackers case study
- LinkedIn outreach to planners
- Google Ads campaign ($500 budget)
- Content marketing (3 blog posts/week)

#### Week 15-16: Feature Expansion Based on Feedback
**Priority Features:**
1. Seating chart generator
2. Vendor marketplace integration
3. Budget tracking
4. Guest list integration
5. Timeline/schedule builder

---

## Phase 2: Scaling (Months 5-6)

### Month 5: Advanced Features

#### 3D Gaussian Splatting Integration
```python
# For photorealistic venue capture
# Requires 20-50 photos per venue
# Training time: 10-30 minutes
# Quality: Photorealistic at 60+ FPS
```

#### AI Personalization (InstantID/PhotoMaker)
```typescript
// Insert client faces into venue renders
// Processing: 15-30 seconds per image
// Cost: $0.006-0.01 per image via Replicate
// Use case: "See yourself at the venue"
```

#### Multi-view Consistency
- Same person across multiple angles
- Depth map conditioning
- Fixed seed generation
- IP-Adapter for enhanced similarity

### Month 6: Enterprise Features

#### White-Label Solution
- Custom branding options
- Dedicated subdomains
- API access
- Priority support

#### Venue Partnership Program
- Direct integration with venue systems
- Commission structure (10-15%)
- Co-marketing agreements
- Exclusive features

#### Advanced Analytics
- Usage analytics dashboard
- ROI calculator
- Conversion tracking
- A/B testing framework

---

## Technical Architecture Details

### System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js 15     │────▶│  FastAPI        │────▶│  GPU Workers    │
│  Frontend       │     │  Backend        │     │  (Kubernetes)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CloudFront     │     │  PostgreSQL     │     │  S3 / R2        │
│  CDN            │     │  Supabase       │     │  Storage        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### API Structure
```typescript
// Core endpoints
POST   /api/auth/register
POST   /api/auth/login
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/share
GET    /api/venues
POST   /api/venues
POST   /api/ai/generate-mood-board
POST   /api/ai/suggest-layout
GET    /api/models/furniture
POST   /api/export/pdf
GET    /api/ar/session/:id
```

### Database Schema Extensions
```prisma
// Additional models for scale
model Subscription {
  id              String    @id @default(cuid())
  userId          String    @unique
  tier            Tier      @default(FREE)
  stripeId        String?
  currentPeriod   DateTime
  user            User      @relation(fields: [userId], references: [id])
}

model AIGeneration {
  id              String    @id @default(cuid())
  userId          String
  projectId       String?
  prompt          String
  result          String    // S3 URL
  cost            Float
  provider        String    // replicate, stability
  createdAt       DateTime  @default(now())
}

model ShareLink {
  id              String    @id @default(cuid())
  projectId       String
  token           String    @unique
  permissions     String[]  // view, comment, edit
  expiresAt       DateTime?
  project         Project   @relation(fields: [projectId], references: [id])
}
```

---

## Cost Analysis & Scaling

### Initial Costs (100 venues/clients)
- **Infrastructure**: $240/month
  - Vercel Pro: $20
  - Supabase Pro: $25
  - GPU Processing: $50
  - CDN: $15
  - Miscellaneous: $130

### Growth Phase (1,000 venues/clients)
- **Infrastructure**: $1,350/month
  - Compute: $300
  - GPU: $500
  - Database: $300
  - Storage: $50
  - CDN: $200

### Revenue Projections
```
Month 1-3: Development (Cost only)
Month 4: 10 customers × $50 = $500 MRR
Month 5: 25 customers × $50 = $1,250 MRR
Month 6: 40 customers × $50 = $2,000 MRR
Month 8: 60 customers × $50 = $3,000 MRR
Month 10: 80 customers × $50 = $4,000 MRR
Month 12: 100 customers × $50 = $5,000 MRR
```

---

## Risk Mitigation

### Technical Risks
1. **3D Performance Issues**
   - Mitigation: Progressive enhancement, 2D fallback
   - Testing: Multiple device tiers

2. **AI Generation Quality**
   - Mitigation: Multiple model options
   - Fallback: Pre-generated templates

3. **iOS AR Compatibility**
   - Mitigation: 8th Wall ($99/month)
   - Alternative: Video preview

### Business Risks
1. **Low Adoption**
   - Mitigation: Free tier, extensive demos
   - Pivot: Focus on inventory management

2. **Competition**
   - Mitigation: Local market focus, cultural expertise
   - Differentiation: AI + AR combination

3. **Scalability**
   - Mitigation: Queue-based architecture
   - Auto-scaling: Kubernetes with KEDA

---

## Success Metrics

### Technical KPIs
- Page load time: <3 seconds
- 3D scene FPS: >30 (60 target)
- AI generation: <30 seconds
- Uptime: 99.9%
- Mobile performance: >70 Lighthouse

### Business KPIs
- Customer acquisition: 10/month
- Churn rate: <10%
- NPS score: >50
- Support tickets: <5% of MAU
- Feature adoption: >60%

### Month-by-Month Targets
- Month 1: Infrastructure complete
- Month 2: 2D/3D viewer functional
- Month 3: AI integration live
- Month 4: 10 paying customers
- Month 5: 25 paying customers
- Month 6: Product-market fit validated

---

## Tools & Resources

### Development Tools
- **Claude Code**: 60-85% code generation efficiency
- **GitHub Copilot**: Real-time suggestions
- **Cursor IDE**: AI-native development

### Design Resources
- **Figma**: UI/UX design
- **TurboSquid**: 3D models ($5-500 each)
- **CGTrader**: 242,872 models available
- **Poly Pizza**: Free low-poly models

### Monitoring
- **Sentry**: Error tracking
- **Vercel Analytics**: Performance monitoring
- **Prometheus + Grafana**: Infrastructure metrics
- **PostHog**: Product analytics

### AI Services
- **Replicate**: $0.006-0.01/image
- **Stability AI**: Direct API access
- **RunPod**: GPU instances ($0.34/hr)
- **Modal**: Serverless GPU ($0.40/hr)

---

## Implementation Checklist

### Week 1 Priorities
- [ ] Interview 5 wedding planners
- [ ] Set up Next.js + Supabase
- [ ] Deploy "Hello World" to Vercel
- [ ] Create basic auth system
- [ ] Design database schema

### Month 1 Deliverables
- [ ] User authentication working
- [ ] Project CRUD complete
- [ ] Basic 2D floor plan viewer
- [ ] 10 furniture items in library
- [ ] File upload system

### Month 2 Deliverables
- [ ] 3D viewer integrated
- [ ] AI mood board generator
- [ ] 50+ furniture items
- [ ] Transform controls working
- [ ] Export to PDF

### Month 3 Deliverables
- [ ] AR preview functional
- [ ] Payment system integrated
- [ ] Performance optimized
- [ ] Beta testing complete
- [ ] Documentation ready

### Launch Checklist
- [ ] 10 beta users tested
- [ ] All critical bugs fixed
- [ ] Payment processing verified
- [ ] Support system ready
- [ ] Marketing materials prepared
- [ ] Product Hunt launch scheduled

---

## Contact & Support Plan

### Customer Support Strategy
1. **Documentation**: Comprehensive guides
2. **Video Tutorials**: 10 core workflows
3. **Email Support**: <24 hour response
4. **Community Forum**: Discord/Slack
5. **Office Hours**: Weekly Zoom calls

### Feedback Loops
- Weekly user interviews
- Monthly NPS surveys
- Feature request board
- Bug bounty program
- Advisory board (3-5 planners)

---

## Conclusion

This implementation plan provides a structured path to building a production-ready wedding visualization platform in 4-6 months. The key to success is:

1. **Start with proven technology** (Three.js, not SAM-3D)
2. **Focus on B2B planners** first
3. **Launch fast** with core features
4. **Iterate based on feedback**
5. **Scale infrastructure gradually**

By Month 12, the platform should achieve $5K MRR ($60K ARR), positioning it as a valuable asset worth $180-300K based on SaaS multiples.

The wedding industry's $305B market size and 7.2% CAGR provide ample growth opportunity, while your unique position with Vivah Technologies' 13+ years of wedding expertise creates a strong competitive advantage.

Start with Week 1 priorities and maintain momentum through consistent daily execution. The combination of AI assistance (saving 40% development time) and focused scope will enable successful solo development within the projected timeline.
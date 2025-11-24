'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Eye,
  Lock,
  Calendar,
  Users,
  MapPin,
  Download,
  Share2,
  Maximize2,
  RotateCcw,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ThreeScene } from '@/components/canvas/ThreeScene'
import { useCanvasStore } from '@/stores/canvas-store'

interface ShareLinkData {
  valid: boolean
  projectId?: string
  permissions?: {
    canEdit: boolean
    canComment: boolean
    canExport: boolean
  }
  error?: string
  requiresPassword?: boolean
}

interface ProjectData {
  id: string
  name: string
  description?: string
  eventDate?: string
  guestCount?: number
  venue?: {
    name: string
    address: string
  }
  sceneData: any
  items: any[]
}

export default function SharedViewerPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [shareData, setShareData] = useState<ShareLinkData | null>(null)
  const [project, setProject] = useState<ProjectData | null>(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { importScene, items } = useCanvasStore()

  // Verify share link
  useEffect(() => {
    verifyShareLink()
  }, [token])

  const verifyShareLink = async (pwd?: string) => {
    try {
      const res = await fetch('/api/share/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pwd })
      })

      const data = await res.json()

      if (data.requiresPassword && !pwd) {
        setShareData({ valid: false, requiresPassword: true })
        setLoading(false)
        return
      }

      setShareData(data)

      if (data.valid && data.projectId) {
        await fetchProject(data.projectId)
      } else {
        setLoading(false)
      }
    } catch (error) {
      setShareData({ valid: false, error: 'Failed to verify share link' })
      setLoading(false)
    }
  }

  const fetchProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/share/project/${projectId}?token=${token}`)

      if (res.ok) {
        const data = await res.json()
        setProject(data)

        // Import scene data
        if (data.sceneData?.items) {
          importScene(data.sceneData)
        }
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setPasswordError('Please enter the password')
      return
    }
    setPasswordError('')
    setLoading(true)
    verifyShareLink(password)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  // Password required
  if (shareData?.requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Password Protected</h1>
              <p className="text-sm text-muted-foreground mt-1">
                This project requires a password to view
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                />
                {passwordError && (
                  <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                View Project
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid or expired link
  if (!shareData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold">Link Unavailable</h1>
            <p className="text-muted-foreground mt-2">
              {shareData?.error || 'This share link is invalid or has expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Valid - show project
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{project?.name}</h1>
            {project?.venue && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {project.venue.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {shareData.permissions?.canExport && (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 3D Viewer */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                <ThreeScene />

                {/* Controls overlay */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Button size="sm" variant="secondary" className="shadow">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>

                {/* Item count */}
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {items.size} items
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Project Info */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold">Project Details</h3>

                {project?.eventDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(project.eventDate).toLocaleDateString()}</span>
                  </div>
                )}

                {project?.guestCount && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{project.guestCount} guests</span>
                  </div>
                )}

                {project?.venue && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{project.venue.name}</p>
                      <p className="text-muted-foreground">{project.venue.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {project?.description && (
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comments (if allowed) */}
            {shareData.permissions?.canComment && (
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Comments
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Comments coming soon...
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Powered by */}
            <div className="text-center text-xs text-muted-foreground">
              Powered by Vivah Visualization
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

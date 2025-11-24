'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Maximize2,
  Camera,
  Sun,
  Moon,
  RotateCcw,
  Download,
  Share2,
  Eye,
  Grid3X3,
  Pause,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThreeScene } from '@/components/canvas/ThreeScene'
import { GLBViewer } from '@/components/canvas/GLBViewer'
import { useCanvasStore } from '@/stores/canvas-store'

export default function ThreeDViewPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string

  // Check if viewing a generated 3D model from URL params
  const glbUrl = searchParams.get('model')

  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [lightMode, setLightMode] = useState<'day' | 'night'>('day')
  const [autoRotate, setAutoRotate] = useState(true)

  const { importScene, items } = useCanvasStore()

  // Fetch project data
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        if (res.ok) {
          const data = await res.json()
          setProject(data)

          // Import scene data if exists
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

    fetchProject()
  }, [projectId, importScene])

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle screenshot
  const handleScreenshot = async () => {
    // Get canvas element
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    // Create download link
    const link = document.createElement('a')
    link.download = `${project?.name || 'project'}-3d-view.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // Handle export
  const handleExport = async () => {
    try {
      const res = await fetch(`/api/export/png`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          options: { width: 1920, height: 1080 }
        })
      })

      if (res.ok) {
        const data = await res.json()
        window.open(data.url, '_blank')
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Reset camera view
  const resetCamera = () => {
    // This would reset OrbitControls - need to expose this from ThreeScene
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/projects/${projectId}/edit`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{project?.name || 'Project'}</h1>
            <p className="text-xs text-muted-foreground">
              3D View • {items.size} items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <Grid3X3 className={`w-5 h-5 ${showGrid ? 'text-primary' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLightMode(lightMode === 'day' ? 'night' : 'day')}
            title="Toggle Lighting"
          >
            {lightMode === 'day' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {glbUrl && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? 'Stop Rotation' : 'Auto Rotate'}
            >
              {autoRotate ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={resetCamera}
            title="Reset Camera"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleScreenshot}
            title="Screenshot"
          >
            <Camera className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            title="Export"
          >
            <Download className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/projects/${projectId}/share`)}
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        {glbUrl ? (
          <GLBViewer
            glbUrl={glbUrl}
            autoRotate={autoRotate}
            showShadows={true}
            backgroundColor={lightMode === 'day' ? '#f5f5f5' : '#1a1a1a'}
          />
        ) : (
          <ThreeScene />
        )}

        {/* Camera presets - only show for ThreeScene */}
        {!glbUrl && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button size="sm" variant="secondary" className="shadow-lg">
              <Eye className="w-4 h-4 mr-2" />
              Front
            </Button>
            <Button size="sm" variant="secondary" className="shadow-lg">
              Top
            </Button>
            <Button size="sm" variant="secondary" className="shadow-lg">
              Side
            </Button>
            <Button size="sm" variant="secondary" className="shadow-lg">
              Perspective
            </Button>
          </div>
        )}

        {/* Info panel */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur rounded-lg p-3 shadow-lg text-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>{glbUrl ? '3D Model loaded' : 'Scene loaded'}</span>
          </div>
          <div className="text-muted-foreground">
            {glbUrl ? (
              <>
                <p>Generated from image</p>
                <p>Click and drag to rotate</p>
                <p>Scroll to zoom</p>
              </>
            ) : (
              <>
                <p>Items: {items.size}</p>
                <p>Click and drag to rotate</p>
                <p>Scroll to zoom</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageEditor } from '@/components/editor/ImageEditor'
import { ProjectSelector } from '@/components/editor/ProjectSelector'
import { Upload, Image as ImageIcon, Wand2, Box, ArrowRight, Loader2, Save, FolderOpen, ArrowLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Project {
  id: string
  name: string
  thumbnail: string | null
  currentImageUrl?: string | null
}

type ViewMode = 'select-project' | 'upload' | 'editor'

export default function AIStudioPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('select-project')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [recentGenerations, setRecentGenerations] = useState<any[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [imageToSave, setImageToSave] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects')
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects || [])
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      }
    }
    fetchProjects()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Create a local URL for preview
      const localUrl = URL.createObjectURL(file)
      setSelectedImage(localUrl)
      setViewMode('editor')

      // TODO: Upload to storage service for API use
      // For now, we'll use the local URL
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleProjectSelect = (projectId: string, imageUrl?: string) => {
    setSelectedProjectId(projectId)
    if (imageUrl) {
      setSelectedImage(imageUrl)
      setViewMode('editor')
    } else {
      setViewMode('upload')
    }
  }

  const handleBackToUpload = () => {
    setSelectedImage(null)
    setViewMode('upload')
  }

  const handleConvertTo3D = (glbUrl: string) => {
    // Navigate to 3D viewer with the generated model
    router.push(`/3d-gallery?model=${encodeURIComponent(glbUrl)}`)
  }

  const handleSaveEdit = (editedImageUrl: string) => {
    // Add to recent generations
    setRecentGenerations(prev => [
      { url: editedImageUrl, timestamp: new Date() },
      ...prev.slice(0, 9)
    ])

    // Show save to project dialog
    setImageToSave(editedImageUrl)
    setShowSaveDialog(true)
  }

  const handleSaveToProject = async (projectId: string) => {
    if (!imageToSave) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageToSave })
      })

      if (!res.ok) {
        throw new Error('Failed to save image')
      }

      setShowSaveDialog(false)
      setImageToSave(null)
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save image to project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateNewProjectWithImage = async () => {
    if (!imageToSave) return

    const name = prompt('Enter project name:')
    if (!name) return

    setIsSaving(true)
    try {
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          thumbnail: imageToSave
        })
      })

      if (!createRes.ok) {
        throw new Error('Failed to create project')
      }

      const { project } = await createRes.json()

      await fetch(`/api/projects/${project.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageToSave })
      })

      setShowSaveDialog(false)
      setImageToSave(null)
      setProjects(prev => [project, ...prev])
    } catch (error) {
      console.error('Create project error:', error)
      alert('Failed to create project')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={viewMode === 'editor' ? "h-[calc(100vh-64px)]" : "container mx-auto py-8 px-4 max-w-7xl"}>
      {viewMode !== 'editor' && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Wand2 className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">AI Studio</h1>
          </div>
          <p className="text-muted-foreground">
            Transform venue images with AI-powered editing and 3D conversion
          </p>
        </div>
      )}

      {/* Project Selection View */}
      {viewMode === 'select-project' && (
        <div className="max-w-4xl mx-auto">
          <ProjectSelector
            onSelect={handleProjectSelect}
          />
        </div>
      )}

      {/* Upload View */}
      {viewMode === 'upload' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Project indicator */}
          {selectedProjectId && (
            <div className="md:col-span-2 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm text-foreground">
                <FolderOpen className="h-4 w-4" />
                <span>Working in project</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 text-xs"
                  onClick={() => setViewMode('select-project')}
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Upload Card */}
          <Card className="border-2 border-dashed hover:border-foreground/20 transition-colors group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Upload className="h-5 w-5" />
                Upload Image
              </CardTitle>
              <CardDescription>
                Upload a venue or stage photo to start editing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl p-8 text-center cursor-pointer bg-secondary/50 hover:bg-secondary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {isUploading ? (
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-foreground" />
                ) : (
                  <div className="p-4 bg-secondary rounded-full w-fit mx-auto mb-4 group-hover:bg-muted transition-colors">
                    <ImageIcon className="h-8 w-8 text-foreground" />
                  </div>
                )}
                <p className="font-medium mb-1 text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">AI Editing Features</CardTitle>
              <CardDescription>
                Powerful tools for wedding visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary transition-colors">
                <div className="p-2.5 bg-secondary rounded-lg shrink-0">
                  <Wand2 className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Quick Edit</h4>
                  <p className="text-sm text-muted-foreground">
                    Natural language edits in under 1 second
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary transition-colors">
                <div className="p-2.5 bg-secondary rounded-lg shrink-0">
                  <ImageIcon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Precise Edit</h4>
                  <p className="text-sm text-muted-foreground">
                    Mask-based editing for specific areas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary transition-colors">
                <div className="p-2.5 bg-secondary rounded-lg shrink-0">
                  <Box className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">3D Conversion</h4>
                  <p className="text-sm text-muted-foreground">
                    Convert 2D images to interactive 3D models
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Images */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground">Try with Sample Images</CardTitle>
              <CardDescription>
                Get started quickly with pre-loaded venue images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
                  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400',
                  'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400',
                  'https://images.unsplash.com/photo-1507504031003-b417219a0fde?w=400'
                ].map((url, i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-xl overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all group shadow-sm"
                    onClick={() => {
                      setSelectedImage(url)
                      setViewMode('editor')
                    }}
                  >
                    <img
                      src={url}
                      alt={`Sample venue ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Editor View */}
      {viewMode === 'editor' && selectedImage && (
        <div className="h-full">
          <ImageEditor
            imageUrl={selectedImage}
            projectId={selectedProjectId || undefined}
            onSave={handleSaveEdit}
            onConvertTo3D={handleConvertTo3D}
            onBack={handleBackToUpload}
          />
        </div>
      )}

      {/* Recent Generations */}
      {recentGenerations.length > 0 && viewMode === 'upload' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Edits</CardTitle>
            <CardDescription>Click to continue editing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recentGenerations.map((gen, i) => (
                <div
                  key={i}
                  className="aspect-video rounded-xl overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all group shadow-sm"
                  onClick={() => {
                    setSelectedImage(gen.url)
                    setViewMode('editor')
                  }}
                >
                  <img
                    src={gen.url}
                    alt={`Recent edit ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save to Project Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Project</DialogTitle>
            <DialogDescription>
              Choose a project to save this image or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {projects.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSaveToProject(project.id)}
                    disabled={isSaving}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                  >
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium">{project.name}</span>
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleCreateNewProjectWithImage}
              disabled={isSaving}
              variant="outline"
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Create New Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

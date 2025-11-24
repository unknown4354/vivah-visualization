'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ImageEditor } from '@/components/editor/ImageEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Save,
  Loader2,
  ArrowLeft,
  Wand2,
  Box,
  Upload,
  Image as ImageIcon,
  Plus,
  Clock,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface ProjectImage {
  id: string
  url: string
  createdAt: string
  type: 'source' | 'generated'
  prompt?: string
}

interface Generation {
  id: string
  prompt: string
  outputUrl: string
  createdAt: string
  mode: string
}

export default function ProjectEditorPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [projectName, setProjectName] = useState('Loading...')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved')
  const [projectImage, setProjectImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [viewMode, setViewMode] = useState<'gallery' | 'editor'>('gallery')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])

  // Load project data on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/projects')
            return
          }
          throw new Error('Failed to load project')
        }

        const project = await response.json()
        setProjectName(project.name)

        // Set project image if exists
        if (project.currentImageUrl || project.sourceImageUrl) {
          setProjectImage(project.currentImageUrl || project.sourceImageUrl)
        }

        // Build images array from project data
        const images: ProjectImage[] = []

        // Add source image
        if (project.sourceImageUrl) {
          images.push({
            id: 'source',
            url: project.sourceImageUrl,
            createdAt: project.createdAt,
            type: 'source'
          })
        } else if (project.currentImageUrl) {
          images.push({
            id: 'current',
            url: project.currentImageUrl,
            createdAt: project.createdAt,
            type: 'source'
          })
        }

        // Add images from project.images if available
        if (project.images && project.images.length > 0) {
          project.images.forEach((img: { id: string; url: string; createdAt?: string }) => {
            if (!images.find(i => i.url === img.url)) {
              images.push({
                id: img.id,
                url: img.url,
                createdAt: img.createdAt || project.createdAt,
                type: 'source'
              })
            }
          })
        }

        setProjectImages(images)

        // Load generations history from aiGenerations
        if (project.aiGenerations && project.aiGenerations.length > 0) {
          setGenerations(project.aiGenerations.map((gen: { id: string; type: string; prompt: string; resultUrl: string; createdAt: string }) => ({
            id: gen.id,
            prompt: gen.prompt,
            outputUrl: gen.resultUrl,
            createdAt: gen.createdAt,
            mode: gen.type
          })))
        }
      } catch (err) {
        console.error('Error loading project:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [id, router])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentImageUrl: projectImage
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save project')
      }

      setSaveStatus('saved')
    } catch (err) {
      console.error('Error saving project:', err)
      setSaveStatus('unsaved')
      alert('Failed to save project. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Create local URL for preview
      const localUrl = URL.createObjectURL(file)
      setProjectImage(localUrl)
      setSaveStatus('unsaved')

      // TODO: Upload to storage service and update project
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditImage = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setProjectImage(imageUrl)
    setViewMode('editor')
  }

  const handleBackToGallery = () => {
    setViewMode('gallery')
    setSelectedImage(null)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Editor view
  if (viewMode === 'editor' && selectedImage) {
    return (
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={handleBackToGallery} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-semibold">{projectName}</h1>
              <span className="text-xs text-gray-500">AI Editor</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <ImageEditor
            imageUrl={selectedImage}
            projectId={id}
            onSave={(editedUrl) => {
              setProjectImage(editedUrl)
              setSaveStatus('unsaved')
            }}
            onConvertTo3D={(glbUrl) => {
              router.push(`/projects/${id}/3d?model=${encodeURIComponent(glbUrl)}`)
            }}
            onBack={handleBackToGallery}
          />
        </main>
      </div>
    )
  }

  // Gallery view (default)
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{projectName}</h1>
            <span className="text-xs text-gray-500">
              {projectImages.length} image{projectImages.length !== 1 ? 's' : ''} • {generations.length} generation{generations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
            Upload Image
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/projects/${id}/3d`)}
          >
            <Box className="h-4 w-4 mr-1" />
            View 3D
          </Button>
        </div>
      </header>

      {/* Main Content - Gallery View */}
      <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        {/* Input Images Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Input Images
          </h2>

          {projectImages.length === 0 && !projectImage ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload a Venue Image</h3>
                <p className="text-muted-foreground mb-4 text-center max-w-md">
                  Upload a venue or stage photo to start AI editing
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Show projectImage if no projectImages array */}
              {projectImages.length === 0 && projectImage && (
                <Card
                  className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => handleEditImage(projectImage)}
                >
                  <div className="aspect-[4/3] relative">
                    <img src={projectImage} alt="Source" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-white/90 rounded text-xs font-medium">Source</span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <Button size="sm" className="w-full" onClick={() => handleEditImage(projectImage)}>
                      <Wand2 className="h-3 w-3 mr-1" />
                      Edit with AI
                    </Button>
                  </CardContent>
                </Card>
              )}

              {projectImages.map((img) => (
                <Card
                  key={img.id}
                  className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => handleEditImage(img.url)}
                >
                  <div className="aspect-[4/3] relative">
                    <img src={img.url} alt="Input" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-white/90 rounded text-xs font-medium">
                        {img.type === 'source' ? 'Source' : 'Input'}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <Button size="sm" className="w-full" onClick={() => handleEditImage(img.url)}>
                      <Wand2 className="h-3 w-3 mr-1" />
                      Edit with AI
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Add more button */}
              <Card
                className="overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors border-2 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="aspect-[4/3] flex items-center justify-center">
                  <div className="text-center">
                    <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Add Image</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </section>

        {/* Generated Results Section */}
        {generations.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generated Results
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((gen) => (
                <Card
                  key={gen.id}
                  className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => handleEditImage(gen.outputUrl)}
                >
                  <div className="aspect-[4/3] relative">
                    <img src={gen.outputUrl} alt={gen.prompt} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-primary/90 text-primary-foreground rounded text-xs font-medium capitalize">
                        {gen.mode}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground truncate mb-2" title={gen.prompt}>
                      {gen.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(gen.createdAt).toLocaleDateString()}
                      </span>
                      <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => handleEditImage(gen.outputUrl)}>
                        <Wand2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty state for no generations */}
        {generations.length === 0 && (projectImages.length > 0 || projectImage) && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generated Results
            </h2>
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Wand2 className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">
                  No AI generations yet. Click on an image to start editing.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}

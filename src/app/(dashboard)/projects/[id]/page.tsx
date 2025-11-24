'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Edit, Download, Trash2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

interface ProjectImage {
  id: string
  url: string
  name: string | null
  isOriginal: boolean
  createdAt: string
}

interface AIGeneration {
  id: string
  type: string
  prompt: string
  resultUrl: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  thumbnail: string | null
  images: ProjectImage[]
  generations: AIGeneration[]
  updatedAt: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const [projectRes, imagesRes, generationsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/images`),
          fetch(`/api/ai/generations?projectId=${projectId}`)
        ])

        if (!projectRes.ok) {
          throw new Error('Failed to fetch project')
        }

        const projectData = await projectRes.json()
        const imagesData = imagesRes.ok ? await imagesRes.json() : { images: [] }
        const generationsData = generationsRes.ok ? await generationsRes.json() : { generations: [] }

        setProject({
          ...projectData.project,
          images: imagesData.images || [],
          generations: generationsData.generations || []
        })
      } catch (err) {
        console.error(err)
        setError('Failed to load project')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  const handleDownload = async (url: string, name: string) => {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `${name || 'image'}-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(downloadUrl)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">{error || 'Project not found'}</p>
        <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
      </div>
    )
  }

  const originalImages = project.images.filter(img => img.isOriginal)
  const editedImages = project.images.filter(img => !img.isOriginal)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
        </div>
        <Link href={`/projects/${projectId}/edit`}>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Continue Editing
          </Button>
        </Link>
      </div>

      {/* Original Images */}
      {originalImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Original Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {originalImages.map((image) => (
                <div key={image.id} className="group relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image.url}
                    alt={image.name || 'Original'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleDownload(image.url, image.name || 'original')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edited Images / Results */}
      {editedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Edited Results ({editedImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {editedImages.map((image) => (
                <div key={image.id} className="group relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image.url}
                    alt={image.name || 'Edited'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    {image.name && (
                      <p className="text-white text-xs text-center line-clamp-2">{image.name}</p>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleDownload(image.url, image.name || 'edited')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="text-xs bg-black/70 text-white px-2 py-0.5 rounded">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {project.images.length === 0 && (
        <Card className="p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            No images in this project yet. Start editing to generate results.
          </p>
          <Link href={`/projects/${projectId}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Start Editing
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

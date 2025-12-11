'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GLBViewer } from '@/components/canvas/GLBViewer'
import { Box, Download, Share2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Model3D {
  id: string
  glbUrl: string
  thumbnail?: string
  name: string
  createdAt: Date
}

export default function ThreeDGalleryPage() {
  const searchParams = useSearchParams()
  const modelUrl = searchParams.get('model')

  const [models, setModels] = useState<Model3D[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(modelUrl)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user's 3D generations
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('/api/ai/generations?type=image_to_3d')
        if (res.ok) {
          const data = await res.json()
          setModels(data.generations || [])
        }
      } catch (error) {
        console.error('Failed to fetch models:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchModels()
  }, [])

  // Update selected model when URL param changes
  useEffect(() => {
    if (modelUrl) {
      setSelectedModel(modelUrl)
    }
  }, [modelUrl])

  const handleDownload = async () => {
    if (!selectedModel) return

    const link = document.createElement('a')
    link.href = selectedModel
    link.download = `model-${Date.now()}.glb`
    link.click()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">3D Gallery</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your generated 3D models
        </p>
      </div>

      {selectedModel ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setSelectedModel(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download GLB
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <Card className="h-[calc(100vh-300px)]">
            <CardContent className="p-0 h-full">
              <GLBViewer
                glbUrl={selectedModel}
                autoRotate={true}
                showShadows={true}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : models.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Box className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No 3D Models Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Convert your venue images to 3D models in the AI Studio
                </p>
                <Link href="/ai-studio">
                  <Button>
                    Go to AI Studio
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model) => (
                <Card
                  key={model.id}
                  className="cursor-pointer hover:ring-2 ring-primary transition-all"
                  onClick={() => setSelectedModel(model.glbUrl)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                      {model.thumbnail ? (
                        <img
                          src={model.thumbnail}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Box className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium truncate">{model.name || 'Untitled Model'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(model.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

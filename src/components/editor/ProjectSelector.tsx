'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, FolderOpen, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ProjectImage {
  id: string
  url: string
  name: string | null
}

interface Project {
  id: string
  name: string
  thumbnail: string | null
  currentImageUrl: string | null
  images?: ProjectImage[]
  updatedAt: string
}

interface ProjectSelectorProps {
  onSelect: (projectId: string, imageUrl?: string) => void
}

export function ProjectSelector({ onSelect }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Select a Project
        </CardTitle>
        <CardDescription>
          Choose a project to start editing images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No projects found</p>
            <p className="text-sm mt-2">Create a project from the Projects page first</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  const imageUrl = project.currentImageUrl || project.images?.[0]?.url || undefined
                  onSelect(project.id, imageUrl)
                }}
                className="group relative bg-card border-2 rounded-xl overflow-hidden hover:border-primary hover:shadow-md transition-all text-left"
              >
                <div className="aspect-video bg-muted relative">
                  {project.thumbnail || project.currentImageUrl || project.images?.[0]?.url ? (
                    <img
                      src={project.thumbnail || project.currentImageUrl || project.images?.[0]?.url || ''}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium text-sm px-3 py-1.5 bg-primary rounded-full">
                      Open Project
                    </span>
                  </div>
                </div>
                <div className="p-3 border-t">
                  <h3 className="font-medium truncate">{project.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Filter, MoreHorizontal, Loader2, Trash2, Edit } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateProjectModal } from "@/components/editor/CreateProjectModal"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  updatedAt: string
  venue: {
    name: string
  } | null
  _count: {
    items: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/projects?limit=50")
      if (!response.ok) throw new Error("Failed to fetch projects")

      const result = await response.json()
      setProjects(result.projects)
    } catch (err) {
      setError("Failed to load projects")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete project")

      setProjects(projects.filter(p => p.id !== projectId))
    } catch (err) {
      console.error(err)
      alert("Failed to delete project")
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Draft",
      ACTIVE: "In Progress",
      REVIEW: "In Review",
      COMPLETED: "Completed",
      ARCHIVED: "Archived"
    }
    return labels[status] || status
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.venue?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchProjects}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your wedding designs.
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5" />
          New Project
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No projects match your search." : "No projects yet. Create your first project to get started!"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-0 ring-1 ring-border/50 hover:ring-primary/50">
                <Link href={`/projects/${project.id}/edit`}>
                  <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl font-bold text-primary/20">
                        {project.name.charAt(0)}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 z-20">
                      <span className="px-2 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-medium text-foreground border">
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                  </div>
                </Link>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/projects/${project.id}/edit`} className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </h3>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 -mr-2">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(project.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {project.venue?.name || "No venue selected"}
                  </p>
                  <div className="mt-4 text-xs text-muted-foreground flex items-center justify-between">
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    <span>{project._count.items} items</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchProjects()
        }}
      />
    </div>
  )
}

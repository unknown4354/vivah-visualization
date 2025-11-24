"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowRight, Clock, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

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

interface DashboardData {
  projects: Project[]
  stats: {
    activeProjects: number
    totalDesigns: number
    totalItems: number
  }
}

export default function DashboardPage() {
  const session = useSession()?.data
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/projects?limit=3")
        if (!response.ok) throw new Error("Failed to fetch projects")

        const result = await response.json()

        // Calculate stats
        const activeProjects = result.projects.filter(
          (p: Project) => p.status === "ACTIVE" || p.status === "DRAFT"
        ).length
        const totalItems = result.projects.reduce(
          (sum: number, p: Project) => sum + p._count.items, 0
        )

        setData({
          projects: result.projects,
          stats: {
            activeProjects,
            totalDesigns: result.pagination.total,
            totalItems
          }
        })
      } catch (err) {
        setError("Failed to load dashboard data")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const stats = data ? [
    { label: "Active Projects", value: data.stats.activeProjects.toString(), change: "Currently in progress" },
    { label: "Total Designs", value: data.stats.totalDesigns.toString(), change: "All time" },
    { label: "Total Items", value: data.stats.totalItems.toString(), change: "Across all projects" }
  ] : []

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
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}! Here's what's happening with your projects.
          </p>
        </div>
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" asChild>
          <Link href="/projects">
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Projects</h2>
          <Button variant="ghost" className="gap-2" asChild>
            <Link href="/projects">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {data?.projects.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No projects yet. Create your first project to get started!</p>
            <Button asChild>
              <Link href="/projects">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Link href={`/projects/${project.id}/edit`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer border-0 ring-1 ring-border">
                    <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary/20">
                          {project.name.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 z-20">
                        <span className="px-2 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-medium text-foreground border">
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {project.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {project.venue.name}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Updated {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

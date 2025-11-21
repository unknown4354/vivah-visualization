"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, ArrowRight, Clock, MapPin } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const recentProjects = [
  {
    id: "1",
    name: "Sharma-Patel Wedding",
    venue: "The Leela Palace, Udaipur",
    date: "2024-12-15",
    status: "In Progress",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0202128?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "2",
    name: "Kapoor Sangeet",
    venue: "Taj Lands End, Mumbai",
    date: "2024-11-20",
    status: "Completed",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: "3",
    name: "Mehra Reception",
    venue: "Hyatt Regency, Delhi",
    date: "2025-01-10",
    status: "Draft",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1000&auto=format&fit=crop"
  }
]

const stats = [
  { label: "Active Projects", value: "12", change: "+2 this month" },
  { label: "Total Designs", value: "48", change: "+8 this month" },
  { label: "Client Views", value: "1.2k", change: "+15% vs last month" }
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, here's what's happening with your projects.
          </p>
        </div>
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" />
          New Project
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer border-0 ring-1 ring-border">
                <div className="aspect-video relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img
                    src={project.image}
                    alt={project.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 z-20">
                    <span className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                      {project.status}
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {project.venue}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Updated {project.date}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

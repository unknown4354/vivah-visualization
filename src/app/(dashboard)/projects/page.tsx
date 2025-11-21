"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react"
import { motion } from "framer-motion"

const projects = [
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
    },
    {
        id: "4",
        name: "Singh Anniversary",
        venue: "Oberoi Udaivilas",
        date: "2025-02-14",
        status: "In Progress",
        image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000&auto=format&fit=crop"
    }
]

export default function ProjectsPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and organize your wedding designs.
                    </p>
                </div>
                <Button size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    New Project
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search projects..." className="pl-9" />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project, i) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-0 ring-1 ring-border/50 hover:ring-primary/50">
                            <div className="aspect-[4/3] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
                                <img
                                    src={project.image}
                                    alt={project.name}
                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-3 left-3 z-20">
                                    <span className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                                        {project.status}
                                    </span>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                    {project.venue}
                                </p>
                                <div className="mt-4 text-xs text-muted-foreground flex items-center justify-between">
                                    <span>{project.date}</span>
                                    <span className="text-primary font-medium">View Details</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

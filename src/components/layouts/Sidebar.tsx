"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    PlusCircle,
    Settings,
    LogOut,
    FolderOpen,
    Palette,
    Wand2,
    Box,
    Image
} from "lucide-react"

const navItems = [
    {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard
    },
    {
        title: "Projects",
        href: "/projects",
        icon: FolderOpen
    },
    {
        title: "AI Studio",
        href: "/ai-studio",
        icon: Wand2
    },
    {
        title: "3D Gallery",
        href: "/3d-gallery",
        icon: Box
    },
    {
        title: "Design Library",
        href: "/library",
        icon: Palette
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings
    }
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden lg:flex flex-col w-64 border-r bg-card/50 backdrop-blur-xl h-screen sticky top-0">
            <div className="p-6 border-b">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-xl">V</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">Vivah</span>
                </Link>
            </div>

            <div className="flex-1 py-6 px-4 space-y-6">
                <div className="space-y-1">
                    <Button className="w-full justify-start gap-2 mb-6" size="lg" variant="neon">
                        <PlusCircle className="w-5 h-5" />
                        New Project
                    </Button>

                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <span
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                        pathname === item.href
                                            ? "bg-secondary text-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.title}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="p-4 border-t">
                <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Button>
            </div>
        </aside>
    )
}

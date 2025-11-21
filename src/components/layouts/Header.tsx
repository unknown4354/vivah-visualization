"use client"

import * as React from "react"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
    return (
        <header className="h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4 w-full max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-9 bg-muted/50 border-none focus:bg-background transition-colors"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                </Button>

                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-secondary ring-2 ring-background cursor-pointer" />
            </div>
        </header>
    )
}

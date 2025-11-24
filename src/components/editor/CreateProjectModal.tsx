"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateProjectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function CreateProjectModal({ open, onOpenChange, onSuccess }: CreateProjectModalProps) {
    const router = useRouter()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [eventDate, setEventDate] = useState("")
    const [guestCount, setGuestCount] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!name.trim()) {
            setError("Project name is required")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    eventDate: eventDate || undefined,
                    guestCount: guestCount ? parseInt(guestCount) : undefined,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to create project")
            }

            const project = await response.json()

            // Reset form
            setName("")
            setDescription("")
            setEventDate("")
            setGuestCount("")

            // Call success callback
            if (onSuccess) {
                onSuccess()
            }

            // Navigate to the new project's editor
            router.push(`/projects/${project.id}/edit`)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create project")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = (isOpen: boolean) => {
        if (!isLoading) {
            onOpenChange(isOpen)
            if (!isOpen) {
                setName("")
                setDescription("")
                setEventDate("")
                setGuestCount("")
                setError("")
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Project</DialogTitle>
                        <DialogDescription>
                            Start a new wedding visualization project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name *
                            </Label>
                            <Input
                                id="name"
                                placeholder="Sharma-Patel Wedding"
                                className="col-span-3"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="description"
                                placeholder="Optional description"
                                className="col-span-3"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Event Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                className="col-span-3"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="guests" className="text-right">
                                Guests
                            </Label>
                            <Input
                                id="guests"
                                type="number"
                                placeholder="150"
                                className="col-span-3"
                                value={guestCount}
                                onChange={(e) => setGuestCount(e.target.value)}
                                disabled={isLoading}
                                min="1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleClose(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

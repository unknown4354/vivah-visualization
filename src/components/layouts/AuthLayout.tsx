import * as React from "react"
import { motion } from "framer-motion"

interface AuthLayoutProps {
    children: React.ReactNode
    title: string
    subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-dvh w-full grid lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 bg-background relative min-h-dvh lg:min-h-0">
                <div className="w-full max-w-[360px] sm:max-w-[400px] space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-2 text-center lg:text-left"
                    >
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">{title}</h1>
                        <p className="text-muted-foreground text-sm">{subtitle}</p>
                    </motion.div>
                    {children}
                </div>
            </div>

            {/* Right Side - Visual */}
            <div className="hidden lg:flex relative bg-muted items-center justify-center overflow-hidden h-full">
                <div className="absolute inset-0 bg-zinc-900/10" />
                <img
                    src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop"
                    alt="Dream Wedding Setup"
                    className="absolute inset-0 w-full h-full object-cover grayscale opacity-90"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 p-12 max-w-lg text-white space-y-6"
                >
                    <blockquote className="text-2xl font-medium leading-relaxed">
                        "Design is not just what it looks like and feels like. Design is how it works."
                    </blockquote>
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="h-px w-8 bg-white" />
                        <span className="text-sm uppercase tracking-widest">Vivah Visualization</span>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

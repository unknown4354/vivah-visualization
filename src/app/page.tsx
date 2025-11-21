"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WeddingRings } from "@/components/ui/wedding-rings"
import { Spotlight } from "@/components/ui/spotlight"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-dvh w-full bg-black text-white">
      {/* Hero Section - Full Screen Immersive */}
      <div className="relative min-h-dvh w-full overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 md:p-8"
        >
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-white/60" />
            <span className="text-sm font-light uppercase tracking-[0.3em] text-white/80">
              Vivah
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-white text-black hover:bg-white/90"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </motion.nav>

        {/* Content Grid */}
        <div className="relative z-10 flex h-dvh">
          {/* Left Content */}
          <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-xl space-y-8"
            >
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1]">
                  <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                    Design Your
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                    Dream Wedding
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-neutral-400 font-light leading-relaxed max-w-md">
                  Transform your vision into reality with intelligent 3D visualization.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 px-8"
                  >
                    Start Creating
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {/* Subtle Features */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="pt-12 flex items-center gap-8 text-sm text-neutral-500"
              >
                <span>3D Visualization</span>
                <span className="h-1 w-1 rounded-full bg-neutral-600" />
                <span>AI-Powered</span>
                <span className="h-1 w-1 rounded-full bg-neutral-600" />
                <span>Real-time</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right - 3D Scene */}
          <div className="hidden lg:block flex-1 relative">
            <WeddingRings className="w-full h-full" />
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-neutral-600"
        >
          <span>&copy; 2024 Vivah Visualization</span>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-neutral-400 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-neutral-400 transition-colors">
              Terms
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

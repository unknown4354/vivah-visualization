"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Palette, Share2, Play } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-dvh w-full">
      {/* Hero Section - Matching Auth Layout */}
      <div className="min-h-dvh w-full grid lg:grid-cols-2">
        {/* Left Side - Content */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 bg-background relative min-h-dvh lg:min-h-0">
          {/* Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-6 left-6 right-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="h-px w-6 bg-primary" />
              <span className="text-sm font-medium uppercase tracking-widest">Vivah</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.nav>

          <div className="w-full max-w-[480px] space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI-Powered Wedding Design</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-tight">
                Design Your Dream Wedding
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg max-w-md">
                Transform your vision into reality with our intelligent 3D visualization platform. Create, customize, and share stunning wedding designs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register" className="flex-1">
                <Button className="w-full" size="lg">
                  Start Creating
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pt-8 border-t border-border"
            >
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">3D Design</p>
                  <p className="text-xs text-muted-foreground">Visual editor</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">AI Assist</p>
                  <p className="text-xs text-muted-foreground">Smart suggestions</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Share</p>
                  <p className="text-xs text-muted-foreground">Collaborate</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-muted-foreground"
          >
            <span>&copy; 2024 Vivah Visualization</span>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex relative bg-muted items-center justify-center overflow-hidden h-full">
          <div className="absolute inset-0 bg-zinc-900/10" />
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop"
            alt="Beautiful Wedding Setup"
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
              "Every love story is unique. Your wedding design should be too."
            </blockquote>
            <div className="flex items-center gap-2 opacity-80">
              <div className="h-px w-8 bg-white" />
              <span className="text-sm uppercase tracking-widest">Vivah Visualization</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From concept to reality, our platform provides all the tools to bring your wedding vision to life.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-lg bg-background border border-border space-y-4"
              >
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
            Ready to Start Designing?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of couples who have brought their wedding dreams to life with Vivah Visualization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 sm:px-8 lg:px-12 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-px w-6 bg-primary" />
            <span className="text-sm font-medium uppercase tracking-widest">Vivah Visualization</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <span className="text-sm text-muted-foreground">&copy; 2024 Vivah</span>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Palette,
    title: "3D Visualization",
    description: "Create stunning 3D models of your wedding venue with our intuitive drag-and-drop editor."
  },
  {
    icon: Sparkles,
    title: "AI Suggestions",
    description: "Get intelligent design recommendations based on your style preferences and budget."
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description: "Share your designs with vendors, planners, and family members for instant feedback."
  },
  {
    icon: ArrowRight,
    title: "Export & Print",
    description: "Export high-quality images and PDFs to share with your vendors and venue."
  },
  {
    icon: Play,
    title: "Virtual Walkthrough",
    description: "Experience your wedding design in immersive 3D before the big day."
  },
  {
    icon: Sparkles,
    title: "Template Library",
    description: "Start with professionally designed templates and customize to your taste."
  }
]

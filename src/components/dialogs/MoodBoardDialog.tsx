'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Loader2,
  Download,
  RefreshCw,
  X,
  Image as ImageIcon
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MoodBoardDialogProps {
  projectId?: string
  trigger?: React.ReactNode
}

const STYLE_OPTIONS = [
  { id: 'modern', label: 'Modern', emoji: '✨' },
  { id: 'traditional', label: 'Traditional', emoji: '🏛️' },
  { id: 'rustic', label: 'Rustic', emoji: '🌾' },
  { id: 'bohemian', label: 'Bohemian', emoji: '🌸' },
  { id: 'luxury', label: 'Luxury', emoji: '💎' },
  { id: 'royal', label: 'Royal', emoji: '👑' }
]

export function MoodBoardDialog({ projectId, trigger }: MoodBoardDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('modern')
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState('')
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description')
      return
    }

    setLoading(true)
    setError('')
    setImages([])

    try {
      const res = await fetch('/api/ai/mood-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style,
          count: 4,
          projectId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Generation failed')
        return
      }

      setImages(data.images)
      setCreditsRemaining(data.creditsRemaining)
    } catch (err) {
      setError('Failed to generate images. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mood-board-${index + 1}.webp`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Mood Board
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            AI Mood Board Generator
          </DialogTitle>
          <DialogDescription>
            Describe your vision and we'll generate inspiring wedding decoration ideas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your vision</Label>
            <Input
              id="prompt"
              placeholder="e.g., Elegant outdoor garden wedding with white and gold accents, floral arches, and fairy lights"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setStyle(option.id)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    style === option.id
                      ? 'border-foreground bg-secondary text-foreground'
                      : 'border-border text-foreground hover:border-foreground/50'
                  }`}
                >
                  <span className="mr-2">{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Mood Board
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Generated Images</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {images.map((url, index) => (
                    <motion.div
                      key={url}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group rounded-lg overflow-hidden border"
                    >
                      <img
                        src={url}
                        alt={`Mood board ${index + 1}`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownload(url, index)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {creditsRemaining !== null && (
                  <p className="text-sm text-muted-foreground text-center">
                    {creditsRemaining} AI generations remaining
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

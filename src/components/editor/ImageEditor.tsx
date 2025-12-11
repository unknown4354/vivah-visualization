'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Loader2, Wand2, Target, Box, Undo, Download, ZoomIn, ZoomOut, RotateCcw, Check, ArrowLeft, Paintbrush, Eraser, Sun, History, Settings2 } from 'lucide-react'
import { ResultsGrid } from './ResultsGrid'
import { HistoryTimeline } from './HistoryTimeline'
import { PostProcessPanel, PostProcessSettings, defaultPostProcessSettings } from './PostProcessPanel'

interface ImageEditorProps {
  imageUrl: string
  projectId?: string
  onSave?: (editedImageUrl: string) => void
  onConvertTo3D?: (glbUrl: string) => void
  onBack?: () => void
}

interface EditHistory {
  id: string
  imageUrl: string
  prompt: string
  mode: 'quick' | 'precise' | 'lighting'
  timestamp: Date
  isChosen: boolean
  iterationGroup?: string
}

interface GenerationResult {
  imageUrl: string
  prompt: string
  enhancedPrompt: string
}

// Helper to convert image URL (including blob URLs) to base64
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function ImageEditor({ imageUrl, projectId, onSave, onConvertTo3D, onBack }: ImageEditorProps) {
  const [currentImage, setCurrentImage] = useState(imageUrl)
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editHistory, setEditHistory] = useState<EditHistory[]>([])
  const [strength, setStrength] = useState([0.85])
  const [maskUrl, setMaskUrl] = useState<string | null>(null)
  const [isDrawingMask, setIsDrawingMask] = useState(false)
  const [points, setPoints] = useState<{ x: number; y: number }[]>([])
  const [zoom, setZoom] = useState(1)
  const [activeTab, setActiveTab] = useState<'quick' | 'precise' | 'lighting' | '3d'>('quick')
  const [brushSize, setBrushSize] = useState([30])
  const [brushMode, setBrushMode] = useState<'draw' | 'erase'>('draw')
  const [isDrawing, setIsDrawing] = useState(false)
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // New state for enhanced features
  const [iterations, setIterations] = useState([1])
  const [enhancePrompt, setEnhancePrompt] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showPostProcess, setShowPostProcess] = useState(false)
  const [postProcessSettings, setPostProcessSettings] = useState<PostProcessSettings>(defaultPostProcessSettings)
  const [generationResults, setGenerationResults] = useState<GenerationResult[]>([])
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [useComposite, setUseComposite] = useState(true) // Composite vs raw output

  // Initialize canvas when entering drawing mode
  useEffect(() => {
    if (isDrawingMask && canvasRef.current && maskCanvasRef.current) {
      const canvas = canvasRef.current
      const maskCanvas = maskCanvasRef.current
      const ctx = canvas.getContext('2d')
      const maskCtx = maskCanvas.getContext('2d')

      // Load image into canvas
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        maskCanvas.width = img.naturalWidth
        maskCanvas.height = img.naturalHeight
        setLoadedImage(img) // Cache the loaded image
        if (ctx) {
          ctx.drawImage(img, 0, 0)
        }
        if (maskCtx) {
          // Initialize mask as black (areas not to edit)
          // White areas will be edited
          maskCtx.fillStyle = '#000000'
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
        }
      }
      img.src = currentImage
    } else {
      setLoadedImage(null)
    }
  }, [isDrawingMask, currentImage])

  // Drawing functions for brush-based mask
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMask || !loadedImage) return
    setIsDrawing(true)
    // Draw immediately on click
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas) return

    const ctx = canvas.getContext('2d')
    const maskCtx = maskCanvas.getContext('2d')

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (maskCtx) {
      maskCtx.fillStyle = brushMode === 'draw' ? '#ffffff' : '#000000'
      maskCtx.beginPath()
      maskCtx.arc(x, y, brushSize[0], 0, Math.PI * 2)
      maskCtx.fill()
    }

    // Redraw canvas with overlay
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height)

      // Draw red overlay only on white (painted) areas of mask
      const imageData = maskCtx?.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
      if (imageData) {
        const overlayCanvas = document.createElement('canvas')
        overlayCanvas.width = maskCanvas.width
        overlayCanvas.height = maskCanvas.height
        const overlayCtx = overlayCanvas.getContext('2d')
        if (overlayCtx) {
          const overlayData = overlayCtx.createImageData(maskCanvas.width, maskCanvas.height)
          for (let i = 0; i < imageData.data.length; i += 4) {
            // If pixel is white (painted area)
            if (imageData.data[i] > 128) {
              overlayData.data[i] = 255     // R
              overlayData.data[i + 1] = 0   // G
              overlayData.data[i + 2] = 0   // B
              overlayData.data[i + 3] = 100 // A (semi-transparent)
            }
          }
          overlayCtx.putImageData(overlayData, 0, 0)
          ctx.drawImage(overlayCanvas, 0, 0)
        }
      }
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMask || !maskCanvasRef.current || !canvasRef.current || !loadedImage) return

    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    const ctx = canvas.getContext('2d')
    const maskCtx = maskCanvas.getContext('2d')

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (maskCtx) {
      maskCtx.globalCompositeOperation = 'source-over'
      maskCtx.fillStyle = brushMode === 'draw' ? '#ffffff' : '#000000'
      maskCtx.beginPath()
      maskCtx.arc(x, y, brushSize[0], 0, Math.PI * 2)
      maskCtx.fill()
    }

    // Show overlay on main canvas
    if (ctx) {
      // Clear and redraw image
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height)

      // Draw red overlay only on white (painted) areas of mask
      const imageData = maskCtx?.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
      if (imageData) {
        const overlayCanvas = document.createElement('canvas')
        overlayCanvas.width = maskCanvas.width
        overlayCanvas.height = maskCanvas.height
        const overlayCtx = overlayCanvas.getContext('2d')
        if (overlayCtx) {
          const overlayData = overlayCtx.createImageData(maskCanvas.width, maskCanvas.height)
          for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 128) {
              overlayData.data[i] = 255
              overlayData.data[i + 1] = 0
              overlayData.data[i + 2] = 0
              overlayData.data[i + 3] = 100
            }
          }
          overlayCtx.putImageData(overlayData, 0, 0)
          ctx.drawImage(overlayCanvas, 0, 0)
        }
      }
    }
  }

  const generateMaskFromCanvas = async (): Promise<string | null> => {
    if (!maskCanvasRef.current) return null
    return maskCanvasRef.current.toDataURL('image/png')
  }

  const handleQuickEdit = async () => {
    if (!prompt.trim()) return
    setIsLoading(true)
    try {
      const response = await fetch(currentImage)
      const blob = await response.blob()
      const base64 = await blobToBase64(blob)
      const mimeType = blob.type || 'image/png'

      // Build post-process options
      const postProcess: Record<string, unknown> = {}
      if (postProcessSettings.autoEnhance) postProcess.autoEnhance = true
      if (postProcessSettings.colorCorrection.enabled) {
        postProcess.colorCorrection = {
          saturation: postProcessSettings.colorCorrection.saturation,
          brightness: postProcessSettings.colorCorrection.brightness,
          contrast: postProcessSettings.colorCorrection.contrast
        }
      }
      if (postProcessSettings.sharpen.enabled) {
        postProcess.sharpen = postProcessSettings.sharpen.strength
      }
      if (postProcessSettings.upscale.enabled) {
        postProcess.upscale = postProcessSettings.upscale.scale
      }

      const res = await fetch('/api/ai/edit/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64.split(',')[1],
          mimeType,
          prompt,
          projectId,
          iterations: iterations[0],
          enhancePrompt,
          parentGenerationId: currentEntryId || undefined,
          postProcess: Object.keys(postProcess).length > 0 ? postProcess : undefined
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Edit failed')
      }

      const data = await res.json()

      // Handle multiple results
      if (data.results && data.results.length > 0) {
        setGenerationResults(data.results)
        setSelectedResultIndex(0)

        // Add all results to history
        const newEntries: EditHistory[] = data.results.map((result: GenerationResult, index: number) => ({
          id: crypto.randomUUID(),
          imageUrl: result.imageUrl,
          prompt: result.prompt,
          mode: 'quick' as const,
          timestamp: new Date(),
          isChosen: index === 0,
          iterationGroup: data.iterationGroup
        }))

        setEditHistory(prev => [...prev, ...newEntries])
        setCurrentImage(data.results[0].imageUrl)
        setCurrentEntryId(newEntries[0].id)
      } else {
        // Backward compatibility
        const newEntry: EditHistory = {
          id: crypto.randomUUID(),
          imageUrl: data.imageUrl,
          prompt,
          mode: 'quick',
          timestamp: new Date(),
          isChosen: true
        }
        setEditHistory(prev => [...prev, newEntry])
        setCurrentImage(data.imageUrl)
        setCurrentEntryId(newEntry.id)
      }

      setPrompt('')
    } catch (error) {
      console.error('Quick edit error:', error)
      alert(error instanceof Error ? error.message : 'Edit failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreciseEdit = async () => {
    if (!prompt.trim()) {
      alert('Please enter an edit prompt')
      return
    }

    // Generate mask from canvas
    const maskDataUrl = await generateMaskFromCanvas()
    if (!maskDataUrl) {
      alert('Please draw a mask on the image first')
      return
    }

    setIsLoading(true)
    try {
      // Convert image to base64 (in case it's a blob URL)
      const imageResponse = await fetch(currentImage)
      const imageBlob = await imageResponse.blob()
      const imageBase64 = await blobToBase64(imageBlob)

      // Convert mask to base64
      const maskBlob = await (await fetch(maskDataUrl)).blob()
      const maskBase64 = await blobToBase64(maskBlob)

      // Build post-process options
      const postProcess: Record<string, unknown> = {}
      if (postProcessSettings.autoEnhance) postProcess.autoEnhance = true
      if (postProcessSettings.colorCorrection.enabled) {
        postProcess.colorCorrection = {
          saturation: postProcessSettings.colorCorrection.saturation,
          brightness: postProcessSettings.colorCorrection.brightness,
          contrast: postProcessSettings.colorCorrection.contrast
        }
      }
      if (postProcessSettings.sharpen.enabled) {
        postProcess.sharpen = postProcessSettings.sharpen.strength
      }
      if (postProcessSettings.upscale.enabled) {
        postProcess.upscale = postProcessSettings.upscale.scale
      }

      const res = await fetch('/api/ai/edit/precise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64.split(',')[1],
          maskBase64: maskBase64.split(',')[1],
          prompt,
          strength: strength[0],
          projectId,
          iterations: iterations[0],
          enhancePrompt,
          useComposite,
          parentGenerationId: currentEntryId || undefined,
          postProcess: Object.keys(postProcess).length > 0 ? postProcess : undefined
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Edit failed')
      }

      const data = await res.json()

      // Handle multiple results
      if (data.results && data.results.length > 0) {
        setGenerationResults(data.results)
        setSelectedResultIndex(0)

        // Add all results to history
        const newEntries: EditHistory[] = data.results.map((result: GenerationResult, index: number) => ({
          id: crypto.randomUUID(),
          imageUrl: result.imageUrl,
          prompt: result.prompt,
          mode: 'precise' as const,
          timestamp: new Date(),
          isChosen: index === 0,
          iterationGroup: data.iterationGroup
        }))

        setEditHistory(prev => [...prev, ...newEntries])
        setCurrentImage(data.results[0].imageUrl)
        setCurrentEntryId(newEntries[0].id)
      } else {
        // Backward compatibility
        const newEntry: EditHistory = {
          id: crypto.randomUUID(),
          imageUrl: data.imageUrl,
          prompt,
          mode: 'precise',
          timestamp: new Date(),
          isChosen: true
        }
        setEditHistory(prev => [...prev, newEntry])
        setCurrentImage(data.imageUrl)
        setCurrentEntryId(newEntry.id)
      }

      setIsDrawingMask(false)
      setPrompt('')
    } catch (error) {
      console.error('Precise edit error:', error)
      alert(error instanceof Error ? error.message : 'Edit failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLightingEdit = async () => {
    if (!prompt.trim()) return
    setIsLoading(true)
    try {
      // Convert image to base64 (handles blob URLs)
      const imageBase64 = await imageUrlToBase64(currentImage)

      // Build post-process options
      const postProcess: Record<string, unknown> = {}
      if (postProcessSettings.autoEnhance) postProcess.autoEnhance = true
      if (postProcessSettings.colorCorrection.enabled) {
        postProcess.colorCorrection = {
          saturation: postProcessSettings.colorCorrection.saturation,
          brightness: postProcessSettings.colorCorrection.brightness,
          contrast: postProcessSettings.colorCorrection.contrast
        }
      }
      if (postProcessSettings.sharpen.enabled) {
        postProcess.sharpen = postProcessSettings.sharpen.strength
      }
      if (postProcessSettings.upscale.enabled) {
        postProcess.upscale = postProcessSettings.upscale.scale
      }

      const res = await fetch('/api/ai/edit/lighting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          prompt,
          projectId,
          iterations: iterations[0],
          enhancePrompt,
          parentGenerationId: currentEntryId || undefined,
          postProcess: Object.keys(postProcess).length > 0 ? postProcess : undefined
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Edit failed')
      }

      const data = await res.json()

      // Handle multiple results
      if (data.results && data.results.length > 0) {
        setGenerationResults(data.results)
        setSelectedResultIndex(0)

        // Add all results to history
        const newEntries: EditHistory[] = data.results.map((result: GenerationResult, index: number) => ({
          id: crypto.randomUUID(),
          imageUrl: result.imageUrl,
          prompt: result.prompt,
          mode: 'lighting' as const,
          timestamp: new Date(),
          isChosen: index === 0,
          iterationGroup: data.iterationGroup
        }))

        setEditHistory(prev => [...prev, ...newEntries])
        setCurrentImage(data.results[0].imageUrl)
        setCurrentEntryId(newEntries[0].id)
      }

      setPrompt('')
    } catch (error) {
      console.error('Lighting edit error:', error)
      alert(error instanceof Error ? error.message : 'Edit failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle selecting a result from the results grid
  const handleSelectResult = (index: number) => {
    setSelectedResultIndex(index)
    if (generationResults[index]) {
      setCurrentImage(generationResults[index].imageUrl)
      // Update which entry is chosen in history
      setEditHistory(prev =>
        prev.map(entry => ({
          ...entry,
          isChosen: entry.imageUrl === generationResults[index].imageUrl
        }))
      )
    }
  }

  // Handle going back in history
  const handleGoBackTo = (entryId: string) => {
    const entry = editHistory.find(e => e.id === entryId)
    if (entry) {
      setCurrentImage(entry.imageUrl)
      setCurrentEntryId(entryId)
      setGenerationResults([])
    }
  }

  // Handle branching from a history point
  const handleBranch = (entryId: string) => {
    const entry = editHistory.find(e => e.id === entryId)
    if (entry) {
      setCurrentImage(entry.imageUrl)
      setCurrentEntryId(entryId)
      setGenerationResults([])
    }
  }

  const handleConvertTo3DClick = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/ai/image-to-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: currentImage,
          removeBackground: true,
          projectId
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '3D conversion failed')
      }

      const data = await res.json()
      onConvertTo3D?.(data.glbUrl)
    } catch (error) {
      console.error('3D conversion error:', error)
      alert(error instanceof Error ? error.message : '3D conversion failed')
    } finally {
      setIsLoading(false)
    }
  }

  const clearMask = () => {
    if (maskCanvasRef.current && canvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d')
      const ctx = canvasRef.current.getContext('2d')
      if (maskCtx) {
        maskCtx.fillStyle = '#000000'
        maskCtx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
      }
      // Redraw image without overlay
      if (ctx && imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  const handleUndo = () => {
    if (editHistory.length === 0) return

    // Remove the last entry
    const newHistory = editHistory.slice(0, -1)
    setEditHistory(newHistory)

    // Set image to the previous entry, or original if no history left
    if (newHistory.length > 0) {
      const previousEntry = newHistory[newHistory.length - 1]
      setCurrentImage(previousEntry.imageUrl)
      setCurrentEntryId(previousEntry.id)
    } else {
      setCurrentImage(imageUrl) // Go back to original image
      setCurrentEntryId(null)
    }
    setGenerationResults([])
  }

  const handleDownload = async () => {
    const response = await fetch(currentImage)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edited-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full bg-background">
      {/* Main Image Area - Takes most space */}
      <div className="flex-1 flex flex-col">
        {/* Top toolbar */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {editHistory.length > 0 ? `${editHistory.length} edits` : 'Original'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(z => Math.min(4, z + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleUndo} disabled={editHistory.length === 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex-1 relative overflow-auto bg-neutral-900 flex items-center justify-center">
          {isDrawingMask ? (
            <>
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="cursor-crosshair"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
              {/* Hidden mask canvas */}
              <canvas ref={maskCanvasRef} className="hidden" />
            </>
          ) : (
            <img
              ref={imageRef}
              src={currentImage}
              alt="Edit preview"
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement
                if (canvasRef.current) {
                  canvasRef.current.width = img.naturalWidth
                  canvasRef.current.height = img.naturalHeight
                }
              }}
            />
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <p className="text-sm text-white">Processing...</p>
              </div>
            </div>
          )}

          {isDrawingMask && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              Paint areas to edit • {brushMode === 'draw' ? 'Drawing' : 'Erasing'}
            </div>
          )}
        </div>
      </div>

      {/* Right Side Panel - Vertical tabs */}
      <div className="w-80 border-l flex flex-col bg-background">
        {/* Tab buttons */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-3 px-1 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'quick' ? 'bg-secondary text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Wand2 className="h-4 w-4" />
            Quick
          </button>
          <button
            onClick={() => setActiveTab('precise')}
            className={`flex-1 py-3 px-1 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'precise' ? 'bg-secondary text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Target className="h-4 w-4" />
            Precise
          </button>
          <button
            onClick={() => setActiveTab('lighting')}
            className={`flex-1 py-3 px-1 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'lighting' ? 'bg-secondary text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex-1 py-3 px-1 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
              activeTab === '3d' ? 'bg-secondary text-foreground border-b-2 border-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Box className="h-4 w-4" />
            3D
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {activeTab === 'quick' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Quick Edit</h3>
                  <p className="text-xs text-muted-foreground">
                    Describe what you want to change using natural language.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-prompt" className="text-sm">Edit Prompt</Label>
                  <Input
                    id="quick-prompt"
                    placeholder="Add fairy lights to ceiling..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickEdit()}
                  />
                </div>

                {/* Iterations slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Variations</Label>
                    <span className="text-xs text-muted-foreground">{iterations[0]}</span>
                  </div>
                  <Slider
                    value={iterations}
                    onValueChange={setIterations}
                    min={1}
                    max={4}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Generate {iterations[0]} variation{iterations[0] > 1 ? 's' : ''} • {iterations[0]} credit{iterations[0] > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Toggle buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={enhancePrompt ? 'secondary' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setEnhancePrompt(!enhancePrompt)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Auto-enhance
                  </Button>
                  <Button
                    variant={showPostProcess ? 'secondary' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowPostProcess(!showPostProcess)}
                  >
                    <Settings2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Post-processing panel */}
                {showPostProcess && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <PostProcessPanel
                      settings={postProcessSettings}
                      onChange={setPostProcessSettings}
                    />
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleQuickEdit}
                  disabled={isLoading || !prompt.trim()}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Apply Edit
                </Button>

                {/* Results grid */}
                {generationResults.length > 1 && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm mb-2 block">Select Result</Label>
                    <ResultsGrid
                      results={generationResults}
                      onSelect={handleSelectResult}
                      selectedIndex={selectedResultIndex}
                    />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {['Add flowers', 'Change lighting', 'Add candles', 'More elegant'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'precise' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Precise Edit</h3>
                  <p className="text-xs text-muted-foreground">
                    Paint over areas you want to edit, then describe the change.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm">1. Paint Mask</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={isDrawingMask ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setIsDrawingMask(!isDrawingMask)
                      }}
                    >
                      {isDrawingMask ? <Check className="h-3 w-3 mr-1" /> : <Paintbrush className="h-3 w-3 mr-1" />}
                      {isDrawingMask ? 'Done' : 'Paint'}
                    </Button>
                    {isDrawingMask && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearMask}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {isDrawingMask && (
                    <>
                      <div className="flex gap-1">
                        <Button
                          variant={brushMode === 'draw' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setBrushMode('draw')}
                        >
                          <Paintbrush className="h-3 w-3 mr-1" />
                          Draw
                        </Button>
                        <Button
                          variant={brushMode === 'erase' ? 'secondary' : 'ghost'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setBrushMode('erase')}
                        >
                          <Eraser className="h-3 w-3 mr-1" />
                          Erase
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-xs">Brush Size</Label>
                          <span className="text-xs text-muted-foreground">{brushSize[0]}px</span>
                        </div>
                        <Slider
                          value={brushSize}
                          onValueChange={setBrushSize}
                          min={5}
                          max={100}
                          step={5}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">2. Edit Prompt</Label>
                  <Input
                    placeholder="Replace with red roses..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Strength</Label>
                    <span className="text-xs text-muted-foreground">{Math.round(strength[0] * 100)}%</span>
                  </div>
                  <Slider
                    value={strength}
                    onValueChange={setStrength}
                    min={0.5}
                    max={1}
                    step={0.05}
                  />
                </div>

                {/* Iterations slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Variations</Label>
                    <span className="text-xs text-muted-foreground">{iterations[0]}</span>
                  </div>
                  <Slider
                    value={iterations}
                    onValueChange={setIterations}
                    min={1}
                    max={4}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Generate {iterations[0]} variation{iterations[0] > 1 ? 's' : ''} • {iterations[0] * 2} credit{iterations[0] > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Toggle buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={enhancePrompt ? 'secondary' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setEnhancePrompt(!enhancePrompt)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Auto-enhance
                  </Button>
                  <Button
                    variant={showPostProcess ? 'secondary' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowPostProcess(!showPostProcess)}
                  >
                    <Settings2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Output mode toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Blend with original</Label>
                  <Button
                    variant={useComposite ? 'secondary' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setUseComposite(!useComposite)}
                  >
                    {useComposite ? 'Composite' : 'Raw'}
                  </Button>
                </div>

                {/* Post-processing panel */}
                {showPostProcess && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <PostProcessPanel
                      settings={postProcessSettings}
                      onChange={setPostProcessSettings}
                    />
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handlePreciseEdit}
                  disabled={isLoading || !prompt.trim()}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
                  Apply Edit
                </Button>

                {/* Results grid */}
                {generationResults.length > 1 && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm mb-2 block">Select Result</Label>
                    <ResultsGrid
                      results={generationResults}
                      onSelect={handleSelectResult}
                      selectedIndex={selectedResultIndex}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lighting' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Lighting & Theme</h3>
                  <p className="text-xs text-muted-foreground">
                    Change lighting, colors, and atmosphere without masking.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lighting-prompt" className="text-sm">Edit Prompt</Label>
                  <Input
                    id="lighting-prompt"
                    placeholder="Warm golden sunset lighting..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLightingEdit()}
                  />
                </div>

                {/* Iterations slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-sm">Variations</Label>
                    <span className="text-xs text-muted-foreground">{iterations[0]}</span>
                  </div>
                  <Slider
                    value={iterations}
                    onValueChange={setIterations}
                    min={1}
                    max={4}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Generate {iterations[0]} variation{iterations[0] > 1 ? 's' : ''} • {iterations[0]} credit{iterations[0] > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Toggle buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={enhancePrompt ? 'secondary' : 'outline'}
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setEnhancePrompt(!enhancePrompt)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Auto-enhance
                  </Button>
                  <Button
                    variant={showPostProcess ? 'secondary' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowPostProcess(!showPostProcess)}
                  >
                    <Settings2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Post-processing panel */}
                {showPostProcess && (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <PostProcessPanel
                      settings={postProcessSettings}
                      onChange={setPostProcessSettings}
                    />
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleLightingEdit}
                  disabled={isLoading || !prompt.trim()}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sun className="h-4 w-4 mr-2" />}
                  Apply Lighting
                </Button>

                {/* Results grid */}
                {generationResults.length > 1 && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm mb-2 block">Select Result</Label>
                    <ResultsGrid
                      results={generationResults}
                      onSelect={handleSelectResult}
                      selectedIndex={selectedResultIndex}
                    />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-1">
                    {['Warm golden', 'Cool blue', 'Romantic pink', 'Sunset glow', 'Candlelight'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setPrompt(`Change lighting to ${suggestion.toLowerCase()}, romantic atmosphere`)}
                        className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === '3d' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">3D Conversion</h3>
                  <p className="text-xs text-muted-foreground">
                    Convert this image into an interactive 3D model.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing time</span>
                    <span className="text-muted-foreground">10-30 sec</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Output format</span>
                    <span className="text-muted-foreground">GLB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Credits</span>
                    <span className="text-muted-foreground">5</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleConvertTo3DClick}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Box className="h-4 w-4 mr-2" />}
                  Convert to 3D
                </Button>
              </div>
            )}

            {/* Edit History */}
            {editHistory.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">History</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <History className="h-3 w-3 mr-1" />
                    {showHistory ? 'Hide' : 'Show'}
                  </Button>
                </div>
                {showHistory ? (
                  <HistoryTimeline
                    entries={editHistory}
                    currentEntryId={currentEntryId}
                    onGoBack={handleGoBackTo}
                    onBranch={handleBranch}
                  />
                ) : (
                  <div className="space-y-1">
                    {editHistory.slice(-5).reverse().map((edit) => (
                      <div key={edit.id} className="text-xs text-muted-foreground flex justify-between py-1">
                        <span className="truncate flex-1">{edit.prompt}</span>
                        <span className="ml-2 capitalize opacity-50">{edit.mode}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Loader2,
  FileImage,
  FileText,
  Box,
  Check,
  ExternalLink
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
import { Label } from '@/components/ui/label'

interface ExportDialogProps {
  projectId: string
  projectName?: string
  trigger?: React.ReactNode
}

const EXPORT_FORMATS = [
  {
    id: 'pdf',
    label: 'PDF Document',
    description: 'Floor plan, 3D views, and inventory list',
    icon: FileText,
    extension: '.pdf',
    premium: false
  },
  {
    id: 'png',
    label: 'PNG Image',
    description: 'High-resolution screenshot',
    icon: FileImage,
    extension: '.png',
    premium: false
  },
  {
    id: 'jpg',
    label: 'JPG Image',
    description: 'Compressed image format',
    icon: FileImage,
    extension: '.jpg',
    premium: false
  },
  {
    id: 'webp',
    label: 'WebP Image',
    description: 'Modern web format, smaller file size',
    icon: FileImage,
    extension: '.webp',
    premium: false
  },
  {
    id: 'glb',
    label: '3D Model (GLB)',
    description: 'Full 3D scene for use in other apps',
    icon: Box,
    extension: '.glb',
    premium: true
  }
]

const RESOLUTION_OPTIONS = [
  { id: 'hd', label: 'HD (1280x720)', width: 1280, height: 720 },
  { id: 'fhd', label: 'Full HD (1920x1080)', width: 1920, height: 1080 },
  { id: '2k', label: '2K (2560x1440)', width: 2560, height: 1440 },
  { id: '4k', label: '4K (3840x2160)', width: 3840, height: 2160, premium: true }
]

export function ExportDialog({ projectId, projectName, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('png')
  const [selectedResolution, setSelectedResolution] = useState('fhd')
  const [exportResult, setExportResult] = useState<{
    url: string
    filename: string
  } | null>(null)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setLoading(true)
    setError('')
    setExportResult(null)

    const resolution = RESOLUTION_OPTIONS.find(r => r.id === selectedResolution)

    try {
      const res = await fetch(`/api/export/${selectedFormat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          options: {
            width: resolution?.width || 1920,
            height: resolution?.height || 1080,
            quality: 90
          }
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Export failed')
        return
      }

      setExportResult({
        url: data.url,
        filename: data.filename
      })
    } catch (err) {
      setError('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isImageFormat = ['png', 'jpg', 'webp'].includes(selectedFormat)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Project
          </DialogTitle>
          <DialogDescription>
            {projectName || 'Export your project in various formats'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="space-y-2">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${
                    selectedFormat === format.id
                      ? 'border-foreground bg-secondary'
                      : 'border-border hover:border-foreground/50'
                  } ${format.premium ? 'opacity-60' : ''}`}
                  disabled={format.premium}
                >
                  <format.icon className={`w-5 h-5 mt-0.5 ${
                    selectedFormat === format.id ? 'text-foreground' : 'text-muted-foreground'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{format.label}</span>
                      {format.premium && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format.description}
                    </p>
                  </div>
                  {selectedFormat === format.id && (
                    <Check className="w-5 h-5 text-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Selection (for images) */}
          {isImageFormat && (
            <div className="space-y-3">
              <Label>Resolution</Label>
              <div className="grid grid-cols-2 gap-2">
                {RESOLUTION_OPTIONS.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedResolution(res.id)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      selectedResolution === res.id
                        ? 'border-foreground bg-secondary text-foreground'
                        : 'border-border text-foreground hover:border-foreground/50'
                    } ${res.premium ? 'opacity-60' : ''}`}
                    disabled={res.premium}
                  >
                    {res.label}
                    {res.premium && (
                      <span className="block text-xs text-yellow-600">Pro</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export as {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Result */}
          {exportResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 rounded-lg space-y-3"
            >
              <div className="flex items-center gap-2 text-green-700">
                <Check className="w-5 h-5" />
                <span className="font-medium">Export Complete!</span>
              </div>
              <p className="text-sm text-green-600">
                {exportResult.filename}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => window.open(exportResult.url, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = exportResult.url
                    link.download = exportResult.filename
                    link.click()
                  }}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              <p className="text-xs text-green-600">
                Link expires in 24 hours
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

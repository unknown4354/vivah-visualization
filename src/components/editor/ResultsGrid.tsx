'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ZoomIn, X } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ResultsGridProps {
  results: Array<{
    imageUrl: string
    prompt?: string
  }>
  onSelect: (index: number) => void
  selectedIndex?: number
}

export function ResultsGrid({ results, onSelect, selectedIndex = 0 }: ResultsGridProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)

  if (results.length === 0) return null

  if (results.length === 1) {
    return (
      <div className="relative">
        <img
          src={results[0].imageUrl}
          alt="Result"
          className="w-full rounded-lg"
        />
      </div>
    )
  }

  return (
    <>
      <div className={`grid gap-3 ${results.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {results.map((result, index) => (
          <div
            key={index}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              selectedIndex === index
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-transparent hover:border-muted-foreground/50'
            }`}
            onClick={() => onSelect(index)}
          >
            <div className="aspect-[4/3]">
              <img
                src={result.imageUrl}
                alt={`Variation ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Selection indicator */}
            {selectedIndex === index && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewIndex(index)
                }}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(index)
                }}
              >
                Use This
              </Button>
            </div>

            {/* Variation label */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Full preview modal */}
      <Dialog open={previewIndex !== null} onOpenChange={() => setPreviewIndex(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setPreviewIndex(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            {previewIndex !== null && (
              <>
                <img
                  src={results[previewIndex].imageUrl}
                  alt={`Variation ${previewIndex + 1}`}
                  className="w-full rounded-lg"
                />
                {results[previewIndex].prompt && (
                  <div className="p-4 bg-muted text-sm">
                    <strong>Prompt:</strong> {results[previewIndex].prompt}
                  </div>
                )}
                <div className="p-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPreviewIndex(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    onSelect(previewIndex)
                    setPreviewIndex(null)
                  }}>
                    Use This Variation
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

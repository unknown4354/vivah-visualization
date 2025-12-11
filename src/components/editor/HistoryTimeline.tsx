'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RotateCcw, GitBranch, Check } from 'lucide-react'

interface HistoryEntry {
  id: string
  imageUrl: string
  prompt: string
  timestamp: Date
  isChosen: boolean
  iterationGroup?: string
}

interface HistoryTimelineProps {
  entries: HistoryEntry[]
  currentEntryId: string | null
  onGoBack: (entryId: string) => void
  onBranch: (entryId: string) => void
}

export function HistoryTimeline({
  entries,
  currentEntryId,
  onGoBack,
  onBranch
}: HistoryTimelineProps) {
  // Show all entries individually instead of grouping
  // Reverse to show newest first
  const allEntries = [...entries].reverse()

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No edit history yet
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {allEntries.map((entry, index) => {
          const isCurrent = entry.id === currentEntryId

          return (
            <div
              key={entry.id}
              className={`relative pl-6 pb-4 ${
                index < allEntries.length - 1 ? 'border-l-2 border-muted ml-2' : ''
              }`}
            >
              {/* Timeline dot */}
              <div
                className={`absolute left-0 top-0 w-4 h-4 rounded-full -translate-x-1/2 ${
                  isCurrent
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                }`}
              />

              <div
                className={`bg-card border rounded-lg p-3 ${
                  isCurrent ? 'border-primary' : ''
                }`}
              >
                {/* Thumbnail */}
                <div className="relative mb-2">
                  <img
                    src={entry.imageUrl}
                    alt={entry.prompt}
                    className="w-full aspect-video object-cover rounded"
                  />
                  {isCurrent && (
                    <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Current
                    </div>
                  )}
                </div>

                {/* Prompt */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {entry.prompt}
                </p>

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </p>

                {/* Actions */}
                {!isCurrent && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => onGoBack(entry.id)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => onBranch(entry.id)}
                    >
                      <GitBranch className="w-3 h-3 mr-1" />
                      Branch
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

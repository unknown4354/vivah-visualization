'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCanvasStore } from '@/stores/canvas-store'
import { ThreeScene } from '@/components/canvas/ThreeScene'
import { Canvas2D } from '@/components/canvas/Canvas2D'
import { FurnitureLibrary } from '@/components/editor/FurnitureLibrary'
import { Button } from '@/components/ui/button'
import {
  MousePointer2,
  Move,
  RotateCw,
  Maximize2,
  Trash2,
  Grid3X3,
  Undo,
  Redo,
  Save,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function ProjectEditorPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [projectName, setProjectName] = useState('Loading...')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved')

  const {
    viewMode,
    setViewMode,
    activeTool,
    setActiveTool,
    snapToGrid,
    setSnapToGrid,
    selectedItems,
    items,
    removeItem,
    undo,
    redo,
    exportScene,
    importScene
  } = useCanvasStore()

  // Load project data on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/projects')
            return
          }
          throw new Error('Failed to load project')
        }

        const project = await response.json()
        setProjectName(project.name)

        // Import scene data if it exists
        if (project.sceneData && project.sceneData.items) {
          importScene(project.sceneData)
        }
      } catch (err) {
        console.error('Error loading project:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [id, router, importScene])

  // Track unsaved changes
  useEffect(() => {
    if (!isLoading) {
      setSaveStatus('unsaved')
    }
  }, [items, isLoading])

  const handleSave = async () => {
    const sceneData = exportScene()
    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneData }),
      })

      if (!response.ok) {
        throw new Error('Failed to save project')
      }

      setSaveStatus('saved')
    } catch (err) {
      console.error('Error saving project:', err)
      setSaveStatus('unsaved')
      alert('Failed to save project. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    selectedItems.forEach(id => removeItem(id))
  }

  const selectedItem = selectedItems.length === 1
    ? Array.from(items.values()).find(item => item.id === selectedItems[0])
    : null

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate' },
    { id: 'scale', icon: Maximize2, label: 'Scale' },
  ] as const

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-semibold">{projectName}</h1>
            <span className="text-xs text-gray-500">
              {saveStatus === 'saved' && 'All changes saved'}
              {saveStatus === 'unsaved' && 'Unsaved changes'}
              {saveStatus === 'saving' && 'Saving...'}
            </span>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 border-l pl-4">
            {tools.map(tool => (
              <Button
                key={tool.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  'h-8 w-8 p-0',
                  activeTool === tool.id && 'bg-blue-100 text-blue-600'
                )}
                title={tool.label}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            ))}

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={selectedItems.length === 0}
              className="h-8 w-8 p-0"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={cn(
                'h-8 w-8 p-0',
                snapToGrid && 'bg-blue-100 text-blue-600'
              )}
              title="Snap to Grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              className="h-8 w-8 p-0"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={redo}
              className="h-8 w-8 p-0"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === '2D' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('2D')}
          >
            2D
          </Button>
          <Button
            variant={viewMode === '3D' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('3D')}
          >
            3D
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Furniture Library */}
        <aside className="w-64 bg-white border-r flex flex-col">
          <div className="p-3 border-b">
            <h2 className="font-semibold text-sm">Furniture Library</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <FurnitureLibrary />
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 bg-gray-100 relative">
          {viewMode === '3D' ? (
            <ThreeScene />
          ) : (
            <Canvas2D />
          )}

          {/* Item count indicator */}
          <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded shadow text-sm">
            {items.size} items
          </div>
        </main>

        {/* Properties Panel */}
        <aside className="w-64 bg-white border-l p-4">
          <h2 className="font-semibold mb-4 text-sm">Properties</h2>

          {selectedItem ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Item ID</label>
                <p className="text-sm font-mono truncate">{selectedItem.id}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500">Type</label>
                <p className="text-sm">{selectedItem.furnitureItemId}</p>
              </div>

              <div>
                <label className="text-xs text-gray-500">Position</label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-gray-100 p-1 rounded">
                    X: {selectedItem.position.x.toFixed(2)}
                  </div>
                  <div className="bg-gray-100 p-1 rounded">
                    Y: {selectedItem.position.y.toFixed(2)}
                  </div>
                  <div className="bg-gray-100 p-1 rounded">
                    Z: {selectedItem.position.z.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Rotation</label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-gray-100 p-1 rounded">
                    X: {(selectedItem.rotation.x * 180 / Math.PI).toFixed(0)}°
                  </div>
                  <div className="bg-gray-100 p-1 rounded">
                    Y: {(selectedItem.rotation.y * 180 / Math.PI).toFixed(0)}°
                  </div>
                  <div className="bg-gray-100 p-1 rounded">
                    Z: {(selectedItem.rotation.z * 180 / Math.PI).toFixed(0)}°
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Scale</label>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-gray-100 p-1 rounded">
                    X: {selectedItem.scale.x.toFixed(2)}
                  </div>
                  <div className="bg-gray-100 p-1 rounded">
                    Y: {selectedItem.scale.y.toFixed(2)}
                  </div>
                  <div className="bg-gray-100 p-1 rounded">
                    Z: {selectedItem.scale.z.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => removeItem(selectedItem.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Item
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              {selectedItems.length > 1
                ? `${selectedItems.length} items selected`
                : 'Select an item to edit properties'}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

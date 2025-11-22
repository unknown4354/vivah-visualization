'use client'

import { useCanvasStore } from '@/stores/canvas-store'
import { ThreeScene } from '@/components/canvas/ThreeScene'
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
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
    exportScene
  } = useCanvasStore()

  const handleSave = async () => {
    const sceneData = exportScene()
    console.log('Saving scene:', sceneData)
    // TODO: Call API to save project
    alert('Scene saved! Check console for data.')
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

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold">Project Editor</h1>

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
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
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
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">
                2D view coming soon...
                <br />
                <span className="text-sm">Switch to 3D to start designing</span>
              </p>
            </div>
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

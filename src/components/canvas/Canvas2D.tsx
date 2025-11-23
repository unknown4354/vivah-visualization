'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Canvas as FabricCanvas, Rect, Circle, Group, FabricText } from 'fabric'
import { useCanvasStore } from '@/stores/canvas-store'
import * as THREE from 'three'

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<FabricCanvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    items,
    selectedItems,
    selectItem,
    clearSelection,
    updateItem,
    snapToGrid,
    gridSize
  } = useCanvasStore()

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    fabricRef.current = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f5f5f5',
      selection: true,
      preserveObjectStacking: true
    })

    const canvas = fabricRef.current

    // Draw grid
    drawGrid(canvas, width, height)

    // Event handlers
    canvas.on('selection:created', (e) => {
      clearSelection()
      e.selected?.forEach(obj => {
        const id = (obj as any).itemId
        if (id) selectItem(id, true)
      })
    })

    canvas.on('selection:updated', (e) => {
      clearSelection()
      e.selected?.forEach(obj => {
        const id = (obj as any).itemId
        if (id) selectItem(id, true)
      })
    })

    canvas.on('selection:cleared', () => {
      clearSelection()
    })

    canvas.on('object:modified', (e) => {
      const obj = e.target
      if (!obj) return

      const id = (obj as any).itemId
      if (!id) return

      let x = obj.left || 0
      let z = obj.top || 0

      // Apply snap to grid
      if (snapToGrid) {
        x = Math.round(x / (gridSize * 20)) * (gridSize * 20)
        z = Math.round(z / (gridSize * 20)) * (gridSize * 20)
        obj.set({ left: x, top: z })
        canvas.renderAll()
      }

      // Convert from canvas coordinates to 3D world coordinates
      const worldX = (x - width / 2) / 20
      const worldZ = (z - height / 2) / 20
      const angle = obj.angle || 0

      updateItem(id, {
        position: new THREE.Vector3(worldX, 0, worldZ),
        rotation: new THREE.Euler(0, (angle * Math.PI) / 180, 0)
      })
    })

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !fabricRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      fabricRef.current.setDimensions({ width: newWidth, height: newHeight })
      drawGrid(fabricRef.current, newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.dispose()
    }
  }, [])

  // Sync items to canvas
  useEffect(() => {
    if (!fabricRef.current || !containerRef.current) return
    const canvas = fabricRef.current
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Remove existing item objects (keep grid)
    const objects = canvas.getObjects()
    objects.forEach(obj => {
      if ((obj as any).itemId) {
        canvas.remove(obj)
      }
    })

    // Add items
    items.forEach(item => {
      // Convert 3D world coordinates to canvas coordinates
      const canvasX = item.position.x * 20 + width / 2
      const canvasZ = item.position.z * 20 + height / 2
      const angle = (item.rotation.y * 180) / Math.PI

      // Create shape based on furniture type
      const shape = createFurnitureShape(item.furnitureItemId)
      shape.set({
        left: canvasX,
        top: canvasZ,
        angle: angle,
        originX: 'center',
        originY: 'center'
      })

      // Store item ID for reference
      ;(shape as any).itemId = item.id

      // Highlight if selected
      if (selectedItems.includes(item.id)) {
        shape.set({
          stroke: '#3b82f6',
          strokeWidth: 2
        })
      }

      canvas.add(shape)
    })

    canvas.renderAll()
  }, [items, selectedItems])

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-3 text-xs">
        <div className="font-medium mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-700" />
            <span>Table</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-600" />
            <span>Chair</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-pink-400" />
            <span>Decoration</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function drawGrid(canvas: FabricCanvas, width: number, height: number) {
  // Remove existing grid lines
  const objects = canvas.getObjects()
  objects.forEach(obj => {
    if ((obj as any).isGrid) {
      canvas.remove(obj)
    }
  })

  const gridSpacing = 20 // 20px = 1 meter

  // Vertical lines
  for (let i = 0; i <= width; i += gridSpacing) {
    const line = new Rect({
      left: i,
      top: 0,
      width: 1,
      height: height,
      fill: i % (gridSpacing * 5) === 0 ? '#d1d5db' : '#e5e7eb',
      selectable: false,
      evented: false
    })
    ;(line as any).isGrid = true
    canvas.add(line)
    canvas.sendObjectToBack(line)
  }

  // Horizontal lines
  for (let i = 0; i <= height; i += gridSpacing) {
    const line = new Rect({
      left: 0,
      top: i,
      width: width,
      height: 1,
      fill: i % (gridSpacing * 5) === 0 ? '#d1d5db' : '#e5e7eb',
      selectable: false,
      evented: false
    })
    ;(line as any).isGrid = true
    canvas.add(line)
    canvas.sendObjectToBack(line)
  }
}

function createFurnitureShape(furnitureItemId: string) {
  // Create different shapes based on furniture type
  const type = furnitureItemId.toLowerCase()

  if (type.includes('table') || type.includes('round')) {
    // Round table
    return new Circle({
      radius: 20,
      fill: '#92400e',
      stroke: '#78350f',
      strokeWidth: 1
    })
  }

  if (type.includes('chair')) {
    // Chair (small square)
    return new Rect({
      width: 12,
      height: 12,
      fill: '#d97706',
      stroke: '#b45309',
      strokeWidth: 1
    })
  }

  if (type.includes('arch') || type.includes('backdrop')) {
    // Arch/backdrop (wide rectangle)
    return new Rect({
      width: 60,
      height: 10,
      fill: '#f9a8d4',
      stroke: '#ec4899',
      strokeWidth: 1
    })
  }

  if (type.includes('chandelier') || type.includes('light')) {
    // Lighting (small circle)
    return new Circle({
      radius: 8,
      fill: '#fef3c7',
      stroke: '#f59e0b',
      strokeWidth: 1
    })
  }

  if (type.includes('flower') || type.includes('floral')) {
    // Floral (colored circle)
    return new Circle({
      radius: 10,
      fill: '#fca5a5',
      stroke: '#ef4444',
      strokeWidth: 1
    })
  }

  // Default shape
  return new Rect({
    width: 20,
    height: 20,
    fill: '#9ca3af',
    stroke: '#6b7280',
    strokeWidth: 1
  })
}

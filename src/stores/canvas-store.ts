import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface CanvasItem {
  id: string
  furnitureItemId: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  selected: boolean
  locked: boolean
  visible: boolean
  materialOverride?: Record<string, unknown>
}

interface CanvasState {
  // View state
  viewMode: '2D' | '3D'
  cameraPosition: { x: number; y: number; z: number }
  cameraTarget: { x: number; y: number; z: number }
  zoom: number

  // Selection
  selectedItems: string[]
  hoveredItem: string | null

  // Items
  items: Map<string, CanvasItem>

  // Tools
  activeTool: 'select' | 'move' | 'rotate' | 'scale' | 'delete'
  snapToGrid: boolean
  gridSize: number

  // History
  history: unknown[]
  historyIndex: number

  // Actions
  setViewMode: (mode: '2D' | '3D') => void
  addItem: (item: CanvasItem) => void
  updateItem: (id: string, updates: Partial<CanvasItem>) => void
  removeItem: (id: string) => void
  selectItem: (id: string, multi?: boolean) => void
  clearSelection: () => void
  setActiveTool: (tool: CanvasState['activeTool']) => void
  setSnapToGrid: (snap: boolean) => void

  // History
  undo: () => void
  redo: () => void

  // Utils
  exportScene: () => unknown
  importScene: (data: unknown) => void
}

export const useCanvasStore = create<CanvasState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    viewMode: '2D',
    cameraPosition: { x: 10, y: 10, z: 10 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    zoom: 1,

    selectedItems: [],
    hoveredItem: null,

    items: new Map(),

    activeTool: 'select',
    snapToGrid: true,
    gridSize: 0.5,

    history: [],
    historyIndex: -1,

    // Actions
    setViewMode: (mode) => set({ viewMode: mode }),

    addItem: (item) =>
      set((state) => {
        const newItems = new Map(state.items)
        newItems.set(item.id, item)
        return { items: newItems }
      }),

    updateItem: (id, updates) =>
      set((state) => {
        const newItems = new Map(state.items)
        const item = newItems.get(id)
        if (item) {
          newItems.set(id, { ...item, ...updates })
        }
        return { items: newItems }
      }),

    removeItem: (id) =>
      set((state) => {
        const newItems = new Map(state.items)
        newItems.delete(id)
        return {
          items: newItems,
          selectedItems: state.selectedItems.filter((i) => i !== id),
        }
      }),

    selectItem: (id, multi = false) =>
      set((state) => {
        if (multi) {
          const isSelected = state.selectedItems.includes(id)
          return {
            selectedItems: isSelected
              ? state.selectedItems.filter((i) => i !== id)
              : [...state.selectedItems, id],
          }
        }
        return { selectedItems: [id] }
      }),

    clearSelection: () => set({ selectedItems: [] }),

    setActiveTool: (tool) => set({ activeTool: tool }),

    setSnapToGrid: (snap) => set({ snapToGrid: snap }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          return { historyIndex: state.historyIndex - 1 }
        }
        return state
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          return { historyIndex: state.historyIndex + 1 }
        }
        return state
      }),

    exportScene: () => {
      const state = get()
      return {
        version: '1.0',
        timestamp: new Date().toISOString(),
        viewMode: state.viewMode,
        camera: {
          position: state.cameraPosition,
          target: state.cameraTarget,
          zoom: state.zoom,
        },
        items: Array.from(state.items.values()),
      }
    },

    importScene: (data: unknown) =>
      set(() => {
        const sceneData = data as {
          viewMode: '2D' | '3D'
          camera: {
            position: { x: number; y: number; z: number }
            target: { x: number; y: number; z: number }
            zoom: number
          }
          items: CanvasItem[]
        }
        const items = new Map<string, CanvasItem>()
        sceneData.items.forEach((item) => {
          items.set(item.id, item)
        })

        return {
          items,
          viewMode: sceneData.viewMode,
          cameraPosition: sceneData.camera.position,
          cameraTarget: sceneData.camera.target,
          zoom: sceneData.camera.zoom,
        }
      }),
  }))
)

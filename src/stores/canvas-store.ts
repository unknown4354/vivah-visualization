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

interface HistoryEntry {
  items: CanvasItem[]
  timestamp: number
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
  history: HistoryEntry[]
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
  saveHistory: () => void

  // Utils
  exportScene: () => unknown
  importScene: (data: unknown) => void
}

const MAX_HISTORY = 50

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

        // Save to history
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push({
          items: Array.from(newItems.values()),
          timestamp: Date.now()
        })

        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift()
        }

        return {
          items: newItems,
          history: newHistory,
          historyIndex: newHistory.length - 1
        }
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

        // Save to history
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push({
          items: Array.from(newItems.values()),
          timestamp: Date.now()
        })

        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift()
        }

        return {
          items: newItems,
          selectedItems: state.selectedItems.filter((i) => i !== id),
          history: newHistory,
          historyIndex: newHistory.length - 1
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

    saveHistory: () =>
      set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push({
          items: Array.from(state.items.values()),
          timestamp: Date.now()
        })

        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift()
        }

        return {
          history: newHistory,
          historyIndex: newHistory.length - 1
        }
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          const prevIndex = state.historyIndex - 1
          const prevEntry = state.history[prevIndex]
          if (prevEntry) {
            const items = new Map<string, CanvasItem>()
            prevEntry.items.forEach((item) => {
              items.set(item.id, item)
            })
            return {
              items,
              historyIndex: prevIndex,
              selectedItems: []
            }
          }
        }
        return state
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const nextIndex = state.historyIndex + 1
          const nextEntry = state.history[nextIndex]
          if (nextEntry) {
            const items = new Map<string, CanvasItem>()
            nextEntry.items.forEach((item) => {
              items.set(item.id, item)
            })
            return {
              items,
              historyIndex: nextIndex,
              selectedItems: []
            }
          }
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

        // Initialize history with imported state
        const initialHistory: HistoryEntry[] = [{
          items: sceneData.items,
          timestamp: Date.now()
        }]

        return {
          items,
          viewMode: sceneData.viewMode,
          cameraPosition: sceneData.camera.position,
          cameraTarget: sceneData.camera.target,
          zoom: sceneData.camera.zoom,
          history: initialHistory,
          historyIndex: 0
        }
      }),
  }))
)

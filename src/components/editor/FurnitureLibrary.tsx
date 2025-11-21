'use client'

import { useState, useEffect } from 'react'
import { useCanvasStore } from '@/stores/canvas-store'
import { v4 as uuid } from 'uuid'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface FurnitureItem {
  id: string
  name: string
  slug: string
  category: string
  thumbnailUrl: string
  dimensions: { width: number; depth: number; height: number }
}

interface FurnitureLibraryProps {
  onItemSelect?: (item: FurnitureItem) => void
}

export function FurnitureLibrary({ onItemSelect }: FurnitureLibraryProps) {
  const [items, setItems] = useState<FurnitureItem[]>([])
  const [grouped, setGrouped] = useState<Record<string, FurnitureItem[]>>({})
  const [search, setSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['TABLE', 'CHAIR']))
  const [loading, setLoading] = useState(true)

  const { addItem } = useCanvasStore()

  useEffect(() => {
    fetchFurniture()
  }, [])

  const fetchFurniture = async () => {
    try {
      const res = await fetch('/api/furniture')
      const data = await res.json()
      setItems(data.items || [])
      setGrouped(data.grouped || {})
    } catch (error) {
      console.error('Failed to fetch furniture:', error)
      // Use placeholder data if API fails
      setGrouped({
        TABLE: [
          { id: '1', name: 'Round Table 8-Seater', slug: 'round-table-8', category: 'TABLE', thumbnailUrl: '', dimensions: { width: 1.5, depth: 1.5, height: 0.75 } },
          { id: '2', name: 'Rectangular Table', slug: 'rect-table-10', category: 'TABLE', thumbnailUrl: '', dimensions: { width: 2.4, depth: 1.2, height: 0.75 } },
        ],
        CHAIR: [
          { id: '3', name: 'Chiavari Chair Gold', slug: 'chiavari-gold', category: 'CHAIR', thumbnailUrl: '', dimensions: { width: 0.4, depth: 0.4, height: 0.9 } },
          { id: '4', name: 'Ghost Chair', slug: 'ghost-chair', category: 'CHAIR', thumbnailUrl: '', dimensions: { width: 0.4, depth: 0.5, height: 0.9 } },
        ],
        DECORATION: [
          { id: '5', name: 'Floral Centerpiece', slug: 'floral-centerpiece', category: 'DECORATION', thumbnailUrl: '', dimensions: { width: 0.3, depth: 0.3, height: 0.4 } },
        ],
        STRUCTURE: [
          { id: '6', name: 'Wedding Arch', slug: 'wedding-arch', category: 'STRUCTURE', thumbnailUrl: '', dimensions: { width: 2.5, depth: 0.8, height: 2.8 } },
        ],
        LIGHTING: [
          { id: '7', name: 'Crystal Chandelier', slug: 'crystal-chandelier', category: 'LIGHTING', thumbnailUrl: '', dimensions: { width: 1.0, depth: 1.0, height: 1.2 } },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleAddItem = (item: FurnitureItem) => {
    const canvasItem = {
      id: uuid(),
      furnitureItemId: item.slug,
      position: { x: 0, y: item.dimensions.height / 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      selected: false,
      locked: false,
      visible: true,
    }
    addItem(canvasItem)
    onItemSelect?.(item)
  }

  const filteredGrouped = search
    ? Object.entries(grouped).reduce((acc, [category, items]) => {
        const filtered = items.filter(item =>
          item.name.toLowerCase().includes(search.toLowerCase())
        )
        if (filtered.length > 0) {
          acc[category] = filtered
        }
        return acc
      }, {} as Record<string, FurnitureItem[]>)
    : grouped

  const categoryLabels: Record<string, string> = {
    TABLE: 'Tables',
    CHAIR: 'Chairs',
    DECORATION: 'Decorations',
    LIGHTING: 'Lighting',
    STRUCTURE: 'Structures',
    FLORAL: 'Floral',
    MISC: 'Miscellaneous',
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search furniture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.entries(filteredGrouped).map(([category, categoryItems]) => (
          <div key={category} className="border-b">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 text-sm font-medium"
            >
              <span>{categoryLabels[category] || category}</span>
              {expandedCategories.has(category) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {expandedCategories.has(category) && (
              <div className="px-2 pb-2 grid grid-cols-2 gap-2">
                {categoryItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="p-2 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="aspect-square bg-gray-100 rounded mb-1 flex items-center justify-center text-2xl">
                      {category === 'TABLE' && '🪑'}
                      {category === 'CHAIR' && '💺'}
                      {category === 'DECORATION' && '🌸'}
                      {category === 'LIGHTING' && '💡'}
                      {category === 'STRUCTURE' && '🏛️'}
                      {category === 'FLORAL' && '💐'}
                    </div>
                    <p className="text-xs truncate">{item.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

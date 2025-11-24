'use client'

import { forwardRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF, Clone } from '@react-three/drei'
import type { CanvasItem } from '@/stores/canvas-store'

interface FurnitureModelProps extends CanvasItem {
  selected: boolean
  onSelect: () => void
}

// Model URL mapping - maps furniture IDs to GLB file paths
// These can be stored in Supabase Storage or a CDN
const MODEL_URLS: Record<string, string> = {
  // Tables
  'round-table-8': '/models/round-table.glb',
  'round-table-10': '/models/round-table.glb',
  'rectangular-table': '/models/rectangular-table.glb',
  'cocktail-table': '/models/cocktail-table.glb',
  // Chairs
  'chiavari-gold': '/models/chiavari-chair.glb',
  'chiavari-silver': '/models/chiavari-chair.glb',
  'chiavari-white': '/models/chiavari-chair.glb',
  'folding-white': '/models/folding-chair.glb',
  'folding-black': '/models/folding-chair.glb',
  // Decorations
  'floral-arch': '/models/floral-arch.glb',
  'backdrop': '/models/backdrop.glb',
  'mandap': '/models/mandap.glb',
  // Lighting
  'chandelier': '/models/chandelier.glb',
  'uplighting': '/models/uplighting.glb',
  'string-lights': '/models/string-lights.glb',
  // Misc
  'stage': '/models/stage.glb',
  'dance-floor': '/models/dance-floor.glb',
}

// Placeholder component for when models aren't loaded
function PlaceholderModel({
  furnitureItemId,
  color,
  selected,
  hovered
}: {
  furnitureItemId: string
  color: string
  selected: boolean
  hovered: boolean
}) {
  const getGeometry = () => {
    if (furnitureItemId.includes('table')) {
      if (furnitureItemId.includes('rectangular')) {
        return <boxGeometry args={[1.8, 0.75, 0.9]} />
      }
      if (furnitureItemId.includes('cocktail')) {
        return <cylinderGeometry args={[0.3, 0.3, 1.1, 16]} />
      }
      return <cylinderGeometry args={[0.75, 0.75, 0.75, 32]} />
    }
    if (furnitureItemId.includes('chair')) {
      return <boxGeometry args={[0.45, 0.9, 0.45]} />
    }
    if (furnitureItemId.includes('arch') || furnitureItemId.includes('mandap')) {
      return <boxGeometry args={[3, 3.5, 0.5]} />
    }
    if (furnitureItemId.includes('backdrop')) {
      return <boxGeometry args={[4, 2.5, 0.2]} />
    }
    if (furnitureItemId.includes('chandelier')) {
      return <sphereGeometry args={[0.6, 16, 16]} />
    }
    if (furnitureItemId.includes('stage')) {
      return <boxGeometry args={[6, 0.5, 4]} />
    }
    if (furnitureItemId.includes('dance-floor')) {
      return <boxGeometry args={[5, 0.1, 5]} />
    }
    if (furnitureItemId.includes('light')) {
      return <cylinderGeometry args={[0.15, 0.2, 0.4, 8]} />
    }
    return <boxGeometry args={[0.5, 0.5, 0.5]} />
  }

  return (
    <mesh castShadow receiveShadow>
      {getGeometry()}
      <meshStandardMaterial
        color={color}
        emissive={selected ? '#ffff00' : hovered ? '#88ff88' : '#000000'}
        emissiveIntensity={selected ? 0.3 : hovered ? 0.1 : 0}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  )
}

// GLB Model loader component
function GLBModel({
  url,
  color,
  selected,
  hovered
}: {
  url: string
  color: string
  selected: boolean
  hovered: boolean
}) {
  const { scene } = useGLTF(url)

  // Clone the scene to avoid sharing materials between instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone()

    // Apply color override and selection highlighting
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Clone material to avoid affecting other instances
        child.material = child.material.clone()

        if (child.material instanceof THREE.MeshStandardMaterial) {
          // Apply color override if specified
          if (color !== '#DEB887') {
            child.material.color.set(color)
          }

          // Apply selection/hover highlighting
          child.material.emissive = new THREE.Color(
            selected ? '#ffff00' : hovered ? '#88ff88' : '#000000'
          )
          child.material.emissiveIntensity = selected ? 0.3 : hovered ? 0.1 : 0
        }

        child.castShadow = true
        child.receiveShadow = true
      }
    })

    return clone
  }, [scene, color, selected, hovered])

  return <primitive object={clonedScene} />
}

export const FurnitureModel = forwardRef<THREE.Group, FurnitureModelProps>(
  function FurnitureModel(
    {
      id,
      furnitureItemId,
      position,
      rotation,
      scale,
      selected,
      locked,
      visible,
      materialOverride,
      onSelect
    },
    ref
  ) {
    const [hovered, setHovered] = useState(false)
    const [modelExists, setModelExists] = useState<boolean | null>(null)

    // Get model URL for this furniture item
    const modelUrl = MODEL_URLS[furnitureItemId] || null

    // Check if model file exists
    useEffect(() => {
      if (!modelUrl) {
        setModelExists(false)
        return
      }

      // Try to preload the model
      fetch(modelUrl, { method: 'HEAD' })
        .then(res => setModelExists(res.ok))
        .catch(() => setModelExists(false))
    }, [modelUrl])

    if (!visible) return null

    const getColor = (): string => {
      if (materialOverride?.color && typeof materialOverride.color === 'string') {
        return materialOverride.color
      }
      if (furnitureItemId.includes('gold')) return '#FFD700'
      if (furnitureItemId.includes('silver')) return '#C0C0C0'
      if (furnitureItemId.includes('white')) return '#FFFFFF'
      if (furnitureItemId.includes('black')) return '#333333'
      if (furnitureItemId.includes('mahogany')) return '#4A2C2A'
      return '#DEB887'
    }

    const color = getColor()

    return (
      <group
        ref={ref}
        position={[position.x, position.y, position.z]}
        rotation={[rotation.x, rotation.y, rotation.z]}
        scale={[scale.x, scale.y, scale.z]}
        onClick={(e) => {
          e.stopPropagation()
          if (!locked) onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = locked ? 'not-allowed' : 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        {/* Render GLB model if available, otherwise placeholder */}
        {modelExists && modelUrl ? (
          <GLBModel
            url={modelUrl}
            color={color}
            selected={selected}
            hovered={hovered}
          />
        ) : (
          <PlaceholderModel
            furnitureItemId={furnitureItemId}
            color={color}
            selected={selected}
            hovered={hovered}
          />
        )}

        {/* Selection indicator ring */}
        {selected && (
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.9, 32]} />
            <meshBasicMaterial color="#ffff00" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        )}
      </group>
    )
  }
)

// Preload common models for better performance
// Call this in your app initialization
export function preloadModels() {
  Object.values(MODEL_URLS).forEach(url => {
    try {
      useGLTF.preload(url)
    } catch (e) {
      // Model might not exist yet
    }
  })
}

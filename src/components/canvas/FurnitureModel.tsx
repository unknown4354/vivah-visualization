'use client'

import { forwardRef, useState } from 'react'
import * as THREE from 'three'
import type { CanvasItem } from '@/stores/canvas-store'

interface FurnitureModelProps extends CanvasItem {
  selected: boolean
  onSelect: () => void
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

    if (!visible) return null

    // For now, render placeholder geometry based on furniture type
    // In production, this would load actual GLB models
    const getGeometry = () => {
      if (furnitureItemId.includes('table')) {
        return <cylinderGeometry args={[0.75, 0.75, 0.75, 32]} />
      }
      if (furnitureItemId.includes('chair')) {
        return <boxGeometry args={[0.4, 0.8, 0.4]} />
      }
      if (furnitureItemId.includes('arch')) {
        return <boxGeometry args={[2.5, 2.8, 0.3]} />
      }
      if (furnitureItemId.includes('chandelier')) {
        return <sphereGeometry args={[0.5, 16, 16]} />
      }
      // Default box
      return <boxGeometry args={[0.5, 0.5, 0.5]} />
    }

    const getColor = (): string => {
      if (materialOverride?.color && typeof materialOverride.color === 'string') {
        return materialOverride.color
      }
      if (furnitureItemId.includes('gold')) return '#FFD700'
      if (furnitureItemId.includes('white')) return '#FFFFFF'
      return '#DEB887'
    }

    return (
      <group
        ref={ref}
        position={[position.x, position.y, position.z]}
        rotation={[rotation.x, rotation.y, rotation.z]}
        scale={[scale.x, scale.y, scale.z]}
      >
        <mesh
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
          castShadow
          receiveShadow
        >
          {getGeometry()}
          <meshStandardMaterial
            color={getColor()}
            emissive={selected ? '#ffff00' : hovered ? '#88ff88' : '#000000'}
            emissiveIntensity={selected ? 0.3 : hovered ? 0.1 : 0}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>

        {/* Selection indicator */}
        {selected && (
          <mesh position={[0, -0.35, 0]}>
            <ringGeometry args={[0.6, 0.7, 32]} />
            <meshBasicMaterial color="#ffff00" side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    )
  }
)

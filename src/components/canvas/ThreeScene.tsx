'use client'

import { Canvas, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  Environment,
  TransformControls,
  GizmoHelper,
  GizmoViewport,
  Bounds
} from '@react-three/drei'
import { Suspense, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useCanvasStore } from '@/stores/canvas-store'
import { FurnitureModel } from './FurnitureModel'

function TransformableItem({
  item,
  selected,
  onSelect,
  activeTool
}: {
  item: any
  selected: boolean
  onSelect: () => void
  activeTool: string
}) {
  const meshRef = useRef<THREE.Group>(null)
  const { updateItem, saveHistory } = useCanvasStore()
  const { gl } = useThree()

  // Determine transform mode based on active tool
  const getMode = () => {
    switch (activeTool) {
      case 'move':
        return 'translate'
      case 'rotate':
        return 'rotate'
      case 'scale':
        return 'scale'
      default:
        return 'translate'
    }
  }

  const handleTransformEnd = () => {
    if (!meshRef.current) return

    const pos = meshRef.current.position
    const rot = meshRef.current.rotation
    const scl = meshRef.current.scale

    updateItem(item.id, {
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: { x: rot.x, y: rot.y, z: rot.z },
      scale: { x: scl.x, y: scl.y, z: scl.z }
    })

    // Save to history after transform
    saveHistory()
  }

  return (
    <>
      <FurnitureModel
        ref={meshRef}
        {...item}
        selected={selected}
        onSelect={onSelect}
      />
      {selected && (activeTool === 'move' || activeTool === 'rotate' || activeTool === 'scale') && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode={getMode()}
          onMouseUp={handleTransformEnd}
          size={0.75}
        />
      )}
    </>
  )
}

function Scene() {
  const {
    items,
    selectedItems,
    activeTool,
    selectItem,
    clearSelection
  } = useCanvasStore()

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Environment */}
      <Environment preset="apartment" background={false} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>

      {/* Grid */}
      <Grid
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        minDistance={2}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>

      {/* Furniture Items */}
      <Bounds fit clip observe margin={1.2}>
        {Array.from(items.values()).map(item => (
          <TransformableItem
            key={item.id}
            item={item}
            selected={selectedItems.includes(item.id)}
            onSelect={() => selectItem(item.id)}
            activeTool={activeTool}
          />
        ))}
      </Bounds>
    </>
  )
}

export function ThreeScene() {
  const { cameraPosition, clearSelection } = useCanvasStore()

  // Use store camera position with fallback to default
  const camPos: [number, number, number] = cameraPosition
    ? [cameraPosition.x, cameraPosition.y, cameraPosition.z]
    : [10, 10, 10]

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{
          position: camPos,
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.8
        }}
        onPointerMissed={() => {
          // Clear selection when clicking empty space
          clearSelection()
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

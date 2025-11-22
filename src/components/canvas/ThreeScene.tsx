'use client'

import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  Environment,
  TransformControls,
  GizmoHelper,
  GizmoViewport,
  Select,
  Bounds
} from '@react-three/drei'
import { Suspense, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useCanvasStore } from '@/stores/canvas-store'
import { FurnitureModel } from './FurnitureModel'

function Scene() {
  const {
    items,
    selectedItems,
    activeTool,
    selectItem,
    clearSelection
  } = useCanvasStore()

  const transformRef = useRef<any>(null)

  // Get the first selected item's object for transform controls
  const selectedItem = selectedItems.length === 1
    ? Array.from(items.values()).find(item => item.id === selectedItems[0])
    : null

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
          <FurnitureModel
            key={item.id}
            {...item}
            selected={selectedItems.includes(item.id)}
            onSelect={() => selectItem(item.id)}
          />
        ))}
      </Bounds>

      {/* Click on empty space to deselect */}
      <mesh
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          if (e.object.userData.isFloor) {
            clearSelection()
          }
        }}
        userData={{ isFloor: true }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  )
}

export function ThreeScene() {
  const { cameraPosition } = useCanvasStore()

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
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}

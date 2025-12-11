'use client'

import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  useGLTF,
  Center,
  ContactShadows,
  GizmoHelper,
  GizmoViewport
} from '@react-three/drei'
import { Suspense, useEffect, useState } from 'react'
import * as THREE from 'three'

interface GLBViewerProps {
  glbUrl: string
  autoRotate?: boolean
  showShadows?: boolean
  backgroundColor?: string
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)

  useEffect(() => {
    // Apply materials and shadows
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#888" wireframe />
    </mesh>
  )
}

export function GLBViewer({
  glbUrl,
  autoRotate = true,
  showShadows = true,
  backgroundColor = '#f5f5f5'
}: GLBViewerProps) {
  const [error, setError] = useState<string | null>(null)

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Failed to load 3D model</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{
          position: [3, 3, 3],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
      >
        <color attach="background" args={[backgroundColor]} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight
          position={[-5, 5, -5]}
          intensity={0.3}
        />

        {/* Environment */}
        <Environment preset="studio" background={false} />

        <Suspense fallback={<LoadingFallback />}>
          <Model url={glbUrl} />
        </Suspense>

        {/* Shadows */}
        {showShadows && (
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.5}
            scale={10}
            blur={2}
            far={4}
          />
        )}

        {/* Controls */}
        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          minDistance={1}
          maxDistance={20}
          enableDamping
          dampingFactor={0.05}
        />

        {/* Gizmo */}
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
      </Canvas>
    </div>
  )
}

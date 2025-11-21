'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

function Ring({ position, rotation, color }: {
  position: [number, number, number]
  rotation: [number, number, number]
  color: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <torusGeometry args={[1, 0.08, 32, 100]} />
      <meshStandardMaterial
        color={color}
        metalness={1}
        roughness={0.1}
      />
    </mesh>
  )
}

function IntertwineRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <Float
      speed={2}
      rotationIntensity={0.2}
      floatIntensity={0.5}
    >
      <group ref={groupRef}>
        {/* First Ring - Gold */}
        <Ring
          position={[-0.5, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#D4AF37"
        />
        {/* Second Ring - Rose Gold, intertwined */}
        <Ring
          position={[0.5, 0, 0]}
          rotation={[Math.PI / 2, Math.PI / 4, Math.PI / 6]}
          color="#E8C4B8"
        />
      </group>
    </Float>
  )
}

interface WeddingRingsProps {
  className?: string
}

export function WeddingRings({ className }: WeddingRingsProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <IntertwineRings />
        <Environment preset="studio" />
      </Canvas>
    </div>
  )
}

'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Render a single torus mesh styled as a metallic ring.
 *
 * @param position - World-space [x, y, z] translation for the ring
 * @param rotation - Euler rotation [x, y, z] in radians applied to the ring
 * @param color - CSS color string used for the ring's standard material
 * @returns The JSX element for the torus mesh
 */
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
        roughness={0.15}
      />
    </mesh>
  )
}

/**
 * Render a floating group of two intertwined 3D rings with continuous rotation and subtle X-axis oscillation.
 *
 * The group is wrapped in a `Float` wrapper for global floating motion; the group's Y rotation increases over time
 * and its X rotation oscillates with a sine wave to create a subtle rocking effect.
 *
 * @returns A JSX element containing the floating, animated group with two torus ring meshes (gold and rose gold).
 */
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
        {/* First Ring - Silver, tilted forward with diamond */}
        <group position={[-0.3, 0, 0]} rotation={[Math.PI / 2.5, Math.PI / 8, 0]}>
          <Ring
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            color="#C0C0C0"
          />
          {/* Diamond on first ring - brilliant cut style */}
          <group position={[0, 1.08, 0]}>
            {/* Crown (top pyramid) */}
            <mesh position={[0, 0.04, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.08, 0.06, 8]} />
              <meshPhysicalMaterial
                color="#f0f8ff"
                metalness={0.0}
                roughness={0.0}
                transmission={0.9}
                thickness={0.5}
                ior={2.4}
                clearcoat={1}
                clearcoatRoughness={0}
              />
            </mesh>
            {/* Pavilion (bottom pyramid) */}
            <mesh position={[0, -0.03, 0]}>
              <coneGeometry args={[0.08, 0.1, 8]} />
              <meshPhysicalMaterial
                color="#f0f8ff"
                metalness={0.0}
                roughness={0.0}
                transmission={0.9}
                thickness={0.5}
                ior={2.4}
                clearcoat={1}
                clearcoatRoughness={0}
              />
            </mesh>
          </group>
        </group>
        {/* Second Ring - Silver, tilted back and passing through first */}
        <group position={[0.3, 0, 0]} rotation={[Math.PI / 1.8, -Math.PI / 8, Math.PI / 2]}>
          <Ring
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            color="#E8E8E8"
          />
          {/* Diamond on second ring - brilliant cut style */}
          <group position={[0, 1.08, 0]}>
            {/* Crown (top pyramid) */}
            <mesh position={[0, 0.04, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.08, 0.06, 8]} />
              <meshPhysicalMaterial
                color="#f0f8ff"
                metalness={0.0}
                roughness={0.0}
                transmission={0.9}
                thickness={0.5}
                ior={2.4}
                clearcoat={1}
                clearcoatRoughness={0}
              />
            </mesh>
            {/* Pavilion (bottom pyramid) */}
            <mesh position={[0, -0.03, 0]}>
              <coneGeometry args={[0.08, 0.1, 8]} />
              <meshPhysicalMaterial
                color="#f0f8ff"
                metalness={0.0}
                roughness={0.0}
                transmission={0.9}
                thickness={0.5}
                ior={2.4}
                clearcoat={1}
                clearcoatRoughness={0}
              />
            </mesh>
          </group>
        </group>
      </group>
    </Float>
  )
}

interface WeddingRingsProps {
  className?: string
}

/**
 * Render a Three.js Canvas displaying two animated, intertwined wedding rings.
 *
 * @param className - Optional CSS class name applied to the outer container div
 * @returns A React element containing the 3D rings scene (Canvas with lights, animated rings, and environment) wrapped in a div
 */
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
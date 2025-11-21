'use client'

import { Suspense, lazy } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

/**
 * Renders a lazily loaded Spline scene inside a Suspense boundary with a centered spinner fallback.
 *
 * @param scene - Spline scene identifier or URL to load
 * @param className - Optional CSS class applied to the Spline container
 * @returns The rendered Spline scene wrapped in a Suspense boundary
 */
export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
      />
    </Suspense>
  )
}
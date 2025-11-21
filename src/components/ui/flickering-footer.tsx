"use client"

import { ChevronRightIcon } from "@radix-ui/react-icons"
import { clsx, type ClassValue } from "clsx"
import * as Color from "color-bits"
import Link from "next/link"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getRGBA = (
  cssColor: React.CSSProperties["color"],
  fallback: string = "rgba(180, 180, 180)",
): string => {
  if (typeof window === "undefined") return fallback
  if (!cssColor) return fallback

  try {
    if (typeof cssColor === "string" && cssColor.startsWith("var(")) {
      const element = document.createElement("div")
      element.style.color = cssColor
      document.body.appendChild(element)
      const computedColor = window.getComputedStyle(element).color
      document.body.removeChild(element)
      return Color.formatRGBA(Color.parse(computedColor))
    }

    return Color.formatRGBA(Color.parse(cssColor))
  } catch {
    return fallback
  }
}

const colorWithOpacity = (color: string, opacity: number): string => {
  if (!color.startsWith("rgb")) return color
  return Color.formatRGBA(Color.alpha(Color.parse(color), opacity))
}

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number
  gridGap?: number
  flickerChance?: number
  color?: string
  width?: number
  height?: number
  className?: string
  maxOpacity?: number
  text?: string
  fontSize?: number
  fontWeight?: number | string
}

const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 3,
  gridGap = 3,
  flickerChance = 0.2,
  color = "#B4B4B4",
  width,
  height,
  className,
  maxOpacity = 0.15,
  text = "",
  fontSize = 140,
  fontWeight = 600,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const memoizedColor = useMemo(() => {
    return getRGBA(color)
  }, [color])

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, width, height)

      const maskCanvas = document.createElement("canvas")
      maskCanvas.width = width
      maskCanvas.height = height
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true })
      if (!maskCtx) return

      if (text) {
        maskCtx.save()
        maskCtx.scale(dpr, dpr)
        maskCtx.fillStyle = "white"
        maskCtx.font = `${fontWeight} ${fontSize}px "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        maskCtx.textAlign = "center"
        maskCtx.textBaseline = "middle"
        maskCtx.fillText(text, width / (2 * dpr), height / (2 * dpr))
        maskCtx.restore()
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * (squareSize + gridGap) * dpr
          const y = j * (squareSize + gridGap) * dpr
          const squareWidth = squareSize * dpr
          const squareHeight = squareSize * dpr

          const maskData = maskCtx.getImageData(
            x,
            y,
            squareWidth,
            squareHeight,
          ).data
          const hasText = maskData.some(
            (value, index) => index % 4 === 0 && value > 0,
          )

          const opacity = squares[i * rows + j]
          const finalOpacity = hasText
            ? Math.min(1, opacity * 3 + 0.4)
            : opacity

          ctx.fillStyle = colorWithOpacity(memoizedColor, finalOpacity)
          ctx.fillRect(x, y, squareWidth, squareHeight)
        }
      }
    },
    [memoizedColor, squareSize, gridGap, text, fontSize, fontWeight],
  )

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const cols = Math.ceil(width / (squareSize + gridGap))
      const rows = Math.ceil(height / (squareSize + gridGap))

      const squares = new Float32Array(cols * rows)
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity
      }

      return { cols, rows, squares, dpr }
    },
    [squareSize, gridGap, maxOpacity],
  )

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity
        }
      }
    },
    [flickerChance, maxOpacity],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let gridParams: ReturnType<typeof setupCanvas>

    const updateCanvasSize = () => {
      const newWidth = width || container.clientWidth
      const newHeight = height || container.clientHeight
      setCanvasSize({ width: newWidth, height: newHeight })
      gridParams = setupCanvas(canvas, newWidth, newHeight)
    }

    updateCanvasSize()

    let lastTime = 0
    const animate = (time: number) => {
      if (!isInView) return

      const deltaTime = (time - lastTime) / 1000
      lastTime = time

      updateSquares(gridParams.squares, deltaTime)
      drawGrid(
        ctx,
        canvas.width,
        canvas.height,
        gridParams.cols,
        gridParams.rows,
        gridParams.squares,
        gridParams.dpr,
      )
      animationFrameId = requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize()
    })

    resizeObserver.observe(container)

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0 },
    )

    intersectionObserver.observe(canvas)

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate)
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView])

  return (
    <div
      ref={containerRef}
      className={cn(`h-full w-full ${className}`)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  )
}

function useMediaQuery(query: string) {
  const [value, setValue] = useState(false)

  useEffect(() => {
    function checkQuery() {
      const result = window.matchMedia(query)
      setValue(result.matches)
    }

    checkQuery()

    window.addEventListener("resize", checkQuery)

    const mediaQuery = window.matchMedia(query)
    mediaQuery.addEventListener("change", checkQuery)

    return () => {
      window.removeEventListener("resize", checkQuery)
      mediaQuery.removeEventListener("change", checkQuery)
    }
  }, [query])

  return value
}

const footerLinks = [
  {
    title: "Product",
    links: [
      { id: 1, title: "Features", url: "#" },
      { id: 2, title: "Pricing", url: "#" },
      { id: 3, title: "Templates", url: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { id: 4, title: "About", url: "#" },
      { id: 5, title: "Blog", url: "#" },
      { id: 6, title: "Careers", url: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { id: 7, title: "Help Center", url: "#" },
      { id: 8, title: "Contact", url: "#" },
      { id: 9, title: "Privacy", url: "#" },
    ],
  },
]

export function FlickeringFooter() {
  const tablet = useMediaQuery("(max-width: 1024px)")

  return (
    <footer className="w-full pb-0 bg-black">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between p-10 max-w-6xl mx-auto">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-px w-6 bg-white/60" />
            <span className="text-sm font-light uppercase tracking-[0.2em] text-white/80">
              Vivah
            </span>
          </Link>
          <p className="tracking-tight text-neutral-400 text-sm font-light leading-relaxed">
            Transform your wedding vision into reality with intelligent 3D visualization and AI-powered design suggestions.
          </p>
        </div>
        <div className="pt-8 md:pt-0 md:w-1/2">
          <div className="flex flex-col items-start justify-start md:flex-row md:items-start md:justify-between gap-y-6 lg:pl-10">
            {footerLinks.map((column, columnIndex) => (
              <ul key={columnIndex} className="flex flex-col gap-y-2">
                <li className="mb-2 text-sm font-medium text-white/90">
                  {column.title}
                </li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    <Link href={link.url}>{link.title}</Link>
                    <div className="flex size-4 items-center justify-center border border-neutral-700 rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                      <ChevronRightIcon className="h-3 w-3" />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-48 md:h-64 relative mt-12 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black z-10 from-40%" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGrid
            text={tablet ? "Vivah" : "Design Your Dream"}
            fontSize={tablet ? 70 : 80}
            className="h-full w-full"
            squareSize={2}
            gridGap={tablet ? 2 : 3}
            color="#6B7280"
            maxOpacity={0.3}
            flickerChance={0.1}
          />
        </div>
      </div>
    </footer>
  )
}

"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { motion, useReducedMotion } from "motion/react"
import { formatINR } from "@/lib/format"

export type WaveSeries = {
  key: string
  label: string
  color: string
  // Optional area-fill colour; falls back to `color` when omitted.
  fill?: string
  values: number[]
}

export type WaveChartProps = {
  series: WaveSeries[]
  labels: string[]
  height: number
  zeroLine?: boolean
  marker?: { index: number; label: string }
}

type Pt = { x: number; y: number }

const PAD_TOP = 28 // room for the marker label
const PAD_BOTTOM = 24 // room for x-axis labels
const PAD_X = 12
const TIP_OFFSET = 14
const TIP_MAX_WIDTH = 200

// Fritsch-Carlson monotone tangents: the curve never overshoots the data points.
function monotoneTangents(pts: Pt[]): number[] {
  const n = pts.length
  const slopes: number[] = []
  for (let k = 0; k < n - 1; k++) {
    slopes.push((pts[k + 1].y - pts[k].y) / (pts[k + 1].x - pts[k].x))
  }
  const m: number[] = new Array(n)
  m[0] = slopes[0]
  m[n - 1] = slopes[n - 2]
  for (let k = 1; k < n - 1; k++) {
    m[k] = slopes[k - 1] * slopes[k] <= 0 ? 0 : (slopes[k - 1] + slopes[k]) / 2
  }
  for (let k = 0; k < n - 1; k++) {
    const d = slopes[k]
    if (d === 0) {
      m[k] = 0
      m[k + 1] = 0
      continue
    }
    const a = m[k] / d
    const b = m[k + 1] / d
    const s = a * a + b * b
    if (s > 9) {
      const t = 3 / Math.sqrt(s)
      m[k] = t * a * d
      m[k + 1] = t * b * d
    }
  }
  return m
}

// Builds an SVG path through the points using cubic Bezier segments.
function monotonePath(pts: Pt[]): string {
  if (pts.length === 0) return ""
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  if (pts.length === 1) return d
  const m = monotoneTangents(pts)
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[k]
    const p1 = pts[k + 1]
    const h = (p1.x - p0.x) / 3
    const c1y = p0.y + m[k] * h
    const c2y = p1.y - m[k + 1] * h
    d += ` C${(p0.x + h).toFixed(2)},${c1y.toFixed(2)} ${(p1.x - h).toFixed(2)},${c2y.toFixed(2)} ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`
  }
  return d
}

export function WaveChart({ series, labels, height, zeroLine = false, marker }: WaveChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = series.reduce((max, s) => Math.max(max, s.values.length), labels.length)

  // Y domain: min..max across all series, always including 0 when required, plus padding.
  const all = series.flatMap((s) => s.values).filter(Number.isFinite)
  let lo = all.length ? Math.min(...all) : 0
  let hi = all.length ? Math.max(...all) : 1
  if (zeroLine || lo < 0) {
    lo = Math.min(lo, 0)
    hi = Math.max(hi, 0)
  }
  const span = hi - lo || 1
  lo -= span * 0.12
  hi += span * 0.12

  const innerW = Math.max(0, width - PAD_X * 2)
  const innerH = Math.max(1, height - PAD_TOP - PAD_BOTTOM)
  const bottom = PAD_TOP + innerH

  const xAt = (i: number) => (n <= 1 ? PAD_X + innerW / 2 : PAD_X + (i / (n - 1)) * innerW)
  const yAt = (v: number) => PAD_TOP + (1 - (v - lo) / (hi - lo)) * innerH

  const clampIndex = (i: number) => Math.min(n - 1, Math.max(0, i))
  const indexFromPx = (px: number) =>
    n <= 1 || innerW <= 0 ? 0 : clampIndex(Math.round(((px - PAD_X) / innerW) * (n - 1)))

  const handlePointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setActive(indexFromPx(e.clientX - rect.left))
  }

  const handleKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    const dir = e.key === "ArrowLeft" ? -1 : 1
    setActive((a) => clampIndex((a ?? 0) + dir))
  }

  const handleFocus = (_e: FocusEvent<SVGSVGElement>) => setActive((a) => a ?? 0)
  const handleBlur = (_e: FocusEvent<SVGSVGElement>) => setActive(null)

  // Sparse x labels: keep them at least ~72px apart.
  const maxLabels = Math.max(2, Math.floor(innerW / 72))
  const labelStep = Math.max(1, Math.ceil(n / maxLabels))

  const glowId = `${uid}-glow`
  const summary = `Wave chart of ${series.map((s) => s.label).join(" and ")}, ${n} points. Use the left and right arrow keys to inspect values.`

  const activeX = active !== null ? xAt(active) : 0
  const flipTooltip = activeX + TIP_OFFSET + TIP_MAX_WIDTH > width
  const tooltipLeft = flipTooltip
    ? Math.max(0, activeX - TIP_OFFSET - TIP_MAX_WIDTH)
    : activeX + TIP_OFFSET

  const markerX = marker && marker.index >= 0 && marker.index < n ? xAt(marker.index) : null
  const markerOnRight = marker ? marker.index > n / 2 : false

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      <style>{`
        @keyframes wave-chart-shimmer {
          from { stroke-dashoffset: 0.12; }
          to { stroke-dashoffset: -1; }
        }
        .wave-chart-shimmer {
          stroke-dasharray: 0.12 1;
          animation: wave-chart-shimmer 4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .wave-chart-shimmer {
            display: none;
          }
        }
      `}</style>

      {width > 0 && n > 0 && (
        <>
          <svg
            role="img"
            aria-label={summary}
            tabIndex={0}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block cursor-crosshair select-none rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            style={{ touchAction: "pan-y" }}
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setActive(null)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          >
            <defs>
              <filter id={glowId} x="-10%" y="-20%" width="120%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
              {series.map((s, i) => (
                <g key={s.key}>
                  <linearGradient id={`${uid}-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={s.fill ?? s.color} stopOpacity={0.35} />
                    <stop offset="1" stopColor={s.fill ?? s.color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`${uid}-shimmer-${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
                    <stop offset="0.5" stopColor="#ffffff" stopOpacity={0.7} />
                    <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </g>
              ))}
            </defs>

            {/* Zero line and the region below zero */}
            {zeroLine && (
              <>
                <rect
                  x={PAD_X}
                  y={yAt(0)}
                  width={innerW}
                  height={Math.max(0, bottom - yAt(0))}
                  style={{ fill: "var(--coral)" }}
                  fillOpacity={0.08}
                />
                <line
                  x1={PAD_X}
                  x2={PAD_X + innerW}
                  y1={yAt(0)}
                  y2={yAt(0)}
                  strokeWidth={1}
                  className="stroke-slate-500/40"
                />
              </>
            )}

            {/* Marker */}
            {marker && markerX !== null && (
              <>
                <line
                  x1={markerX}
                  x2={markerX}
                  y1={PAD_TOP}
                  y2={bottom}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  style={{ stroke: "var(--mint)" }}
                />
                <text
                  x={markerX + (markerOnRight ? -6 : 6)}
                  y={16}
                  fontSize={11}
                  textAnchor={markerOnRight ? "end" : "start"}
                  className="fill-slate-600 dark:fill-slate-300"
                >
                  {marker.label}
                </text>
              </>
            )}

            {series.map((s, i) => {
              const pts = s.values.map((v, j) => ({ x: xAt(j), y: yAt(v) }))
              if (pts.length === 0) return null
              const d = monotonePath(pts)
              const first = pts[0]
              const last = pts[pts.length - 1]
              const area = `${d} L${last.x.toFixed(2)},${bottom} L${first.x.toFixed(2)},${bottom} Z`
              return (
                <g key={s.key}>
                  {/* Area fill */}
                  <motion.path
                    d={area}
                    fill={`url(#${uid}-fill-${i})`}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={reduce ? undefined : { opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  />

                  {/* Echo: thin faint copy offset downward */}
                  <path
                    d={d}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={1}
                    strokeOpacity={0.15}
                    transform="translate(0 6)"
                  />

                  {/* Glow: blurred copy of the main stroke */}
                  <motion.path
                    d={d}
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={reduce ? undefined : { pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={4}
                    strokeOpacity={0.6}
                    filter={`url(#${glowId})`}
                  />

                  {/* Crisp main stroke */}
                  <motion.path
                    d={d}
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={reduce ? undefined : { pathLength: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />

                  {/* Shimmer travelling along the stroke */}
                  <path
                    d={d}
                    pathLength={1}
                    className="wave-chart-shimmer"
                    fill="none"
                    stroke={`url(#${uid}-shimmer-${i})`}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </g>
              )
            })}

            {/* Scrubber line and snapped dots */}
            {active !== null && (
              <>
                <line
                  x1={activeX}
                  x2={activeX}
                  y1={PAD_TOP}
                  y2={bottom}
                  strokeWidth={1}
                  style={{ stroke: "var(--amber)" }}
                  strokeOpacity={0.7}
                />
                {series.map((s) =>
                  active < s.values.length ? (
                    <g key={s.key}>
                      <circle
                        cx={activeX}
                        cy={yAt(s.values[active])}
                        r={5}
                        fill={s.color}
                        fillOpacity={0.6}
                        filter={`url(#${glowId})`}
                      />
                      <circle
                        cx={activeX}
                        cy={yAt(s.values[active])}
                        r={3.5}
                        fill={s.color}
                        stroke="#ffffff"
                        strokeOpacity={0.8}
                        strokeWidth={1}
                      />
                    </g>
                  ) : null,
                )}
              </>
            )}

            {/* X-axis labels */}
            {labels.map((label, i) =>
              i % labelStep === 0 && i < n ? (
                <text
                  key={i}
                  x={xAt(i)}
                  y={height - 6}
                  fontSize={11}
                  textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                  className="fill-slate-500 dark:fill-slate-400"
                >
                  {label}
                </text>
              ) : null,
            )}
          </svg>

          {active !== null && active < n && (
            <div
              className="pointer-events-none absolute top-2 w-max max-w-[200px] rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-sm text-slate-800 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
              style={{ left: tooltipLeft }}
            >
              <p className="font-medium">{labels[active] ?? ""}</p>
              <ul className="mt-1 space-y-0.5">
                {series.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto pl-3 tabular-nums">
                      {active < s.values.length ? formatINR(s.values[active]) : "–"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

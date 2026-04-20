'use client'

import { useMemo } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts'
import type { RRGSeries } from '@/lib/rrg'
import { QUADRANT_META, quadrantOf } from '@/lib/rrg'

// Deterministic per-ticker color (cycled palette).
const TICKER_PALETTE = [
  '#16A34A', '#2563EB', '#CA8A04', '#DC2626', '#7C3AED',
  '#0891B2', '#DB2777', '#EA580C', '#059669', '#4F46E5',
  '#B45309', '#9333EA', '#0EA5E9', '#65A30D', '#E11D48',
]

function colorForTicker(idx: number): string {
  return TICKER_PALETTE[idx % TICKER_PALETTE.length]
}

interface TailPoint {
  x: number
  y: number
  date: string
  ticker: string
  isHead: boolean
  tailIdx: number
}

interface Props {
  series: RRGSeries[]
  /** How many most-recent weekly points form the visible tail. */
  tailLength?: number
}

export function RRGChart({ series, tailLength = 8 }: Props) {
  const { perTicker, xMin, xMax, yMin, yMax } = useMemo(() => {
    const per: Array<{ ticker: string; color: string; points: TailPoint[] }> = []
    let lo = 100
    let hi = 100
    let loy = 100
    let hiy = 100

    series.forEach((s, i) => {
      if (s.points.length === 0) return
      const tail = s.points.slice(-tailLength)
      const color = colorForTicker(i)
      const pts: TailPoint[] = tail.map((p, idx) => ({
        x: p.rsRatio,
        y: p.rsMomentum,
        date: p.date,
        ticker: s.ticker,
        isHead: idx === tail.length - 1,
        tailIdx: idx,
      }))
      for (const p of pts) {
        if (p.x < lo) lo = p.x
        if (p.x > hi) hi = p.x
        if (p.y < loy) loy = p.y
        if (p.y > hiy) hiy = p.y
      }
      per.push({ ticker: s.ticker, color, points: pts })
    })

    // Symmetric padding around 100 so quadrants are visually balanced.
    const padX = Math.max(2, (hi - lo) * 0.15, 100 - lo, hi - 100) + 2
    const padY = Math.max(2, (hiy - loy) * 0.15, 100 - loy, hiy - 100) + 2
    return {
      perTicker: per,
      xMin: 100 - padX,
      xMax: 100 + padX,
      yMin: 100 - padY,
      yMax: 100 + padY,
    }
  }, [series, tailLength])

  if (perTicker.length === 0) {
    return (
      <div className="flex h-[480px] items-center justify-center s-card">
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Data tidak cukup untuk menghitung RRG. Perlu setidaknya ~16 minggu data historis.
        </p>
      </div>
    )
  }

  return (
    <div className="s-card p-4 sm:p-5">
      <div className="h-[520px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 32, left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />

            {/* Quadrant background fills */}
            <ReferenceArea
              x1={100} x2={xMax} y1={100} y2={yMax}
              fill={QUADRANT_META.leading.bg} stroke="none"
            />
            <ReferenceArea
              x1={100} x2={xMax} y1={yMin} y2={100}
              fill={QUADRANT_META.weakening.bg} stroke="none"
            />
            <ReferenceArea
              x1={xMin} x2={100} y1={yMin} y2={100}
              fill={QUADRANT_META.lagging.bg} stroke="none"
            />
            <ReferenceArea
              x1={xMin} x2={100} y1={100} y2={yMax}
              fill={QUADRANT_META.improving.bg} stroke="none"
            />

            <XAxis
              type="number"
              dataKey="x"
              domain={[xMin, xMax]}
              tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-soft)' }}
            >
              <Label value="JdK RS-Ratio →" position="insideBottom" offset={-12} style={{ fill: 'var(--ink-muted)', fontSize: 11 }} />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              domain={[yMin, yMax]}
              tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-soft)' }}
            >
              <Label value="JdK RS-Momentum ↑" angle={-90} position="insideLeft" style={{ fill: 'var(--ink-muted)', fontSize: 11, textAnchor: 'middle' }} />
            </YAxis>

            <ReferenceLine x={100} stroke="var(--ink-muted)" strokeOpacity={0.4} />
            <ReferenceLine y={100} stroke="var(--ink-muted)" strokeOpacity={0.4} />

            <Tooltip
              content={<RRGTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: 'var(--ink-muted)' }}
            />

            {perTicker.map((t) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const renderDot = (props: any) =>
                <RRGDot {...(props as DotProps)} color={t.color} />
              return (
                <Scatter
                  key={t.ticker}
                  name={t.ticker}
                  data={t.points}
                  fill={t.color}
                  line={{ stroke: t.color, strokeWidth: 1.5, strokeOpacity: 0.55 }}
                  lineType="joint"
                  shape={renderDot}
                />
              )
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {perTicker.map((t) => {
          const head = t.points[t.points.length - 1]
          const q = quadrantOf({ rsRatio: head.x, rsMomentum: head.y })
          return (
            <div key={t.ticker} className="flex items-center gap-2 text-xs">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
              <span className="num font-semibold" style={{ color: 'var(--ink)' }}>{t.ticker}</span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
                style={{ background: QUADRANT_META[q].bg, color: QUADRANT_META[q].color }}
              >
                {QUADRANT_META[q].label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: TailPoint
  color: string
}

function RRGDot({ cx, cy, payload, color }: DotProps) {
  if (cx == null || cy == null || !payload) return null
  const { isHead, tailIdx } = payload
  if (isHead) {
    // Head: solid filled circle, larger, with ticker label
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={1.5} />
        <text
          x={cx + 9}
          y={cy - 8}
          fontSize={11}
          fontWeight={600}
          fill="var(--ink)"
          style={{ pointerEvents: 'none' }}
        >
          {payload.ticker}
        </text>
      </g>
    )
  }
  // Tail: smaller, fading circles (opacity grows toward head)
  const opacity = 0.25 + 0.55 * (tailIdx / 10)
  return <circle cx={cx} cy={cy} r={2.5} fill={color} opacity={opacity} />
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: TailPoint }>
}

function RRGTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  const q = quadrantOf({ rsRatio: p.x, rsMomentum: p.y })
  return (
    <div
      className="rounded-md p-2 text-xs shadow-md"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)' }}
    >
      <div className="font-semibold num" style={{ color: 'var(--ink)' }}>{p.ticker}</div>
      <div style={{ color: 'var(--ink-muted)' }}>{p.date}</div>
      <div className="mt-1 num tabular" style={{ color: 'var(--ink)' }}>
        RS-Ratio: <span className="font-semibold">{p.x.toFixed(2)}</span>
      </div>
      <div className="num tabular" style={{ color: 'var(--ink)' }}>
        RS-Mom: <span className="font-semibold">{p.y.toFixed(2)}</span>
      </div>
      <div className="mt-1">
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
          style={{ background: QUADRANT_META[q].bg, color: QUADRANT_META[q].color }}
        >
          {QUADRANT_META[q].label}
        </span>
      </div>
    </div>
  )
}

/**
 * Relative Rotation Graph (RRG) computation.
 *
 * The exact JdK RS-Ratio / RS-Momentum formulas are proprietary, but the
 * widely-accepted open approximation (used by StockCharts clones and many
 * academic papers) is:
 *
 *   RS[i]         = priceSec[i] / priceBench[i] * 100
 *   RS-Ratio[i]   = 100 + scale * zscore(RS[i]; window = N)
 *   RS-Momentum[i]= 100 + scale * zscore(delta(RS-Ratio)[i]; window = M)
 *
 * where zscore uses rolling mean and population stdev over the window,
 * and `scale` is chosen so typical series sit in the 95–105 range.
 *
 * The absolute values of the axes are less important than the *relative*
 * position of tickers in the plane — the 100/100 point is the benchmark.
 */

export interface Bar {
  date: string // yyyy-mm-dd
  close: number
}

export interface RRGPoint {
  date: string
  rsRatio: number
  rsMomentum: number
}

export interface RRGSeries {
  ticker: string
  points: RRGPoint[]
}

/** Align two bar series by date — keep only dates present in both. */
export function alignSeries(
  sec: Bar[],
  bench: Bar[]
): { dates: string[]; sec: number[]; bench: number[] } {
  const benchMap = new Map(bench.map((b) => [b.date, b.close]))
  const dates: string[] = []
  const sv: number[] = []
  const bv: number[] = []
  for (const s of sec) {
    const bc = benchMap.get(s.date)
    if (typeof bc === 'number' && bc > 0 && s.close > 0) {
      dates.push(s.date)
      sv.push(s.close)
      bv.push(bc)
    }
  }
  return { dates, sec: sv, bench: bv }
}

function rollingMean(arr: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(arr.length).fill(null)
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
    if (i >= window) sum -= arr[i - window]
    if (i >= window - 1) out[i] = sum / window
  }
  return out
}

function rollingStdev(
  arr: number[],
  window: number,
  means: (number | null)[]
): (number | null)[] {
  const out: (number | null)[] = new Array(arr.length).fill(null)
  for (let i = window - 1; i < arr.length; i++) {
    const m = means[i]!
    let sq = 0
    for (let j = i - window + 1; j <= i; j++) {
      const d = arr[j] - m
      sq += d * d
    }
    out[i] = Math.sqrt(sq / window)
  }
  return out
}

export interface ComputeOptions {
  /** Rolling window length for RS-Ratio normalization (weeks). */
  ratioWindow?: number
  /** Rolling window length for RS-Momentum normalization (weeks). */
  momentumWindow?: number
  /** Scale factor for z-score (default 5 — conventional JdK-style range). */
  scale?: number
}

/**
 * Compute RRG (RS-Ratio, RS-Momentum) series for one security vs a benchmark.
 * Inputs are aligned weekly close prices.
 */
export function computeRRG(
  sec: Bar[],
  bench: Bar[],
  opts: ComputeOptions = {}
): RRGPoint[] {
  const ratioWindow = opts.ratioWindow ?? 14
  const momentumWindow = opts.momentumWindow ?? 14
  const scale = opts.scale ?? 5

  const { dates, sec: sv, bench: bv } = alignSeries(sec, bench)
  if (dates.length < Math.max(ratioWindow, momentumWindow) + 2) return []

  // Raw RS
  const rs: number[] = sv.map((p, i) => (p / bv[i]) * 100)

  // RS-Ratio = 100 + scale * zscore(RS)
  const rsMean = rollingMean(rs, ratioWindow)
  const rsStd = rollingStdev(rs, ratioWindow, rsMean)
  const rsRatio: (number | null)[] = rs.map((v, i) => {
    const m = rsMean[i]
    const s = rsStd[i]
    if (m === null || s === null || s === 0) return null
    return 100 + scale * ((v - m) / s)
  })

  // Momentum basis: first difference of RS-Ratio
  const rrDelta: (number | null)[] = rsRatio.map((v, i) => {
    if (i === 0 || v === null || rsRatio[i - 1] === null) return null
    return v - (rsRatio[i - 1] as number)
  })

  // Normalize the delta with rolling z-score → RS-Momentum
  // Treat nulls by copying last valid value for window math; compute only where full window of values exists.
  const deltaValues: number[] = []
  const deltaIdx: number[] = []
  for (let i = 0; i < rrDelta.length; i++) {
    const v = rrDelta[i]
    if (v !== null) {
      deltaValues.push(v)
      deltaIdx.push(i)
    }
  }
  const dMean = rollingMean(deltaValues, momentumWindow)
  const dStd = rollingStdev(deltaValues, momentumWindow, dMean)
  const rsMomentum: (number | null)[] = new Array(rs.length).fill(null)
  for (let k = 0; k < deltaValues.length; k++) {
    const m = dMean[k]
    const s = dStd[k]
    if (m === null || s === null || s === 0) continue
    const i = deltaIdx[k]
    rsMomentum[i] = 100 + scale * ((deltaValues[k] - m) / s)
  }

  const out: RRGPoint[] = []
  for (let i = 0; i < dates.length; i++) {
    const r = rsRatio[i]
    const m = rsMomentum[i]
    if (r === null || m === null) continue
    out.push({ date: dates[i], rsRatio: r, rsMomentum: m })
  }
  return out
}

export type Quadrant = 'leading' | 'weakening' | 'lagging' | 'improving'

export function quadrantOf(p: { rsRatio: number; rsMomentum: number }): Quadrant {
  if (p.rsRatio >= 100 && p.rsMomentum >= 100) return 'leading'
  if (p.rsRatio >= 100 && p.rsMomentum < 100) return 'weakening'
  if (p.rsRatio < 100 && p.rsMomentum < 100) return 'lagging'
  return 'improving'
}

export const QUADRANT_META: Record<Quadrant, { label: string; color: string; bg: string }> = {
  leading:   { label: 'Leading',   color: '#10B981', bg: 'rgba(167, 243, 208, 0.45)' }, // mint
  weakening: { label: 'Weakening', color: '#F59E0B', bg: 'rgba(253, 230, 138, 0.50)' }, // lemon
  lagging:   { label: 'Lagging',   color: '#F43F5E', bg: 'rgba(254, 202, 202, 0.45)' }, // blush
  improving: { label: 'Improving', color: '#3B82F6', bg: 'rgba(191, 219, 254, 0.50)' }, // sky
}

export const DEFAULT_TIME_GRANULARITY = 5

export function normalizeTimeGranularity(granularity?: number | null): number {
  const value = Number(granularity)
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_TIME_GRANULARITY
  }
  return Math.max(1, Math.floor(value))
}

export function buildTimelineTimePoints(duration: number, granularity?: number | null): number[] {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0
  const safeGranularity = normalizeTimeGranularity(granularity)

  if (safeDuration <= 0) {
    return [0]
  }

  const points: number[] = []
  for (let t = 0; t <= safeDuration; t += safeGranularity) {
    points.push(t)
  }

  const lastPoint = points.length > 0 ? points[points.length - 1] : undefined
  if (lastPoint === undefined || lastPoint < safeDuration) {
    points.push(safeDuration)
  }

  return points
}

export function getTimelineIndex(
  currentTime: number,
  granularity: number | null | undefined,
  seriesLength: number,
): number {
  if (!Number.isFinite(seriesLength) || seriesLength <= 0) {
    return -1
  }

  const safeTime = Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0
  const safeGranularity = normalizeTimeGranularity(granularity)
  const rawIndex = Math.floor(safeTime / safeGranularity)
  return Math.max(0, Math.min(rawIndex, seriesLength - 1))
}

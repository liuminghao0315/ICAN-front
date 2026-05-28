export const PREVIEW_MAX_WIDTH = 160
export const PREVIEW_MAX_HEIGHT = 90

export type PreviewSize = {
  width: number
  height: number
}

export function computePreviewSize(
  videoWidth: number,
  videoHeight: number,
  maxWidth = PREVIEW_MAX_WIDTH,
  maxHeight = PREVIEW_MAX_HEIGHT,
): PreviewSize {
  if (videoWidth <= 0 || videoHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return {
      width: maxWidth,
      height: maxHeight,
    }
  }

  const scale = Math.min(maxWidth / videoWidth, maxHeight / videoHeight)

  return {
    width: Math.max(1, Math.round(videoWidth * scale)),
    height: Math.max(1, Math.round(videoHeight * scale)),
  }
}

export function clampPreviewOffset(
  rawCenterX: number,
  trackWidth: number,
  previewWidth: number,
): number {
  const maxLeft = Math.max(0, trackWidth - previewWidth)
  const rawLeft = rawCenterX - previewWidth / 2
  return Math.max(0, Math.min(maxLeft, rawLeft))
}

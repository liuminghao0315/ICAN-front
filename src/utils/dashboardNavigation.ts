import type { VideoInfo } from '@/api'
import type { AnalysisTaskVO } from '@/types'

export function resolveRecentVideoRoute(video: Pick<VideoInfo, 'id'>) {
  return '/records'
}

export function resolveRecentTaskRoute(task: Pick<AnalysisTaskVO, 'id' | 'status' | 'resultId'>) {
  if (task.status === 'COMPLETED' && task.resultId) {
    return `/analysis/${task.resultId}`
  }

  return '/records'
}

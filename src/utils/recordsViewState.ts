/*
 * SynSight - 高校内容风险分析平台
 * Copyright (c) 2026 Liu Minghao. All rights reserved.
 */

export type RecordsViewState = 'loading' | 'error' | 'data' | 'empty'

interface DeriveRecordsViewStateInput {
  loading: boolean
  loadError: string
  recordCount: number
}

export function deriveRecordsViewState(input: DeriveRecordsViewStateInput): RecordsViewState {
  if (input.loading) return 'loading'
  if (input.loadError) return 'error'
  if (input.recordCount > 0) return 'data'
  return 'empty'
}

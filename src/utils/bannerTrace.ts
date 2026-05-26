type BannerTraceEntry = {
  ts: string
  message: string
  payload?: unknown
}

const TRACE_KEY = '__BANNER_TRACE__'
const MAX_TRACE_ENTRIES = 500

function getTraceStore(): BannerTraceEntry[] {
  const globalObj = window as typeof window & { __BANNER_TRACE__?: BannerTraceEntry[] }
  if (!Array.isArray(globalObj[TRACE_KEY])) {
    globalObj[TRACE_KEY] = []
  }
  return globalObj[TRACE_KEY]!
}

export function pushBannerTrace(message: string, payload?: unknown) {
  const store = getTraceStore()
  store.push({
    ts: new Date().toISOString(),
    message,
    payload,
  })
  if (store.length > MAX_TRACE_ENTRIES) {
    store.splice(0, store.length - MAX_TRACE_ENTRIES)
  }
}

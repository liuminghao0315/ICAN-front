type WsRuntimeTraceEntry = {
  ts: string
  event: 'CONNECT_ATTEMPT' | 'OPEN' | 'CLOSE' | 'RECONNECT_SCHEDULE' | 'RECONNECT_STOP' | 'RECONNECT_KEEPALIVE_SCHEDULE' | 'HTTP_RECOVER_RECONNECT_HINT' | 'TOKEN_REFRESH_SUCCESS'
  payload?: unknown
}

const TRACE_KEY = '__WS_RUNTIME_TRACE__'
const MAX_TRACE_ENTRIES = 200

function getTraceStore(): WsRuntimeTraceEntry[] {
  const globalObj = window as typeof window & { __WS_RUNTIME_TRACE__?: WsRuntimeTraceEntry[] }
  if (!Array.isArray(globalObj[TRACE_KEY])) {
    globalObj[TRACE_KEY] = []
  }
  return globalObj[TRACE_KEY]!
}

export function pushWsRuntimeTrace(
  event: WsRuntimeTraceEntry['event'],
  payload?: unknown,
) {
  const store = getTraceStore()
  store.push({
    ts: new Date().toISOString(),
    event,
    payload,
  })
  if (store.length > MAX_TRACE_ENTRIES) {
    store.splice(0, store.length - MAX_TRACE_ENTRIES)
  }
}

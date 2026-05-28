/*
 * SynSight - 高校内容风险分析平台
 * Copyright (c) 2026 Liu Minghao. All rights reserved.
 */

export interface MessageRateLimiter {
  shouldNotify: (key: string, now?: number) => boolean
}

export function createMessageRateLimiter(cooldownMs: number): MessageRateLimiter {
  const lastShownAt = new Map<string, number>()

  return {
    shouldNotify(key: string, now = Date.now()) {
      const lastTime = lastShownAt.get(key)
      if (typeof lastTime === 'number' && now - lastTime < cooldownMs) {
        return false
      }
      lastShownAt.set(key, now)
      return true
    }
  }
}

const globalMessageRateLimiter = createMessageRateLimiter(4000)

export function shouldShowRateLimitedMessage(key: string, now?: number): boolean {
  return globalMessageRateLimiter.shouldNotify(key, now)
}

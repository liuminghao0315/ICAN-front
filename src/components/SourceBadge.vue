<template>
  <span class="source-badge" :class="[`platform-${info.key}`, size]">
    <span class="badge-icon" v-html="info.icon"></span>
    <span class="badge-label">{{ info.label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface PlatformInfo {
  key: string
  label: string
  icon: string
}

const props = withDefaults(defineProps<{
  url?: string | null
  size?: 'sm' | 'md'
}>(), {
  size: 'sm'
})

// 各平台品牌 SVG（16×16 viewBox，单色路径，通过 CSS currentColor 着色）
const PLATFORM_ICONS: Record<string, string> = {
  bilibili: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>`,
  douyin: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  weibo: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm2.301-1.338c-.145.24-.462.35-.704.244-.236-.104-.313-.378-.165-.614.145-.235.45-.344.688-.242.242.1.324.378.181.612zm2.652-5.637c-1.93-.498-4.116.46-4.959 2.149-.848 1.703-.026 3.555 1.91 4.135 2.008.604 4.336-.418 5.143-2.265.804-1.836-.147-3.617-2.094-4.019zm5.565-3.559c-.49-.144-1.011-.228-1.549-.228-3.418 0-6.19 2.772-6.19 6.19 0 .538.084 1.059.228 1.549.144.49.228 1.011.228 1.549 0 3.418-2.772 6.19-6.19 6.19-.538 0-1.059-.084-1.549-.228C2.772 21.228 0 18.456 0 15.038c0-.538.084-1.059.228-1.549C.372 12.999.456 12.478.456 11.94c0-3.418 2.772-6.19 6.19-6.19.538 0 1.059.084 1.549.228.49.144 1.011.228 1.549.228 3.418 0 6.19-2.772 6.19-6.19 0-.538-.084-1.059-.228-1.549C15.562.772 18.334 0 21.752 0c.538 0 1.059.084 1.549.228C24.228.372 24 2.772 24 6.19c0 .538-.084 1.059-.228 1.549-.144.49-.228 1.011-.228 1.549 0 3.418 2.772 6.19 6.19 6.19z"/></svg>`,
  kuaishou: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.5 16.5l-6-3.75V9.75l6-3.75v10.5z"/></svg>`,
  xigua: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 13.5h-9v-7h9v7z"/></svg>`,
  local: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>`,
  web: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`
}

const PLATFORM_MAP: Array<{
  key: string
  label: string
  test: (host: string) => boolean
}> = [
  { key: 'bilibili', label: '哔哩哔哩', test: h => h.includes('bilibili') || h.includes('b23.tv') },
  { key: 'douyin',   label: '抖音',     test: h => h.includes('douyin') || h.includes('iesdouyin') || h.includes('tiktok') },
  { key: 'youtube',  label: 'YouTube',  test: h => h.includes('youtube') || h.includes('youtu.be') },
  { key: 'weibo',    label: '微博',     test: h => h.includes('weibo') },
  { key: 'kuaishou', label: '快手',     test: h => h.includes('kuaishou') || h.includes('gifshow') },
  { key: 'xigua',    label: '西瓜视频', test: h => h.includes('ixigua') },
]

const info = computed<PlatformInfo>(() => {
  if (!props.url) {
    return { key: 'local', label: '本地文件', icon: PLATFORM_ICONS.local }
  }
  try {
    const host = new URL(props.url).hostname.toLowerCase()
    for (const p of PLATFORM_MAP) {
      if (p.test(host)) {
        return { key: p.key, label: p.label, icon: PLATFORM_ICONS[p.key] }
      }
    }
  } catch { /* ignore */ }
  return { key: 'web', label: '网络采集', icon: PLATFORM_ICONS.web }
})
</script>

<style scoped lang="scss">
.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 5px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
  transition: opacity .18s;

  &.sm {
    font-size: 11px;
    padding: 2px 6px 2px 4px;
  }
  &.md {
    font-size: 12px;
    padding: 3px 8px 3px 5px;
  }
}

.badge-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 13px;
  height: 13px;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.badge-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
}

// ── 各平台品牌配色 ──────────────────────────────────────────
.platform-bilibili {
  background: rgba(#00a1d6, .1);
  color: #00a1d6;
  border: 1px solid rgba(#00a1d6, .2);
}
.platform-douyin {
  background: rgba(#161823, .08);
  color: #161823;
  border: 1px solid rgba(#161823, .15);
}
.platform-youtube {
  background: rgba(#ff0000, .08);
  color: #cc0000;
  border: 1px solid rgba(#ff0000, .15);
}
.platform-weibo {
  background: rgba(#e6162d, .08);
  color: #e6162d;
  border: 1px solid rgba(#e6162d, .15);
}
.platform-kuaishou {
  background: rgba(#ff4906, .08);
  color: #e03d00;
  border: 1px solid rgba(#ff4906, .15);
}
.platform-xigua {
  background: rgba(#ff6633, .08);
  color: #e05520;
  border: 1px solid rgba(#ff6633, .15);
}
.platform-local {
  background: rgba(#4b70e2, .08);
  color: #4b70e2;
  border: 1px solid rgba(#4b70e2, .15);
}
.platform-web {
  background: rgba(#8a9bb0, .1);
  color: #6b7a99;
  border: 1px solid rgba(#8a9bb0, .2);
}
</style>

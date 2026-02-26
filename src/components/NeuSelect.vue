<template>
  <div class="neu-select" :class="{ open: isOpen, disabled }" ref="selectRef">
    <!-- 触发器 -->
    <button class="neu-select-trigger" @click="toggle" :disabled="disabled" type="button">
      <span class="trigger-icon" v-if="$slots.icon"><slot name="icon" /></span>
      <span class="trigger-label" :class="{ placeholder: !modelValue }">
        {{ currentLabel }}
      </span>
      <span class="trigger-arrow">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>

    <!-- 弹出面板 -->
    <Teleport to="body">
      <Transition name="neu-dd">
        <div
          v-if="isOpen"
          class="neu-select-dropdown"
          :style="dropdownStyle"
          ref="dropdownRef"
        >
          <div class="dropdown-scroll">
            <button
              v-for="opt in options" :key="opt.value"
              class="dropdown-option"
              :class="{ active: modelValue === opt.value }"
              @click="select(opt.value)"
              type="button"
            >
              <span class="option-label">{{ opt.label }}</span>
              <span class="option-check" v-if="modelValue === opt.value">
                <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                  <path d="M1 4L4.5 7.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

export interface SelectOption {
  label: string
  value: string
}

const props = defineProps<{
  modelValue: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})
let repositionRafId: number | null = null
let initialRepositionTimer: number | null = null

const currentLabel = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue)
  return found ? found.label : (props.placeholder || '请选择')
})

const toggle = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    bindPositionListeners()
    nextTick(() => {
      // 首帧先定位，再在后续帧做一次校正，避免初次打开抖动
      positionDropdown()
      schedulePositionDropdown()
      window.requestAnimationFrame(() => schedulePositionDropdown())
      initialRepositionTimer = window.setTimeout(() => {
        schedulePositionDropdown()
      }, 80)
    })
  } else {
    unbindPositionListeners()
  }
}

const select = (val: string) => {
  emit('update:modelValue', val)
  isOpen.value = false
  unbindPositionListeners()
}

const positionDropdown = () => {
  if (!selectRef.value) return
  const rect = selectRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const dropUp = spaceBelow < 200

  dropdownStyle.value = {
    position: 'fixed',
    left: rect.left + 'px',
    width: Math.max(rect.width, 160) + 'px',
    // 与页面内其它下拉层级一致，避免压过全局 header
    zIndex: '300',
    ...(dropUp
      ? { bottom: (window.innerHeight - rect.top + 6) + 'px' }
      : { top: (rect.bottom + 6) + 'px' })
  }
}

const schedulePositionDropdown = () => {
  if (!isOpen.value) return
  if (repositionRafId !== null) return
  repositionRafId = window.requestAnimationFrame(() => {
    repositionRafId = null
    positionDropdown()
  })
}

const bindPositionListeners = () => {
  window.addEventListener('resize', schedulePositionDropdown)
  window.addEventListener('scroll', schedulePositionDropdown, true)
}

const unbindPositionListeners = () => {
  window.removeEventListener('resize', schedulePositionDropdown)
  window.removeEventListener('scroll', schedulePositionDropdown, true)
  if (repositionRafId !== null) {
    window.cancelAnimationFrame(repositionRafId)
    repositionRafId = null
  }
  if (initialRepositionTimer !== null) {
    window.clearTimeout(initialRepositionTimer)
    initialRepositionTimer = null
  }
}

const onClickOutside = (e: MouseEvent) => {
  if (!isOpen.value) return
  const target = e.target as Node
  if (selectRef.value?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  isOpen.value = false
  unbindPositionListeners()
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  unbindPositionListeners()
})
</script>

<style scoped lang="scss">
$neu-1: #ecf0f3;
$neu-2: #c8d0e7;
$white: #ffffff;
$gray: #8a9bb0;
$black: #1a1f2e;
$purple: #4b70e2;
$purple-light: #7c9df7;

// 触发器
.neu-select {
  position: relative;
  display: inline-flex;
}

.neu-select-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 12px;
  min-width: 120px;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  border-radius: 11px;
  background: linear-gradient(145deg, #ffffff, #dcdcdc);
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
  color: #4d5d7d;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;

  &:hover {
    box-shadow: 3px 3px 6px $neu-2, -3px -3px 6px $white;
    filter: drop-shadow(0 2px 6px rgba(100, 130, 200, 0.18));
    color: $black;
  }

  .open & {
    box-shadow: inset 3px 3px 7px $neu-2, inset -3px -3px 7px $white;
    border-color: rgba($purple, 0.3);
    color: $purple;
  }

  .disabled & {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.trigger-icon {
  display: flex;
  align-items: center;
  font-size: 13px;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.1));
  flex-shrink: 0;
}

.trigger-label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.placeholder {
    color: $gray;
  }
}

.trigger-arrow {
  display: flex;
  align-items: center;
  color: #4d5d7d;
  transition: transform 0.25s;
  flex-shrink: 0;

  .open & {
    transform: rotate(180deg);
    color: $purple;
  }
}

// 弹出面板
.neu-select-dropdown {
  background: $neu-1;
  border-radius: 14px;
  padding: 6px;
  box-shadow:
    10px 10px 24px darken($neu-2, 8%),
    -10px -10px 24px $white,
    0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.dropdown-scroll {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba($neu-2, 0.6);
    border-radius: 2px;
  }
}

.dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 9px 13px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: $black;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $neu-1;
    box-shadow: inset 3px 3px 7px $neu-2, inset -3px -3px 7px $white;
    color: $purple;
  }

  &.active {
    background: linear-gradient(135deg, rgba($purple, 0.08), rgba($purple-light, 0.06));
    color: $purple;
    font-weight: 600;
    box-shadow: inset 2px 2px 5px rgba($neu-2, 0.5), inset -2px -2px 5px rgba($white, 0.8);
  }
}

.option-check {
  display: flex;
  align-items: center;
  color: $purple;
  flex-shrink: 0;
}

// 动画
.neu-dd-enter-active {
  animation: neu-dd-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.neu-dd-leave-active {
  animation: neu-dd-out 0.15s ease;
}
@keyframes neu-dd-in {
  from { opacity: 0; transform: translateY(8px) scale(0.96); transform-origin: top left; }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes neu-dd-out {
  from { opacity: 1; transform-origin: top left; }
  to   { opacity: 0; transform: translateY(4px); }
}
</style>

<template>
  <div
    class="request-state"
    :class="[mode, sizeClass, { 'has-surface': surface }]"
    :style="stateStyle"
  >
    <div class="state-icon-wrap">
      <div class="state-icon-glow"></div>
      <el-icon class="state-icon" :class="{ spinning: mode === 'loading' }" :size="iconSize">
        <component :is="iconComponent" />
      </el-icon>
    </div>

    <h3 class="state-title">{{ title }}</h3>
    <p v-if="description" class="state-description">{{ description }}</p>

    <div v-if="showActions" class="state-actions">
      <button
        v-if="mode === 'error' && retryable"
        type="button"
        class="retry-btn"
        @click="emit('retry')"
      >
        <el-icon><RefreshRight /></el-icon>
        <span>{{ retryText }}</span>
      </button>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Loading, RefreshRight, WarningFilled } from '@element-plus/icons-vue'

interface Props {
  mode: 'loading' | 'error'
  title: string
  description?: string
  retryable?: boolean
  retryText?: string
  minHeight?: number | string
  size?: 'default' | 'small'
  surface?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  retryable: false,
  retryText: '重新加载',
  minHeight: 280,
  size: 'default',
  surface: false,
})

const emit = defineEmits<{
  retry: []
}>()

const slots = useSlots()

const iconComponent = computed(() => (props.mode === 'loading' ? Loading : WarningFilled))

const iconSize = computed(() => (props.size === 'small' ? 28 : 38))

const sizeClass = computed(() => (props.size === 'small' ? 'is-small' : 'is-default'))

const normalizedMinHeight = computed(() =>
  typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight
)

const stateStyle = computed(() => ({
  minHeight: normalizedMinHeight.value,
}))

const showActions = computed(() => (props.mode === 'error' && props.retryable) || !!slots.actions)
</script>

<style scoped lang="scss">
.request-state {
  --state-accent: #4f7cf7;
  --state-accent-soft: rgba(79, 124, 247, 0.14);
  --state-accent-border: rgba(79, 124, 247, 0.24);
  --state-error: #ef6b73;
  --state-error-soft: rgba(239, 107, 115, 0.14);
  --state-error-border: rgba(239, 107, 115, 0.24);

  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 24px;
  border-radius: 22px;
  box-sizing: border-box;

  &.has-surface {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015));
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  &.loading {
    .state-icon-wrap {
      background: var(--state-accent-soft);
      border-color: var(--state-accent-border);
    }

    .state-icon-glow {
      background: radial-gradient(circle, rgba(79, 124, 247, 0.36) 0%, rgba(79, 124, 247, 0) 72%);
    }

    .state-icon {
      color: var(--state-accent);
    }
  }

  &.error {
    .state-icon-wrap {
      background: var(--state-error-soft);
      border-color: var(--state-error-border);
    }

    .state-icon-glow {
      background: radial-gradient(circle, rgba(239, 107, 115, 0.32) 0%, rgba(239, 107, 115, 0) 72%);
    }

    .state-icon {
      color: var(--state-error);
    }
  }

  &.is-small {
    padding: 20px 16px;

    .state-icon-wrap {
      width: 58px;
      height: 58px;
      margin-bottom: 14px;
    }

    .state-title {
      font-size: 16px;
      margin-bottom: 8px;
    }

    .state-description {
      font-size: 13px;
      max-width: 340px;
    }
  }
}

.state-icon-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  overflow: hidden;
}

.state-icon-glow {
  position: absolute;
  inset: -18px;
  pointer-events: none;
}

.state-icon {
  position: relative;
  z-index: 1;

  &.spinning {
    animation: request-state-spin 1.1s linear infinite;
  }
}

.state-title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}

.state-description {
  margin: 0;
  max-width: 420px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-secondary);
}

.state-actions {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.retry-btn {
  appearance: none;
  border: 1px solid rgba(79, 124, 247, 0.28);
  background: rgba(79, 124, 247, 0.1);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 10px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(79, 124, 247, 0.42);
    background: rgba(79, 124, 247, 0.14);
  }
}

@keyframes request-state-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

:global(html[data-theme='dark'] .request-state) {
  &.has-surface {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.018), rgba(255, 255, 255, 0.008));
    border-color: rgba(255, 255, 255, 0.04);
  }
}
</style>

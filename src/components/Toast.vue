<template>
  <transition name="toast">
    <div v-if="message" class="toast-container">
      <div class="toast" :class="type">
        <div class="toast-icon">
          <span v-if="type === 'success'">✓</span>
          <span v-else-if="type === 'error'">✕</span>
          <span v-else>ℹ</span>
        </div>
        <div class="toast-content">
          <p class="toast-message">{{ message }}</p>
        </div>
        <button class="toast-close" @click="handleClose">×</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
export type ToastType = 'success' | 'error' | 'info'

interface Props {
  message: string
  type?: ToastType
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
})

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}
</script>

<style scoped lang="scss">
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 400px;
  padding: 16px 20px;
  background-color: $white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
  animation: slideInRight 0.3s ease-out;

  &.success {
    border-left: 4px solid #27ae60;
    
    .toast-icon {
      background-color: rgba(39, 174, 96, 0.1);
      color: #27ae60;
    }
  }

  &.error {
    border-left: 4px solid #e74c3c;
    
    .toast-icon {
      background-color: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }
  }

  &.info {
    border-left: 4px solid $purple;
    
    .toast-icon {
      background-color: rgba(75, 112, 226, 0.1);
      color: $purple;
    }
  }
}

.toast-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  margin: 0;
  font-size: 14px;
  color: $black;
  line-height: 1.5;
  word-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: $gray;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;

  &:hover {
    color: $black;
  }
}

// Toast动画
.toast-enter-active {
  animation: slideInRight 0.3s ease-out;
}

.toast-leave-active {
  animation: slideOutRight 0.3s ease-in;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>


<template>
  <div class="loading-state" :class="{ fullscreen: fullscreen, small: small }">
    <div class="loading-content">
      <el-icon class="loading-icon" :size="iconSize">
        <Loading class="rotating" />
      </el-icon>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

interface Props {
  text?: string
  fullscreen?: boolean
  small?: boolean
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  text: '加载中...',
  fullscreen: false,
  small: false,
  iconSize: 32
})
</script>

<style scoped lang="scss">
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
  
  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
    min-height: 100vh;
  }
  
  &.small {
    padding: 20px;
    min-height: 100px;
  }
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-icon {
  color: #4b70e2;
  animation: rotate 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}
</style>


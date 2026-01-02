<template>
  <div class="empty-state" :class="{ small: small }">
    <div class="empty-icon" v-if="icon">
      <el-icon :size="iconSize">
        <component :is="icon" />
      </el-icon>
    </div>
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.actions" class="empty-actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  icon?: Component | string
  title?: string
  description?: string
  small?: boolean
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  small: false,
  iconSize: 64
})
</script>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  min-height: 300px;
  
  &.small {
    padding: 40px 20px;
    min-height: 200px;
    
    .empty-icon {
      margin-bottom: 16px;
    }
    
    .empty-title {
      font-size: 16px;
    }
    
    .empty-description {
      font-size: 13px;
    }
  }
}

.empty-icon {
  margin-bottom: 24px;
  color: #a0a5a8;
  opacity: 0.6;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #181818;
  margin: 0 0 12px;
}

.empty-description {
  font-size: 14px;
  color: #909399;
  margin: 0 0 24px;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>


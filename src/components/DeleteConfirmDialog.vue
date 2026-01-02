<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="delete-dialog-overlay" v-if="visible" @click.self="handleCancel">
        <div class="delete-dialog">
          <div class="dialog-header">
            <h3 class="dialog-title">确认删除</h3>
            <button class="close-btn" @click="handleCancel">
              <el-icon><Close /></el-icon>
            </button>
          </div>
          
          <div class="dialog-content">
            <div class="warning-icon">
              <el-icon :size="48"><WarningFilled /></el-icon>
            </div>
            <p class="dialog-message">
              确定要删除视频 <strong>"{{ videoTitle }}"</strong> 吗？
            </p>
            <p class="dialog-warning">删除后无法恢复。</p>
          </div>
          
          <div class="dialog-actions">
            <button class="neu-btn cancel-btn" @click="handleCancel">
              取消
            </button>
            <button class="neu-btn delete-btn" @click="handleConfirm">
              <el-icon><Delete /></el-icon>
              删除
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Props {
  visible: boolean
  videoTitle: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

// 监听 ESC 键
watch(() => props.visible, (newVal) => {
  if (newVal) {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }
})
</script>

<style scoped lang="scss">
// 新拟态配色变量
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;
$danger: #f56c6c;

.delete-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.delete-dialog {
  background: $neu-1;
  border-radius: 20px;
  box-shadow: 
    8px 8px 20px rgba(209, 217, 230, 0.6),
    -8px -8px 20px rgba(255, 255, 255, 1),
    0 12px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(209, 217, 230, 0.3);
  min-width: 420px;
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  animation: dialogSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid rgba($neu-2, 0.3);
    background: transparent;
    
    .dialog-title {
      font-size: 17px;
      font-weight: 600;
      color: $black;
      margin: 0;
      letter-spacing: 0.3px;
    }
    
    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 10px;
      background: $neu-1;
      color: $gray;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 
        3px 3px 6px rgba(163, 177, 198, 0.4),
        -3px -3px 6px rgba(255, 255, 255, 0.9);
      
      .el-icon {
        font-size: 16px;
      }
      
      &:hover {
        color: $purple;
        transform: rotate(90deg);
      }
      
      &:active {
        box-shadow: 
          inset 3px 3px 6px rgba(163, 177, 198, 0.5),
          inset -3px -3px 6px rgba(255, 255, 255, 0.8);
      }
    }
  }
  
  .dialog-content {
    padding: 32px 24px;
    text-align: center;
    
    .warning-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(250, 173, 20, 0.12), rgba(250, 173, 20, 0.08));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: #faad14;
      box-shadow: 
        4px 4px 8px rgba(209, 217, 230, 0.4),
        -4px -4px 8px rgba(255, 255, 255, 0.9);
    }
    
    .dialog-message {
      font-size: 16px;
      color: $black;
      margin: 0 0 10px;
      line-height: 1.6;
      font-weight: 500;
      
      strong {
        color: $black;
        font-weight: 700;
      }
    }
    
    .dialog-warning {
      font-size: 13px;
      color: #909399;
      margin: 0;
      line-height: 1.5;
    }
  }
  
  .dialog-actions {
    display: flex;
    gap: 12px;
    padding: 18px 24px;
    border-top: 1px solid rgba($neu-2, 0.3);
    justify-content: flex-end;
    background: transparent;
  }
}

// 新拟态按钮
.neu-btn {
  background: $neu-1;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
  color: $gray;
  font-family: 'Montserrat', sans-serif;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
  justify-content: center;
  
  &:hover {
    box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
  }
  
  &:active {
    box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
  }
  
  &.cancel-btn {
    color: $gray;
    
    &:hover {
      color: $black;
    }
  }
  
  &.delete-btn {
    background: linear-gradient(135deg, #ff7875 0%, $danger 100%);
    color: #fff;
    box-shadow: 
      4px 4px 10px rgba(245, 108, 108, 0.25),
      -2px -2px 6px rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: linear-gradient(135deg, $danger 0%, #e74c3c 100%);
      box-shadow: 
        4px 4px 12px rgba(245, 108, 108, 0.35),
        -2px -2px 6px rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 
        inset 2px 2px 4px rgba(0, 0, 0, 0.2),
        inset -2px -2px 4px rgba(255, 255, 255, 0.1);
    }
  }
}

// 动画
@keyframes dialogSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}


// 模态框过渡动画
.modal-enter-active {
  animation: modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  animation: modalFadeOut 0.2s ease-out;
}

@keyframes modalFadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes modalFadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>


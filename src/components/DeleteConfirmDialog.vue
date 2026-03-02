<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="delete-dialog-overlay" v-if="visible" @mousedown.self="onOverlayMouseDown" @mouseup.self="onOverlayMouseUp">
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

// 模态框关闭逻辑：只有 mousedown 和 mouseup 都在外部才关闭
let mouseDownOnOverlay = false

const onOverlayMouseDown = () => {
  mouseDownOnOverlay = true
}

const onOverlayMouseUp = () => {
  if (mouseDownOnOverlay) {
    handleCancel()
  }
  mouseDownOnOverlay = false
}

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
// 扁平化配色变量
$neu-1: #F5F7FA;
$neu-2: #DCDFE6;
$white: #FFFFFF;
$gray: #a0a5a8;
$black: #181818;
$purple: #409EFF;
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
  background: $white;
  border-radius: 12px;
  box-shadow: none;
  border: 1px solid #EBEEF5;
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
      border: 1px solid $neu-2;
      border-radius: 8px;
      background: $white;
      color: $gray;
      cursor: pointer;
      transition: all 0.25s ease;

      .el-icon {
        font-size: 16px;
      }

      &:hover {
        color: $purple;
        border-color: $purple;
        transform: rotate(90deg);
      }

      &:active {
        background: $neu-1;
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
      background: rgba(250, 173, 20, 0.1);
      border: 1px solid rgba(250, 173, 20, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: #faad14;
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

// 扁平化按钮
.neu-btn {
  background: $white;
  border: 1px solid $neu-2;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
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
    border-color: $purple;
    color: $purple;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    background: $neu-1;
  }

  &.cancel-btn {
    color: $gray;

    &:hover {
      color: $black;
      border-color: $black;
    }
  }

  &.delete-btn {
    background: $danger;
    color: #fff !important;
    border: none;

    &:hover {
      background: #f78989;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      background: #dd6161;
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


import { ref } from 'vue'
import type { Ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

interface UseToastReturn {
  message: Ref<string>
  type: Ref<ToastType>
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

export function useToast(duration: number = 3000): UseToastReturn {
  const message = ref('')
  const type = ref<ToastType>('success')
  let timer: ReturnType<typeof setTimeout> | null = null

  const showToast = (msg: string, toastType: ToastType = 'success') => {
    message.value = msg
    type.value = toastType

    // 清除之前的定时器
    if (timer) {
      clearTimeout(timer)
    }

    // 自动隐藏
    timer = setTimeout(() => {
      hideToast()
    }, duration)
  }

  const hideToast = () => {
    message.value = ''
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return {
    message,
    type,
    showToast,
    hideToast,
  }
}


/**
 * 全局Toast提示工具
 * 使用Element Plus的ElMessage
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import type { MessageOptions } from 'element-plus'

/**
 * 显示成功提示
 */
export function showSuccess(message: string, duration: number = 3000) {
  ElMessage({
    message,
    type: 'success',
    duration,
    showClose: true
  })
}

/**
 * 显示错误提示
 */
export function showError(message: string, duration: number = 4000) {
  ElMessage({
    message,
    type: 'error',
    duration,
    showClose: true
  })
}

/**
 * 显示警告提示
 */
export function showWarning(message: string, duration: number = 3000) {
  ElMessage({
    message,
    type: 'warning',
    duration,
    showClose: true
  })
}

/**
 * 显示信息提示
 */
export function showInfo(message: string, duration: number = 3000) {
  ElMessage({
    message,
    type: 'info',
    duration,
    showClose: true
  })
}

/**
 * 显示确认对话框
 */
export async function showConfirm(
  message: string,
  title: string = '提示',
  type: 'warning' | 'info' | 'success' | 'error' = 'warning'
): Promise<void> {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type,
      distinguishCancelAndClose: true
    })
    // 用户点击确定，正常返回
  } catch {
    // 用户点击取消或关闭，抛出错误以便调用方可以区分
    throw new Error('用户取消操作')
  }
}

/**
 * 显示删除确认对话框
 */
export function showDeleteConfirm(message: string = '确定要删除吗？此操作不可恢复'): Promise<void> {
  return showConfirm(message, '删除确认', 'warning')
}

/**
 * 处理API错误并显示提示
 */
export function handleApiError(error: any, defaultMessage: string = '操作失败'): string {
  let errorMessage = defaultMessage

  if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
    errorMessage = '无法连接到服务器，请确保后端服务已启动'
  } else if (error.response) {
    // 服务器返回了错误响应
    errorMessage = error.response.data?.message || error.response.data?.error || defaultMessage
  } else if (error.request) {
    // 请求已发出但没有收到响应
    errorMessage = '请求超时，请检查网络连接或稍后重试'
  } else if (error.message) {
    errorMessage = error.message
  }

  showError(errorMessage)
  return errorMessage
}


import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用户状态管理
 * 使用 pinia-plugin-persistedstate 自动持久化到 localStorage
 * 存储 key 为 'user'，格式为 {token: string, userInfo: object}
 */
export const useUserStore = defineStore('user', () => {
  // 状态 - 初始值为 null，pinia persist 会自动从 localStorage 恢复
  const token = ref<string | null>(null)
  const userInfo = ref<{
    id: string
    username: string
    email: string
  } | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)

  // 方法
  const setToken = (newToken: string) => {
    token.value = newToken
    // 不需要手动写 localStorage，pinia persist 会自动处理
  }

  const setUserInfo = (info: typeof userInfo.value) => {
    userInfo.value = info
  }

  const logout = () => {
    token.value = null
    userInfo.value = null
    // 清除旧的 localStorage key（兼容性处理）
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    logout
  }
}, {
  persist: {
    key: 'user-store',  // 明确指定存储 key
    pick: ['token', 'userInfo']
  }
})


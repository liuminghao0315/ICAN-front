import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用户状态管理
 * 使用 pinia-plugin-persistedstate 自动持久化到 localStorage
 * 存储 key 为 'user'，格式为 {token: string, userInfo: object}
 */
export const useUserStore = defineStore('user', () => {
  // 状态 - 初始值为 null，pinia persist 会自动从 localStorage 恢复
  const token = ref<string | null>(null)  // accessToken
  const refreshToken = ref<string | null>(null)  // refreshToken
  const userInfo = ref<{
    id: string
    username: string
    email: string
    role?: string
    avatarUrl?: string
  } | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'Administrator')

  // 方法
  const setToken = (newToken: string) => {
    token.value = newToken
    // 不需要手动写 localStorage，pinia persist 会自动处理
  }

  const setRefreshToken = (newRefreshToken: string) => {
    refreshToken.value = newRefreshToken
  }

  const setTokens = (accessToken: string, newRefreshToken: string) => {
    token.value = accessToken
    refreshToken.value = newRefreshToken
  }

  const setUserInfo = (info: typeof userInfo.value) => {
    userInfo.value = info
  }

  const setAvatarUrl = (url: string) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, avatarUrl: url }
    }
  }

  const logout = () => {
    token.value = null
    refreshToken.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user-store')
  }

  return {
    token,
    refreshToken,
    userInfo,
    isLoggedIn,
    isAdmin,
    setToken,
    setRefreshToken,
    setTokens,
    setUserInfo,
    setAvatarUrl,
    logout
  }
}, {
  persist: {
    key: 'user-store',  // 明确指定存储 key
    pick: ['token', 'refreshToken', 'userInfo']
  }
})


import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Token信息接口
 */
export interface TokenInfo {
  accessToken: string
  refreshToken: string
  accessTokenExpireTime: number
  refreshTokenExpireTime: number
}

/**
 * 用户信息接口
 */
export interface UserInfo {
  id: string
  username: string
  email?: string
}

/**
 * 用户状态管理
 * 使用 pinia-plugin-persistedstate 自动持久化到 localStorage
 * 支持双Token机制（accessToken + refreshToken）
 */
export const useUserStore = defineStore('user', () => {
  // Token信息
  const tokenInfo = ref<TokenInfo | null>(null)
  
  // 用户信息
  const userInfo = ref<UserInfo | null>(null)

  // 兼容旧版本的token字段（用于迁移）
  const token = ref<string | null>(null)

  // 计算属性
  const isLoggedIn = computed(() => !!tokenInfo.value?.accessToken || !!token.value)
  
  // 获取AccessToken
  const accessToken = computed(() => tokenInfo.value?.accessToken || token.value)
  
  // 获取RefreshToken
  const refreshToken = computed(() => tokenInfo.value?.refreshToken)

  // 检查AccessToken是否即将过期（提前1分钟刷新）
  const isAccessTokenExpiring = computed(() => {
    if (!tokenInfo.value?.accessTokenExpireTime) return true
    const buffer = 60 * 1000 // 1分钟缓冲
    return Date.now() + buffer >= tokenInfo.value.accessTokenExpireTime
  })

  // 检查RefreshToken是否已过期
  const isRefreshTokenExpired = computed(() => {
    if (!tokenInfo.value?.refreshTokenExpireTime) return true
    return Date.now() >= tokenInfo.value.refreshTokenExpireTime
  })

  /**
   * 设置Token信息（登录或刷新Token时调用）
   */
  const setTokenInfo = (info: TokenInfo) => {
    tokenInfo.value = info
    // 清除旧版本token
    token.value = null
  }

  /**
   * 设置用户信息
   */
  const setUserInfo = (info: UserInfo | null) => {
    userInfo.value = info
  }

  /**
   * 兼容旧版本的setToken方法
   * @deprecated 请使用 setTokenInfo
   */
  const setToken = (newToken: string) => {
    token.value = newToken
  }

  /**
   * 登出 - 清除所有Token和用户信息
   */
  const logout = () => {
    tokenInfo.value = null
    userInfo.value = null
    token.value = null
    // 清除旧的 localStorage key（兼容性处理）
    localStorage.removeItem('token')
  }

  /**
   * 检查是否需要刷新Token
   * 用于请求拦截器判断
   */
  const needRefreshToken = () => {
    // 如果没有tokenInfo，检查是否有旧版token
    if (!tokenInfo.value) {
      return false
    }
    // 如果RefreshToken已过期，不需要刷新，需要重新登录
    if (isRefreshTokenExpired.value) {
      return false
    }
    // 如果AccessToken即将过期，需要刷新
    return isAccessTokenExpiring.value
  }

  return {
    // 状态
    tokenInfo,
    userInfo,
    token, // 兼容旧版本
    
    // 计算属性
    isLoggedIn,
    accessToken,
    refreshToken,
    isAccessTokenExpiring,
    isRefreshTokenExpired,
    
    // 方法
    setTokenInfo,
    setUserInfo,
    setToken, // 兼容旧版本
    logout,
    needRefreshToken
  }
}, {
  persist: {
    key: 'user-store',
    pick: ['tokenInfo', 'userInfo', 'token']
  }
})

/**
 * 安全工具函数
 * 提供XSS防护、输入验证等功能
 */

/**
 * HTML转义，防止XSS攻击
 * @param text 需要转义的文本
 * @returns 转义后的文本
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m] || m)
}

/**
 * 清理文件名，移除非法字符
 * @param fileName 文件名
 * @returns 清理后的文件名
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255) // 限制长度
}

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证用户名格式（2-20个字符，字母数字下划线）
 * @param username 用户名
 * @returns 是否有效
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{2,20}$/
  return usernameRegex.test(username)
}

/**
 * 验证密码强度（6-20个字符）
 * @param password 密码
 * @returns 是否有效
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6 && password.length <= 20
}

/**
 * 清理用户输入，移除潜在危险字符
 * @param input 用户输入
 * @returns 清理后的输入
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
    .replace(/javascript:/gi, '') // 移除javascript:协议
    .replace(/on\w+\s*=/gi, '') // 移除事件处理器
}


/**
 * 验证用户名格式
 * 允许：英文字母、数字、汉字、常见特殊字符（下划线、连字符、点）
 */
export function validateUsername(username: string): string | null {
  if (!username) {
    return '用户名不能为空'
  }

  if (username.length < 2 || username.length > 20) {
    return '用户名长度必须在2-20个字符之间'
  }

  // 允许：英文字母、数字、汉字（包括所有中文字符）、常见特殊字符（下划线、连字符、点）
  // \u4e00-\u9fa5 是基本中文字符范围，\u3400-\u4db5 是扩展A
  // 为了更全面支持中文，使用更宽泛的中文字符范围
  const usernamePattern = /^[a-zA-Z0-9\u4e00-\u9fff\u3400-\u4db5_\-\.]+$/
  if (!usernamePattern.test(username)) {
    return '用户名只能包含英文字母、数字、汉字、下划线(_)、连字符(-)、点(.)'
  }

  return null
}

/**
 * 验证密码格式
 * 允许：英文字母、数字、常用特殊字符
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return '密码不能为空'
  }

  if (password.length < 6 || password.length > 20) {
    return '密码长度必须在6-20个字符之间'
  }

  // 允许：英文字母、数字、常用特殊字符（!@#$%^&*()_+-=[]{}|;:,.<>?）
  const passwordPattern = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/
  if (!passwordPattern.test(password)) {
    return '密码只能包含英文字母、数字和常用特殊字符（!@#$%^&*()_+-=[]{}|;:,.<>?）'
  }

  return null
}

/**
 * 验证邮箱格式并检测邮箱类型
 * 返回邮箱类型：'qq' | 'netease' | null
 */
export function validateEmail(email: string): { valid: boolean; mailType: string | null; error: string | null } {
  if (!email) {
    return { valid: false, mailType: null, error: '请输入邮箱' }
  }

  const emailLower = email.toLowerCase()
  let mailType: string | null = null

  if (emailLower.includes('@qq.com')) {
    mailType = 'qq'
  } else if (emailLower.includes('@163.com') || emailLower.includes('@126.com')) {
    mailType = 'netease'
  } else {
    return { valid: false, mailType: null, error: '仅支持QQ邮箱或网易邮箱（163/126）' }
  }

  // 基本邮箱格式验证
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    return { valid: false, mailType: null, error: '邮箱格式不正确' }
  }

  return { valid: true, mailType, error: null }
}


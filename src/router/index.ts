import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 登录/注册相关页面（无需登录）
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Auth.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Auth.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/ForgotPassword.vue'),
      meta: { requiresAuth: false }
    },
    
    // 主布局下的页面（需要登录）
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '仪表盘' }
        },
        {
          path: 'videos',
          name: 'Videos',
          component: () => import('@/views/VideoList.vue'),
          meta: { title: '我的视频' }
        },
        {
          path: 'upload',
          name: 'Upload',
          component: () => import('@/views/VideoUpload.vue'),
          meta: { title: '上传视频' }
        },
        {
          path: 'analysis',
          name: 'Analysis',
          component: () => import('@/views/Analysis.vue'),
          meta: { title: '分析结果' }
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: () => import('@/views/TaskList.vue'),
          meta: { title: '分析任务' }
        }
      ]
    },
    
    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '页面未找到' }
    }
  ]
})

// 获取存储的 token
function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem('user-store')
    if (stored) {
      const data = JSON.parse(stored)
      return data.token || null
    }
  } catch {
    // 解析失败
  }
  return null
}

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = getStoredToken()
  
  if (to.meta.requiresAuth !== false && !token) {
    // 需要登录但未登录，跳转到登录页
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    // 已登录但访问登录/注册页，跳转到首页
    next('/dashboard')
  } else {
    next()
  }
})

export default router

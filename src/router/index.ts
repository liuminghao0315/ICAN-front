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
          meta: { title: '工作台' }
        },
        {
          path: 'records',
          name: 'Records',
          component: () => import('@/views/RecordsCenter.vue'),
          meta: { title: '记录中心' }
        },
        // 保留旧路由兼容（重定向到记录中心）
        {
          path: 'videos',
          redirect: '/records'
        },
        {
          path: 'upload',
          redirect: '/records'
        },
        {
          path: 'tasks',
          redirect: '/records'
        },
        {
          path: 'analysis',
          name: 'Analysis',
          component: () => import('@/views/Analysis.vue'),
          meta: { title: '分析结果' }
        },
        {
          path: 'favorites',
          name: 'Favorites',
          component: () => import('@/views/Favorites.vue'),
          meta: { title: '我的收藏' }
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

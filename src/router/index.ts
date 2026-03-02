import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import Dashboard from '@/views/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 公开首页（大创答辩/路演展示）
    {
      path: '/',
      name: 'Landing',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: false, title: '首页' }
    },

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
      component: () => import('@/views/Auth.vue'),
      meta: { requiresAuth: false }
    },
    
    // 主布局下的页面（需要登录）
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: Dashboard,
          meta: { title: '工作台' }
        },
        {
          path: '/records',
          name: 'Records',
          component: () => import('@/views/RecordsCenter.vue'),
          meta: { title: '记录中心' }
        },
        // 保留旧路由兼容（重定向到记录中心）
        {
          path: '/videos',
          redirect: '/records'
        },
        {
          path: '/upload',
          redirect: '/records'
        },
        {
          path: '/tasks',
          redirect: '/records'
        },
        {
          path: '/analysis/:resultId?',
          name: 'Analysis',
          component: () => import('@/views/Analysis.vue'),
          meta: { title: '分析结果' }
        },
        {
          path: '/favorites',
          name: 'Favorites',
          component: () => import('@/views/Favorites.vue'),
          meta: { title: '我的收藏' }
        },
        {
          path: '/risk-dictionary',
          name: 'RiskDictionary',
          component: () => import('@/views/RiskWordLibrary.vue'),
          meta: { title: '风险词库管理' }
        },
        {
          path: '/settings',
          name: 'Settings',
          component: () => import('@/views/Settings.vue'),
          meta: { title: '设置' }
        },
        {
          path: '/help',
          name: 'Help',
          component: () => import('@/views/Help.vue'),
          meta: { title: '帮助与文档' }
        },
        {
          path: '/admin/feedback',
          name: 'AdminFeedback',
          component: () => import('@/views/AdminFeedback.vue'),
          meta: { title: '反馈管理', requiresAdmin: true }
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

function getStoredRole(): string | null {
  try {
    const stored = localStorage.getItem('user-store')
    if (stored) {
      const data = JSON.parse(stored)
      return data.userInfo?.role || null
    }
  } catch { /* silent */ }
  return null
}

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = getStoredToken()
  
  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/dashboard')
  } else if (to.meta.requiresAdmin && getStoredRole() !== 'Administrator') {
    next('/dashboard')
  } else {
    next()
  }
})

export default router

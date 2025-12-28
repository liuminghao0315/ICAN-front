<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo" @click="router.push('/')">
        <div class="logo-icon">
          <el-icon :size="24"><VideoCamera /></el-icon>
        </div>
        <span v-show="!isCollapse" class="logo-text">甄视频</span>
      </div>
      
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        :router="true"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
        
        <el-menu-item index="/videos">
          <el-icon><VideoPlay /></el-icon>
          <template #title>我的视频</template>
        </el-menu-item>
        
        <el-menu-item index="/upload">
          <el-icon><Upload /></el-icon>
          <template #title>上传视频</template>
        </el-menu-item>
        
        <el-menu-item index="/analysis">
          <el-icon><TrendCharts /></el-icon>
          <template #title>分析结果</template>
        </el-menu-item>
      </el-menu>
      
      <!-- 折叠按钮 -->
      <div class="collapse-btn" @click="isCollapse = !isCollapse">
        <el-icon :size="16">
          <DArrowLeft v-if="!isCollapse" />
          <DArrowRight v-else />
        </el-icon>
      </div>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="user-info">
              <div class="user-avatar">
                {{ (userStore.userInfo?.username || '用户').charAt(0).toUpperCase() }}
              </div>
              <span class="username">{{ userStore.userInfo?.username || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile')">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    userStore.logout()
    router.push('/login')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
// 新拟态配色 - 与登录页保持一致
$bg: #edf2f0;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

.main-layout {
  height: 100vh;
  background-color: $neu-1;
}

.sidebar {
  background-color: $neu-1;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 4px 0 10px $neu-2;
  
  .logo {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    padding: 0 16px;
    
    .logo-icon {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: 700;
      color: $black;
      white-space: nowrap;
      letter-spacing: 1px;
    }
  }
  
  .sidebar-menu {
    flex: 1;
    border-right: none;
    background-color: transparent;
    padding: 10px;
    
    :deep(.el-menu-item) {
      height: 48px;
      line-height: 48px;
      margin-bottom: 8px;
      border-radius: 12px;
      color: $gray;
      background-color: $neu-1;
      box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
      transition: all 0.3s;
      
      &:hover {
        color: $purple;
        box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
      }
      
      &.is-active {
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
      }
    }
    
    :deep(.el-menu--collapse) {
      .el-menu-item {
        padding: 0 !important;
        justify-content: center;
      }
    }
  }
  
  .collapse-btn {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray;
    cursor: pointer;
    margin: 10px;
    border-radius: 12px;
    background-color: $neu-1;
    box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
    transition: all 0.3s;
    
    &:hover {
      color: $purple;
      box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;
    }
  }
}

.main-container {
  display: flex;
  flex-direction: column;
}

.header {
  background-color: $neu-1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  margin: 16px 16px 0 0;
  border-radius: 16px;
  box-shadow: 6px 6px 12px $neu-2, -6px -6px 12px $white;
  
  :deep(.el-breadcrumb__item) {
    .el-breadcrumb__inner {
      color: $gray;
      font-weight: 500;
      
      &.is-link:hover {
        color: $purple;
      }
    }
    
    &:last-child {
      .el-breadcrumb__inner {
        color: $black;
      }
    }
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 12px;
      background-color: $neu-1;
      box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white;
      }
      
      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .username {
        font-size: 14px;
        color: $black;
        font-weight: 500;
      }
      
      .el-icon {
        color: $gray;
      }
    }
  }
}

.main-content {
  padding: 20px;
  padding-right: 20px;
  margin-right: 4px;
  overflow-y: auto;
  background-color: $neu-1;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: $neu-1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: $neu-2;
    border-radius: 4px;
    
    &:hover {
      background: darken($neu-2, 10%);
    }
  }
}
</style>

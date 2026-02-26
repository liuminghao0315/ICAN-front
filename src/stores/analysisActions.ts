import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 分析页操作 Store
 * 用于跨组件（MainLayout <-> Analysis）传递操作信号
 */
export const useAnalysisActionsStore = defineStore('analysisActions', () => {
  // 导出触发计数器，每次递增即触发一次导出
  const exportTrigger = ref(0)

  // 分析数据是否已成功加载（控制侧边栏操作按钮的可用状态）
  const hasAnalysisData = ref(false)

  // 当前分析页对应的 taskId，供 MainLayout 收藏按钮使用
  const currentTaskId = ref<string | null>(null)

  const triggerExport = () => {
    exportTrigger.value++
  }

  const setHasAnalysisData = (val: boolean) => {
    hasAnalysisData.value = val
  }

  const setCurrentTaskId = (id: string | null) => {
    currentTaskId.value = id
  }

  return { exportTrigger, hasAnalysisData, currentTaskId, triggerExport, setHasAnalysisData, setCurrentTaskId }
})

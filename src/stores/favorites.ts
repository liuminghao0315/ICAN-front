import { defineStore } from 'pinia'
import { ref } from 'vue'
import { favoriteTask, unfavoriteTask } from '@/api'

/**
 * 收藏 Store
 * 维护一个本地 Set，记录当前用户已收藏的 taskId，
 * 支持乐观更新，避免每次都重新拉取列表。
 */
export const useFavoritesStore = defineStore('favorites', () => {
  /** 已收藏的 taskId 集合 */
  const favoritedIds = ref<Set<string>>(new Set())

  /** 初始化（从列表数据中同步） */
  const syncFromList = (tasks: { id: string; isFavorited?: boolean }[]) => {
    for (const t of tasks) {
      if (t.isFavorited === true) {
        favoritedIds.value.add(t.id)
      } else if (t.isFavorited === false) {
        // 仅当后端明确返回 false 时才移除（undefined/null 表示接口不携带该字段，忽略）
        favoritedIds.value.delete(t.id)
      }
    }
  }

  const isFavorited = (taskId: string) => favoritedIds.value.has(taskId)

  /** 切换收藏状态，乐观更新 */
  const toggle = async (taskId: string): Promise<boolean> => {
    const was = favoritedIds.value.has(taskId)
    // 乐观更新
    if (was) {
      favoritedIds.value.delete(taskId)
    } else {
      favoritedIds.value.add(taskId)
    }
    try {
      if (was) {
        await unfavoriteTask(taskId)
      } else {
        await favoriteTask(taskId)
      }
      return !was
    } catch {
      // 回滚
      if (was) {
        favoritedIds.value.add(taskId)
      } else {
        favoritedIds.value.delete(taskId)
      }
      return was
    }
  }

  return { favoritedIds, isFavorited, toggle, syncFromList }
})

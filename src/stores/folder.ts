import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FolderVO } from '@/types'
import { getFolderTree, createFolder, renameFolder, moveFolder, deleteFolder, moveVideosToFolder } from '@/api'

export const useFolderStore = defineStore('folder', () => {
  const tree = ref<FolderVO[]>([])
  const activeFolderId = ref<string>('__ALL__')
  const loading = ref(false)

  /** 加载文件夹树 */
  const loadTree = async () => {
    loading.value = true
    try {
      const res = await getFolderTree()
      if (res.code === 200) {
        tree.value = res.data || []
      }
    } finally {
      loading.value = false
    }
  }

  /** 创建文件夹 */
  const addFolder = async (name: string, parentId?: string | null) => {
    const res = await createFolder(name, parentId)
    if (res.code === 200) {
      await loadTree()
      return res.data
    }
    throw new Error(res.message || '创建失败')
  }

  /** 重命名文件夹 */
  const rename = async (folderId: string, newName: string) => {
    const res = await renameFolder(folderId, newName)
    if (res.code === 200) {
      await loadTree()
      return
    }
    throw new Error(res.message || '重命名失败')
  }

  /** 移动文件夹（支持拖拽排序） */
  const move = async (folderId: string, newParentId: string | null, sortOrder: number = 0) => {
    const res = await moveFolder(folderId, newParentId, sortOrder)
    if (res.code === 200) {
      await loadTree()
      return
    }
    throw new Error(res.message || '移动失败')
  }

  /** 删除文件夹，返回被移动到未分类的视频数量 */
  const remove = async (folderId: string): Promise<number> => {
    const res = await deleteFolder(folderId)
    if (res.code === 200) {
      if (activeFolderId.value === folderId) {
        activeFolderId.value = '__ALL__'
      }
      await loadTree()
      return res.data ?? 0
    }
    throw new Error(res.message || '删除失败')
  }

  /** 移动视频到文件夹 */
  const moveVideos = async (videoIds: string[], folderId: string | null) => {
    const res = await moveVideosToFolder(videoIds, folderId)
    if (res.code === 200) {
      await loadTree()
      return
    }
    throw new Error(res.message || '移动失败')
  }

  /** 设置当前激活的文件夹 */
  const setActive = (folderId: string) => {
    activeFolderId.value = folderId
  }

  /** 获取扁平化的文件夹列表（用于移动目标选择） */
  const flatFolders = (): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = []
    const walk = (nodes: FolderVO[], depth: number) => {
      for (const node of nodes) {
        if (node.id.startsWith('__')) continue // 跳过虚拟节点
        result.push({ id: node.id, name: node.name, depth })
        if (node.children?.length) walk(node.children, depth + 1)
      }
    }
    walk(tree.value, 0)
    return result
  }

  /** 根据 folderId 查找节点 */
  const findNode = (nodes: FolderVO[], id: string): FolderVO | null => {
    for (const n of nodes) {
      if (n.id === id) return n
      if (n.children?.length) {
        const found = findNode(n.children, id)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 获取指定文件夹的面包屑路径数组
   * 返回从根到当前节点的路径，每项包含 id 和 name
   */
  const getBreadcrumbs = (folderId: string): { id: string; name: string }[] => {
    if (!folderId || folderId.startsWith('__')) return []
    const path: { id: string; name: string }[] = []
    const buildPath = (nodes: FolderVO[], targetId: string, current: { id: string; name: string }[]): boolean => {
      for (const n of nodes) {
        if (n.id.startsWith('__')) continue
        const next = [...current, { id: n.id, name: n.name }]
        if (n.id === targetId) {
          path.push(...next)
          return true
        }
        if (n.children?.length && buildPath(n.children, targetId, next)) return true
      }
      return false
    }
    buildPath(tree.value, folderId, [])
    return path
  }

  /**
   * 判断一个文件夹是否有"直接"存放的视频（非来自子文件夹）
   * 通过比较自身 videoCount 与所有子节点 videoCount 之和来判断
   * 注意：后端 videoCount 是递归统计的，所以需要减去子节点的总和
   */
  const hasDirectVideos = (folderId: string): boolean => {
    const node = findNode(tree.value, folderId)
    if (!node) return false
    const childrenTotal = (node.children || []).reduce((sum, c) => sum + (c.videoCount || 0), 0)
    return (node.videoCount - childrenTotal) > 0
  }

  return {
    tree,
    activeFolderId,
    loading,
    loadTree,
    addFolder,
    rename,
    move,
    remove,
    moveVideos,
    setActive,
    flatFolders,
    findNode: (id: string) => findNode(tree.value, id),
    getBreadcrumbs,
    hasDirectVideos
  }
})

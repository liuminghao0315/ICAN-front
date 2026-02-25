<template>
  <div class="folder-tree" :class="{ 'is-dragging-tree': draggingId }" @dragover.prevent @drop.prevent="onRootDrop">
    <!-- 板块标题 -->
    <div class="section-title">
      <span>我的文件夹</span>
      <button class="add-root-btn" @click="handleAddRootFolder" title="新建文件夹">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>

    <!-- 用户文件夹树 -->
    <FolderTreeNode
      v-for="node in userNodes"
      :key="node.id"
      :node="node"
      :depth="0"
      :active-id="activeFolderId"
      :expanded-ids="expandedIds"
      :editing-id="editingId"
      :editing-name="editingName"
      @select="handleSelect"
      @toggle-expand="toggleExpand"
      @add-child="handleAddChild"
      @start-rename="startRename"
      @confirm-rename="confirmRename"
      @cancel-rename="cancelRename"
      @update:editing-name="editingName = $event"
      @show-more="showMoreMenu"
    />

    <!-- 空状态 -->
    <div class="empty-hint" v-if="userNodes.length === 0 && !loading && !creatingRoot">
      <span>暂无自定义文件夹</span>
    </div>

    <!-- 新建根文件夹输入 -->
    <div class="new-folder-input" v-if="creatingRoot">
      <input
        ref="newRootInputRef"
        v-model="newFolderName"
        class="inline-input"
        placeholder="文件夹名称"
        maxlength="100"
        @keyup.enter="confirmCreateRoot"
        @keyup.escape="cancelCreateRoot"
        @blur="confirmCreateRoot"
      />
    </div>

    <!-- 更多菜单 -->
    <Teleport to="body">
      <Transition name="ctx-menu">
        <div
          v-if="moreMenuVisible"
          class="folder-ctx-menu"
          :style="{ top: moreMenuPos.top + 'px', left: moreMenuPos.left + 'px' }"
          @click.stop
        >
          <button class="ctx-item" @click="handleCtxRename"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>重命名</button>
          <button class="ctx-item" @click="handleCtxMove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>移动位置</button>
          <button class="ctx-item danger" @click="handleCtxDelete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>删除文件夹</button>
        </div>
      </Transition>
    </Teleport>

    <!-- 移动文件夹弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="neu-overlay" v-if="moveModalVisible" @click.self="moveModalVisible = false">
          <div class="neu-modal">
            <h3 class="modal-title">移动「{{ moveTargetName }}」到</h3>
            <div class="move-list">
              <button
                class="move-option"
                :class="{ active: moveDestId === null }"
                @click="moveDestId = null"
              >📁 根目录</button>
              <button
                v-for="f in moveOptions"
                :key="f.id"
                class="move-option"
                :class="{ active: moveDestId === f.id, disabled: f.id === moveTargetId }"
                :style="{ paddingLeft: (f.depth * 16 + 12) + 'px' }"
                :disabled="f.id === moveTargetId"
                @click="moveDestId = f.id"
              >📁 {{ f.name }}</button>
            </div>
            <div class="modal-footer">
              <button class="ctrl-btn" @click="moveModalVisible = false">取消</button>
              <button class="ctrl-btn primary" @click="confirmMoveFolder">确定</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div class="neu-overlay" v-if="deleteModalVisible" @click.self="deleteModalVisible = false">
          <div class="neu-modal">
            <div class="confirm-header">
              <div class="confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
              <h3 class="modal-title">删除文件夹「{{ deleteTargetName }}」</h3>
            </div>
            <p class="confirm-desc" v-if="deleteTargetVideoCount > 0">
              该文件夹（含子文件夹）共有 {{ deleteTargetVideoCount }} 个视频，删除后将自动移至「未分类」。
            </p>
            <p class="confirm-desc" v-else>确定要删除此文件夹吗？</p>
            <div class="modal-footer">
              <button class="ctrl-btn" @click="deleteModalVisible = false">取消</button>
              <button class="ctrl-btn danger" @click="confirmDeleteFolder">确认删除</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useFolderStore } from '@/stores/folder'
import type { FolderVO } from '@/types'
import FolderTreeNode from './FolderTreeNode.vue'

const router = useRouter()
const folderStore = useFolderStore()

const loading = computed(() => folderStore.loading)
const activeFolderId = computed(() => folderStore.activeFolderId)

const userNodes = computed(() => folderStore.tree.filter(n => !n.id.startsWith('__')))

// ── 全局拖拽状态（provide 给所有子节点） ──
const draggingId = ref<string | null>(null)
const draggingNode = ref<FolderVO | null>(null)

// 全局唯一的 drop 目标，避免多个节点同时显示 indicator
const dropTargetId = ref<string | null>(null)
const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)

const setDragging = (node: FolderVO | null) => {
  draggingId.value = node?.id ?? null
  draggingNode.value = node
  if (!node) {
    dropTargetId.value = null
    dropPosition.value = null
  }
}

const setDropTarget = (targetId: string | null, position: 'before' | 'after' | 'inside' | null) => {
  dropTargetId.value = targetId
  dropPosition.value = position
}

/**
 * 拖拽放置核心逻辑
 * position:
 *   'before' → 插入到 targetId 的前面（同级）
 *   'after'  → 插入到 targetId 的后面（同级）
 *   'inside' → 放入 targetId 成为其子文件夹
 */
const onDropped = async (srcId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
  if (srcId === targetId) return

  // 找到目标节点信息
  const targetNode = findNode(folderStore.tree, targetId)
  if (!targetNode) return

  // 校验：不能移动到自身子文件夹
  const srcNode = findNode(folderStore.tree, srcId)
  if (!srcNode) return

  let newParentId: string | null
  let sortOrder: number

  if (position === 'inside') {
    // 校验：第三层（depth=2）不允许再放入子文件夹
    const targetDepth = folderStore.flatFolders().find(f => f.id === targetId)?.depth ?? 0
    if (targetDepth >= 2) return
    // 放入目标文件夹内，排在最后；直接用子节点数量，后端会做完整重排
    newParentId = targetId
    const children = (targetNode.children || []).filter(c => c.id !== srcId)
    sortOrder = children.length
  } else {
    // 插入到目标的同级（before/after）
    newParentId = targetNode.parentId ?? null
    // 用目标节点的实际 sortOrder 值，而不是数组下标
    const targetSortOrder = targetNode.sortOrder ?? 0
    sortOrder = position === 'before' ? targetSortOrder : targetSortOrder + 1
  }

  try {
    await folderStore.move(srcId, newParentId, sortOrder)
    ElMessage.success('移动成功')
  } catch (e: any) {
    ElMessage.error(e.message || '移动失败')
  }
}

provide('dragState', {
  draggingId,
  draggingNode,
  setDragging,
  setDropTarget,
  dropTargetId,
  dropPosition,
  onDropped
})

// ── 工具函数 ──
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

// 展开/折叠
const expandedIds = ref<Set<string>>(new Set())
const toggleExpand = (id: string) => {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id)
  else expandedIds.value.add(id)
}

// 选中
const handleSelect = (id: string) => {
  folderStore.setActive(id)
  // 自动跳转到记录中心
  router.push('/records')
}

// ── 新建根文件夹 ──
const creatingRoot = ref(false)
const newFolderName = ref('')
const newRootInputRef = ref<HTMLInputElement | null>(null)
const rootSubmitting = ref(false)

const handleAddRootFolder = () => {
  creatingRoot.value = true
  newFolderName.value = ''
  rootSubmitting.value = false
  nextTick(() => newRootInputRef.value?.focus())
}
const confirmCreateRoot = async () => {
  if (rootSubmitting.value) return
  if (!newFolderName.value.trim()) { cancelCreateRoot(); return }
  rootSubmitting.value = true
  creatingRoot.value = false
  try {
    await folderStore.addFolder(newFolderName.value.trim(), null)
    ElMessage.success('文件夹已创建')
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败')
  } finally {
    rootSubmitting.value = false
  }
}
const cancelCreateRoot = () => { creatingRoot.value = false }

// ── 新建子文件夹 ──
const handleAddChild = async (parentId: string, name: string) => {
  try {
    const vo = await folderStore.addFolder(name, parentId)
    expandedIds.value.add(parentId)
    ElMessage.success('子文件夹已创建')
    return vo
  } catch (e: any) {
    ElMessage.error(e.message || '创建失败')
    throw e
  }
}

// ── 行内重命名 ──
const editingId = ref<string | null>(null)
const editingName = ref('')

const startRename = (id: string, currentName: string) => {
  editingId.value = id
  editingName.value = currentName
}
const confirmRename = async () => {
  if (!editingId.value || !editingName.value.trim()) { cancelRename(); return }
  const id = editingId.value
  const name = editingName.value.trim()
  editingId.value = null  // 先关闭，防止 blur 重复触发
  try {
    await folderStore.rename(id, name)
    ElMessage.success('重命名成功')
  } catch (e: any) {
    ElMessage.error(e.message || '重命名失败')
  }
}
const cancelRename = () => { editingId.value = null }

// ── 更多菜单 ──
const moreMenuVisible = ref(false)
const moreMenuPos = ref({ top: 0, left: 0 })
const moreMenuTargetId = ref<string | null>(null)
const moreMenuTargetName = ref('')

const showMoreMenu = (event: MouseEvent, node: FolderVO) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  moreMenuPos.value = { top: rect.bottom + 4, left: rect.left }
  moreMenuTargetId.value = node.id
  moreMenuTargetName.value = node.name
  moreMenuVisible.value = true
}

const closeMoreMenu = () => { moreMenuVisible.value = false }

const handleCtxRename = () => {
  if (moreMenuTargetId.value) startRename(moreMenuTargetId.value, moreMenuTargetName.value)
  closeMoreMenu()
}

// ── 移动文件夹 ──
const moveModalVisible = ref(false)
const moveTargetId = ref<string | null>(null)
const moveTargetName = ref('')
const moveDestId = ref<string | null>(null)
const moveOptions = computed(() => folderStore.flatFolders().filter(f => f.depth <= 1))

const handleCtxMove = () => {
  moveTargetId.value = moreMenuTargetId.value
  moveTargetName.value = moreMenuTargetName.value
  moveDestId.value = null
  moveModalVisible.value = true
  closeMoreMenu()
}
const confirmMoveFolder = async () => {
  if (!moveTargetId.value) return
  try {
    await folderStore.move(moveTargetId.value, moveDestId.value)
    ElMessage.success('移动成功')
    moveModalVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '移动失败')
  }
}

// ── 删除文件夹 ──
const deleteModalVisible = ref(false)
const deleteTargetId = ref<string | null>(null)
const deleteTargetName = ref('')
const deleteTargetVideoCount = ref(0)

const handleCtxDelete = () => {
  deleteTargetId.value = moreMenuTargetId.value
  deleteTargetName.value = moreMenuTargetName.value
  const node = moreMenuTargetId.value ? findNode(folderStore.tree, moreMenuTargetId.value) : null
  deleteTargetVideoCount.value = node?.videoCount || 0
  deleteModalVisible.value = true
  closeMoreMenu()
}
const confirmDeleteFolder = async () => {
  if (!deleteTargetId.value) return
  try {
    const movedCount = await folderStore.remove(deleteTargetId.value)
    const msg = movedCount > 0
      ? `文件夹已删除，${movedCount} 个视频已移至未分类`
      : '文件夹已删除'
    ElMessage.success(msg)
    deleteModalVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

onMounted(() => document.addEventListener('click', handleGlobalClick))
onUnmounted(() => document.removeEventListener('click', handleGlobalClick))
const onRootDrop = async (e: DragEvent) => {
  const srcId = draggingId.value
  if (!srcId) return
  // 确认是拖到了空白区域（不是节点上）
  const target = e.target as HTMLElement
  if (target.closest('.folder-item')) return
  const roots = userNodes.value
  const sortOrder = roots.length > 0
    ? Math.max(...roots.map(r => r.sortOrder ?? 0)) + 1
    : 0
  try {
    await folderStore.move(srcId, null, sortOrder)
    ElMessage.success('已移到根目录')
  } catch (e: any) {
    ElMessage.error((e as Error).message || '移动失败')
  }
}
// 点击外部关闭菜单
const handleGlobalClick = () => { closeMoreMenu() }
</script>

<style scoped lang="scss">
$purple: #4b70e2;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;

.folder-tree {
  padding: 0 10px 10px;

  // 拖拽进行时，所有 folder-item 的子元素忽略鼠标事件，防止光标闪烁
  &.is-dragging-tree :deep(.folder-item) * {
    pointer-events: none;
  }
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 6px 8px;
  font-size: 11px;
  font-weight: 600;
  color: $gray;
  text-transform: uppercase;
  letter-spacing: 1px;

  .add-root-btn {
    width: 22px;
    height: 22px;
    border: none;
    background: transparent;
    color: $gray;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    svg { width: 14px; height: 14px; }
    &:hover { color: $purple; background: rgba($purple, 0.1); }
  }
}

.folder-item {
  cursor: pointer;
  border-radius: 10px;
  margin-bottom: 4px;
  transition: all 0.2s;

  .folder-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 10px;
  }

  .folder-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: $gray;
  }

  .folder-name {
    flex: 1;
    font-size: 13px;
    color: $black;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge {
    font-size: 11px;
    min-width: 20px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    border-radius: 9px;
    background: $neu-2;
    color: $gray;
    padding: 0 6px;
    flex-shrink: 0;
  }

  &:hover {
    background: rgba($purple, 0.06);
    .folder-icon { color: $purple; }
  }

  &.active {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    box-shadow: 4px 4px 8px $neu-2, -2px -2px 6px $white;
    .folder-row { color: #fff; }
    .folder-icon { color: #fff; }
    .folder-name { color: #fff; }
    .badge { background: rgba(255,255,255,0.25); color: #fff; }
  }
}

.new-folder-input {
  padding: 4px 6px;
}

.inline-input {
  width: 100%;
  padding: 6px 10px;
  border: 2px solid $purple;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  outline: none;
  color: $black;
}

.empty-hint {
  padding: 16px 10px;
  text-align: center;
  font-size: 12px;
  color: $gray;
}
</style>

<!-- 全局样式（Teleport 弹窗） -->
<style lang="scss">
$purple: #4b70e2;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;

.folder-ctx-menu {
  position: fixed;
  z-index: 3000;
  min-width: 160px;
  background: $white;
  border-radius: 12px;
  padding: 6px;
  box-shadow: 8px 8px 24px rgba(209,217,230,0.9), -8px -8px 24px rgba(255,255,255,1), 0 8px 32px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.9);

  .ctx-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 13px;
    color: $black;
    cursor: pointer;
    transition: all 0.15s;
    svg { width: 16px; height: 16px; flex-shrink: 0; color: $gray; }
    &:hover { background: rgba($purple, 0.08); svg { color: $purple; } }
    &.danger { color: #ef4444; svg { color: #ef4444; } }
    &.danger:hover { background: rgba(239,68,68,0.08); }
  }
}

.ctx-menu-enter-active { animation: ctx-in 0.15s ease-out; }
.ctx-menu-leave-active { animation: ctx-out 0.1s ease-in; }
@keyframes ctx-in { from { opacity: 0; transform: scale(0.95) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes ctx-out { from { opacity: 1; } to { opacity: 0; transform: scale(0.95); } }

// 移动弹窗内的列表
.move-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 12px 0;
  border-radius: 10px;
  background: $neu-1;
  padding: 6px;
  box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white;

  .move-option {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    font-size: 13px;
    color: $black;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
    &:hover { background: rgba($purple, 0.08); }
    &.active { background: linear-gradient(135deg, $purple, #7c9df7); color: #fff; }
    &.disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

// 通用弹窗遮罩
.neu-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

// 通用弹窗卡片
.neu-modal {
  background: $neu-1;
  border-radius: 18px;
  padding: 28px 28px 22px;
  min-width: 320px;
  max-width: 420px;
  width: 90vw;
  box-shadow: 12px 12px 28px darken($neu-2, 8%), -12px -12px 28px $white;

  .modal-title {
    font-size: 16px;
    font-weight: 600;
    color: $black;
    margin: 0 0 4px;
  }

  .confirm-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    .confirm-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      svg { width: 20px; height: 20px; stroke: #ef4444; }
    }
  }

  .confirm-desc {
    font-size: 13px;
    color: #666;
    margin: 0 0 16px;
    line-height: 1.6;
  }

  .modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
  }
}

// 通用按钮
.ctrl-btn {
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: $neu-1;
  color: $black;
  box-shadow: 4px 4px 8px $neu-2, -4px -4px 8px $white;

  &:hover { box-shadow: 2px 2px 4px $neu-2, -2px -2px 4px $white; }
  &:active { box-shadow: inset 2px 2px 4px $neu-2, inset -2px -2px 4px $white; }

  &.primary {
    background: linear-gradient(135deg, $purple, #7c9df7);
    color: #fff;
    box-shadow: 4px 4px 10px rgba($purple, 0.4);
    &:hover { box-shadow: 2px 2px 6px rgba($purple, 0.5); }
  }

  &.danger {
    background: linear-gradient(135deg, #ef4444, #f87171);
    color: #fff;
    box-shadow: 4px 4px 10px rgba(239, 68, 68, 0.3);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// 弹窗动画
.modal-fade-enter-active { transition: opacity 0.2s; .neu-modal { transition: transform 0.2s, opacity 0.2s; } }
.modal-fade-leave-active { transition: opacity 0.15s; .neu-modal { transition: transform 0.15s, opacity 0.15s; } }
.modal-fade-enter-from { opacity: 0; .neu-modal { transform: scale(0.92); opacity: 0; } }
.modal-fade-leave-to { opacity: 0; .neu-modal { transform: scale(0.96); opacity: 0; } }
</style>


<template>
  <div
    class="tree-node"
    :style="{ paddingLeft: depth * 16 + 'px' }"
    :data-id="node.id"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- 插入线：before（节点上方） -->
    <div class="drop-indicator" v-if="dropIndicator === 'before'" />

    <!-- 文件夹行 -->
    <div
      class="folder-item"
      :class="{
        active: activeId === node.id,
        'drag-over-inside': dropIndicator === 'inside',
        'is-dragging': dragState?.draggingId.value === node.id
      }"
      draggable="true"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
      @click="$emit('select', node.id)"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
    >
      <div class="folder-row">
        <!-- 展开/折叠箭头 -->
        <button
          class="expand-btn"
          :class="{ expanded: isExpanded, invisible: !node.children?.length && !addingChild }"
          @click.stop="$emit('toggle-expand', node.id)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <!-- 文件夹图标 -->
        <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>

        <!-- 名称 / 行内编辑 -->
        <input
          v-if="editingId === node.id"
          ref="renameInputRef"
          class="inline-input"
          :value="editingName"
          @input="onRenameInput"
          @keyup.enter="$emit('confirm-rename')"
          @keyup.escape="$emit('cancel-rename')"
          @blur="$emit('confirm-rename')"
          @click.stop
          maxlength="100"
        />
        <span v-else class="folder-name">{{ node.name }}</span>

        <!-- Badge -->
        <span
          class="badge"
          v-if="node.videoCount > 0 && editingId !== node.id"
          :class="{ 'badge-hollow': !hasDirectVideos }"
          :title="hasDirectVideos ? `${node.videoCount} 个视频（含子文件夹）` : `${node.videoCount} 个视频（全部来自子文件夹）`"
        >{{ node.videoCount }}</span>

        <!-- 行内操作按钮（hover 时显示） -->
        <div class="inline-actions" v-show="hovered && editingId !== node.id && dragState?.draggingId.value == null" @click.stop>
          <!-- depth >= 2 为第三层（孙），不允许再创建子文件夹 -->
          <button v-if="depth < 2" class="action-btn" title="新建子文件夹" @click.stop="startAddChild">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button class="action-btn" title="更多操作" @click.stop="$emit('show-more', $event, node)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 新建子文件夹输入 -->
    <div v-if="addingChild" class="child-input-wrapper" :style="{ paddingLeft: 16 + 'px' }">
      <input
        ref="childInputRef"
        v-model="childName"
        class="inline-input"
        placeholder="子文件夹名称"
        maxlength="100"
        @keyup.enter="confirmAddChild"
        @keyup.escape="cancelAddChild"
        @blur="confirmAddChild"
      />
    </div>

    <!-- 子节点（带动画） -->
    <Transition name="expand">
      <div v-if="isExpanded && node.children?.length" class="children">
        <FolderTreeNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :depth="depth + 1"
          :active-id="activeId"
          :expanded-ids="expandedIds"
          :editing-id="editingId"
          :editing-name="editingName"
          @select="id => $emit('select', id)"
          @toggle-expand="id => $emit('toggle-expand', id)"
          @add-child="onChildAddChild"
          @start-rename="onChildStartRename"
          @confirm-rename="$emit('confirm-rename')"
          @cancel-rename="$emit('cancel-rename')"
          @update:editing-name="onChildEditingName"
          @show-more="onChildShowMore"
        />
      </div>
    </Transition>

    <!-- 插入线：after（节点下方） -->
    <div class="drop-indicator" v-if="dropIndicator === 'after'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, inject } from 'vue'
import type { FolderVO } from '@/types'
import { useFolderStore } from '@/stores/folder'

const folderStore = useFolderStore()

const props = defineProps<{
  node: FolderVO
  depth: number
  activeId: string
  expandedIds: Set<string>
  editingId: string | null
  editingName: string
}>()

const emit = defineEmits<{
  select: [id: string]
  'toggle-expand': [id: string]
  'add-child': [parentId: string, name: string]
  'start-rename': [id: string, name: string]
  'confirm-rename': []
  'cancel-rename': []
  'update:editing-name': [value: string]
  'show-more': [event: MouseEvent, node: FolderVO]
}>()

// 注入全局拖拽状态
import type { Ref } from 'vue'
const dragState = inject<{
  draggingId: Ref<string | null>
  draggingNode: Ref<FolderVO | null>
  setDragging: (node: FolderVO | null) => void
  setDropTarget: (targetId: string | null, position: 'before' | 'after' | 'inside' | null) => void
  dropTargetId: Ref<string | null>
  dropPosition: Ref<'before' | 'after' | 'inside' | null>
  onDropped: (draggingId: string, targetId: string, position: 'before' | 'after' | 'inside') => void
} | null>('dragState', null)

const hovered = ref(false)
const isExpanded = computed(() => props.expandedIds.has(props.node.id))

// 判断当前节点是否有直接存放的视频（非来自子文件夹）
const hasDirectVideos = computed(() => {
  const childrenTotal = (props.node.children || []).reduce((sum, c) => sum + (c.videoCount || 0), 0)
  return (props.node.videoCount - childrenTotal) > 0
})

// 当前节点的 drop 指示器：从全局状态派生，保证全局唯一
const dropIndicator = computed(() =>
  dragState?.dropTargetId.value === props.node.id ? dragState.dropPosition.value : null
)

// ── 拖拽事件 ──
const onDragStart = (e: DragEvent) => {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', props.node.id)
  dragState?.setDragging(props.node)
}

const onDragEnd = () => {
  dragState?.setDragging(null)
}

const onDragOver = (e: DragEvent) => {
  const srcId = dragState?.draggingId.value
  if (!srcId || srcId === props.node.id) return
  // 不能拖入自身的子树
  if (isAncestor(folderStore.tree, srcId, props.node.id)) return
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer!.dropEffect = 'move'

  // 基于 .folder-item 的位置计算 before/after/inside
  const treeNode = e.currentTarget as HTMLElement
  const folderItem = treeNode.querySelector(':scope > .folder-item') as HTMLElement | null
  if (!folderItem) return

  const rect = folderItem.getBoundingClientRect()
  const y = e.clientY - rect.top
  const h = rect.height

  let position: 'before' | 'after' | 'inside'
  if (y < h * 0.25) {
    position = 'before'
  } else if (y <= h * 0.75) {
    // depth >= 2 为第三层（孙），不允许再放入子文件夹
    position = props.depth >= 2 ? 'after' : 'inside'
  } else {
    position = 'after'
  }
  // 写入全局，自动清除上一个节点的 indicator
  dragState?.setDropTarget(props.node.id, position)
}

const onDragLeave = (e: DragEvent) => {
  const related = e.relatedTarget as HTMLElement | null
  const treeNode = e.currentTarget as HTMLElement
  // 进入子元素不清除；拖出浏览器窗口时 related 为 null，需要清除
  if (related && treeNode.contains(related)) return
  if (dragState?.dropTargetId.value === props.node.id) {
    dragState.setDropTarget(null, null)
  }
}

// 判断 srcId 是否是 nodeId 的祖先（防止移入自身子树）
const isAncestor = (tree: FolderVO[], srcId: string, nodeId: string): boolean => {
  const node = findNodeLocal(tree, nodeId)
  if (!node) return false
  let parentId = node.parentId ?? null
  while (parentId !== null) {
    if (parentId === srcId) return true
    const parent = findNodeLocal(tree, parentId)
    parentId = parent?.parentId ?? null
  }
  return false
}

const findNodeLocal = (nodes: FolderVO[], id: string): FolderVO | null => {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children?.length) {
      const found = findNodeLocal(n.children, id)
      if (found) return found
    }
  }
  return null
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const srcId = dragState?.draggingId.value
  // 必须校验 dropTargetId 是当前节点，防止快速移动时错位
  if (dragState?.dropTargetId.value !== props.node.id) {
    return
  }
  const position = dragState?.dropPosition.value
  if (!srcId || srcId === props.node.id || !position) {
    dragState?.setDropTarget(null, null)
    return
  }
  // 不能移入自身子树
  if (isAncestor(folderStore.tree, srcId, props.node.id)) {
    dragState?.setDropTarget(null, null)
    return
  }
  dragState?.onDropped(srcId, props.node.id, position)
  dragState?.setDropTarget(null, null)
}

// ── 行内重命名自动聚焦 ──
const renameInputRef = ref<HTMLInputElement | null>(null)
watch(() => props.editingId, (val) => {
  if (val === props.node.id) {
    nextTick(() => {
      renameInputRef.value?.focus()
      renameInputRef.value?.select()
    })
  }
})

// ── 新建子文件夹 ──
const addingChild = ref(false)
const childName = ref('')
const childInputRef = ref<HTMLInputElement | null>(null)
const childSubmitting = ref(false)

const startAddChild = () => {
  addingChild.value = true
  childName.value = ''
  childSubmitting.value = false
  if (!isExpanded.value) emit('toggle-expand', props.node.id)
  nextTick(() => childInputRef.value?.focus())
}
const confirmAddChild = () => {
  if (childSubmitting.value) return
  childSubmitting.value = true
  addingChild.value = false
  if (childName.value.trim()) {
    emit('add-child', props.node.id, childName.value.trim())
  }
}
const cancelAddChild = () => { addingChild.value = false }

// ── 事件转发 ──
const onRenameInput = (e: Event) => {
  emit('update:editing-name', (e.target as HTMLInputElement).value)
}
const onChildAddChild = (parentId: string, name: string) => emit('add-child', parentId, name)
const onChildStartRename = (id: string, name: string) => emit('start-rename', id, name)
const onChildEditingName = (val: string) => emit('update:editing-name', val)
const onChildShowMore = (event: MouseEvent, node: FolderVO) => emit('show-more', event, node)
</script>

<style scoped lang="scss">
$purple: #4b70e2;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;

.tree-node {
  user-select: none;
  position: relative;
}

.folder-item {
  cursor: grab;
  border-radius: 10px;
  margin-bottom: 2px;
  transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;

  &.is-dragging {
    opacity: 0.4;
    cursor: grabbing;
  }

  &.drag-over-inside {
    background: rgba($purple, 0.12);
    box-shadow: 0 0 0 2px $purple;
    .folder-icon { color: $purple; }
  }

  .folder-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 8px;
    border-radius: 10px;
  }

  &:hover:not(.is-dragging):not(.drag-over-inside) {
    background: rgba($purple, 0.06);
    .folder-icon { color: $purple; }
  }

  &.active {
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    box-shadow: 3px 3px 6px $neu-2, -2px -2px 4px $white;
    .folder-icon, .folder-name { color: #fff; }
    .badge { background: rgba(255,255,255,0.25); color: #fff; }
    .expand-btn svg { stroke: #fff; }
  }
}

// 插入线
.drop-indicator {
  height: 2px;
  background: $purple;
  border-radius: 2px;
  margin: 1px 8px;
  position: relative;
  box-shadow: 0 0 6px rgba($purple, 0.5);

  &::before {
    content: '';
    position: absolute;
    left: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $purple;
  }
}

.expand-btn {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  svg { width: 14px; height: 14px; stroke: $gray; }
  &.expanded { transform: rotate(90deg); }
  &.invisible { visibility: hidden; }
}

.folder-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: $gray;
  transition: color 0.2s;
}

.folder-name {
  flex: 1;
  font-size: 13px;
  color: $black;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.badge {
  font-size: 10px;
  min-width: 18px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  border-radius: 8px;
  background: $neu-2;
  color: $gray;
  padding: 0 5px;
  flex-shrink: 0;
  transition: background .2s, color .2s, border .2s;

  // 空文件夹（视频全来自子目录）：描边样式，暗示数字是"包含下级"的
  &.badge-hollow {
    background: transparent;
    border: 1.5px solid rgba($gray, .45);
    color: rgba($gray, .65);
    line-height: 13px; // 补偿 border 占用的高度
  }
}

.inline-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.action-btn {
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
  transition: all 0.15s;
  svg { width: 14px; height: 14px; }
  &:hover { color: $purple; background: rgba($purple, 0.12); }
}

.inline-input {
  width: 100%;
  padding: 4px 8px;
  border: 2px solid $purple;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  outline: none;
  color: $black;
  min-width: 0;
}

.child-input-wrapper {
  padding: 2px 8px 4px;
}

.expand-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.expand-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-4px);
}
.expand-enter-to, .expand-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}
</style>

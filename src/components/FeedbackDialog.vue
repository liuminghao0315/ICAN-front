<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="feedback-overlay" v-if="visible" @mousedown.self="onOverlayMouseDown" @mouseup.self="onOverlayMouseUp">
        <div class="feedback-dialog" :class="{ 'chat-mode': isChatMode }">
          <!-- ===== 标题栏 ===== -->
          <div class="dialog-header">
            <div class="header-left">
              <h3>{{ dialogTitle }}</h3>
              <template v-if="isChatMode && feedbackData">
                <span class="header-tag type-tag" v-if="feedbackData.feedbackType">{{ typeMap[feedbackData.feedbackType] || feedbackData.feedbackType }}</span>
                <span class="header-tag module-tag" v-if="feedbackData.module">{{ moduleMap[feedbackData.module] || feedbackData.module }}</span>
              </template>
            </div>
            <div class="header-right">
              <span v-if="isChatMode && feedbackData" class="status-badge" :class="'status-' + currentStatus.toLowerCase()">
                {{ statusMap[currentStatus] || currentStatus }}
              </span>
              <button class="close-btn" @click="close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- ===== 聊天模式（查看/回复对话） ===== -->
          <template v-if="isChatMode">
            <div class="chat-body" ref="chatBodyRef">
              <div v-if="allMessages.length === 0" class="chat-empty">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <p>暂无对话记录</p>
              </div>
              <template v-for="(msg, idx) in allMessages">
                <div
                  v-if="msg.role === 'system'"
                  :key="'s' + idx"
                  class="chat-bubble-system"
                >
                  <span>{{ msg.text }}</span>
                </div>
                <div
                  v-else
                  :key="'m' + idx"
                  class="chat-bubble-wrap"
                  :class="useAdminLayout
                    ? (msg.role === 'admin' ? 'bubble-right' : 'bubble-left')
                    : (msg.role === 'user'  ? 'bubble-right' : 'bubble-left')"
                >
                  <div class="chat-bubble" :class="[
                    'bubble-' + msg.role,
                    useAdminLayout
                      ? (msg.role === 'admin' ? 'bubble-on-right' : 'bubble-on-left')
                      : (msg.role === 'user'  ? 'bubble-on-right' : 'bubble-on-left')
                  ]">
                    <p class="bubble-text">{{ msg.text }}</p>
                    <span class="bubble-time">{{ formatTime(msg.time) }}</span>
                  </div>
                </div>
              </template>
            </div>

            <!-- ===== 管理员操作区（仅在待处理/处理中时显示） ===== -->
            <template v-if="isAdmin">
              <div class="admin-action-area" v-if="isAdminActionable">
                <!-- 回复输入行 -->
                <div class="admin-reply-row">
                  <textarea
                    v-model="adminReplyText"
                    class="chat-textarea"
                    placeholder="输入回复内容（Ctrl+Enter 发送）..."
                    rows="2"
                    maxlength="1000"
                    @keydown.enter.ctrl="handleAdminReply"
                  ></textarea>
                  <button
                    class="send-btn"
                    :disabled="!adminReplyText.trim() || replying"
                    @click="handleAdminReply"
                  >{{ replying ? '...' : '回复' }}</button>
                </div>
                <!-- 状态操作按钮 -->
                <div class="admin-status-actions">
                  <span class="action-hint">处理结果：</span>
                  <button
                    class="status-action-btn btn-resolve"
                    :disabled="closingStatus !== null || replying"
                    @click="handleStatusChange('RESOLVED')"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    标记已解决
                  </button>
                  <button
                    class="status-action-btn btn-reject"
                    :disabled="closingStatus !== null || replying"
                    @click="handleStatusChange('REJECTED')"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    驳回
                  </button>
                </div>
              </div>
              <!-- 已处理时的静默提示 -->
              <div class="admin-closed-tip" v-else>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>此反馈已{{ currentStatus === 'RESOLVED' ? '解决' : '驳回' }}，等待用户回复后可继续处理</span>
              </div>
            </template>

            <!-- ===== 只读管理员：未锁定时显示"开始处理"按钮 ===== -->
            <template v-else-if="adminView">
              <div class="admin-action-area" v-if="!feedbackData?.handlerId && isAdminActionable">
                <button class="lock-action-btn" :disabled="locking" @click="emit('lock')">
                  {{ locking ? '处理中...' : '开始处理' }}
                </button>
              </div>
              <div class="admin-closed-tip" v-else-if="feedbackData?.handlerId">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>{{ feedbackData?.handlerName || '其他管理员' }} 处理中，您处于只读模式</span>
              </div>
            </template>

            <!-- ===== 普通用户回复区（非管理员、非只读） ===== -->
            <div class="chat-input-area" v-if="!readonly && !isAdmin">
              <div class="chat-send-row">
                <textarea
                  v-model="form.content"
                  class="chat-textarea"
                  placeholder="输入消息..."
                  rows="2"
                  maxlength="1000"
                  @keydown.enter.ctrl="handleSubmit"
                ></textarea>
                <button class="send-btn" :disabled="!canSubmit || submitting" @click="handleSubmit">
                  {{ submitting ? '...' : '发送' }}
                </button>
              </div>
            </div>
          </template>

          <!-- ===== 新建反馈表单模式 ===== -->
          <template v-else>
            <div class="dialog-body">
              <div class="form-group">
                <label class="form-label">反馈类型</label>
                <div class="radio-group">
                  <label v-for="t in feedbackTypes" :key="t.value" class="radio-item" :class="{ active: form.feedbackType === t.value }">
                    <input type="radio" :value="t.value" v-model="form.feedbackType" /><span class="radio-label">{{ t.label }}</span>
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">涉及模块 <span class="optional">(可选)</span></label>
                <div class="custom-select" :class="{ open: moduleDropdownOpen, 'has-value': form.module }" ref="moduleSelectRef">
                  <div class="custom-select-trigger" ref="moduleTriggerRef" @click="toggleModuleDropdown" tabindex="0" @keydown.enter.prevent="toggleModuleDropdown" @keydown.escape="moduleDropdownOpen = false">
                    <span class="select-value" :class="{ placeholder: !form.module }">
                      {{ form.module ? (modules.find(m => m.value === form.module)?.label ?? form.module) : '请选择' }}
                    </span>
                    <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <Teleport to="body">
                  <Transition name="dropdown">
                    <div
                      v-if="moduleDropdownOpen"
                      class="module-dropdown-portal"
                      :style="dropdownStyle"
                      ref="dropdownPortalRef"
                    >
                      <div
                        class="custom-select-option"
                        :class="{ active: form.module === '' }"
                        @click="selectModule('')"
                      >
                        <span>不选择</span>
                        <svg v-if="form.module === ''" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div
                        v-for="m in modules"
                        :key="m.value"
                        class="custom-select-option"
                        :class="{ active: form.module === m.value }"
                        @click="selectModule(m.value)"
                      >
                        <span>{{ m.label }}</span>
                        <svg v-if="form.module === m.value" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>
                  </Transition>
                </Teleport>
              </div>
              <div class="form-group">
                <label class="form-label">详细描述</label>
                <textarea v-model="form.content" class="form-textarea" placeholder="请描述您发现的问题，至少5个字..." rows="5" maxlength="1000"></textarea>
                <div class="char-count" :class="{ insufficient: form.content.trim().length > 0 && form.content.trim().length < 5 }">
                  {{ form.content.length }} / 1000
                  <span v-if="form.content.trim().length > 0 && form.content.trim().length < 5" class="hint">（至少5个字）</span>
                </div>
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn btn-cancel" @click="close">取消</button>
              <button class="btn btn-submit" :disabled="!canSubmit || submitting" @click="handleSubmit">{{ submitting ? '提交中...' : '提交反馈' }}</button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { submitFeedback, replyFeedback, closeFeedback, getFeedbackById, type FeedbackVO, type FeedbackMessage } from '@/api'
import { useWebSocket } from '@/composables/useWebSocket'
import type { FeedbackUpdatedData, FeedbackNewData, FeedbackSyncData } from '@/types'

const props = defineProps<{
  visible: boolean
  taskId: string
  videoId: string
  feedbackData: FeedbackVO | null
  readonly?: boolean
  isAdmin?: boolean
  adminView?: boolean  // 只读管理员视角：气泡方向同 isAdmin，但无操作区
  locking?: boolean    // 锁定中状态
}>()

// 气泡方向：isAdmin 或 adminView 时，admin 在右，user 在左
const useAdminLayout = computed(() => props.isAdmin || props.adminView)

const emit = defineEmits<{
  'update:visible': [val: boolean]
  'submitted': [data?: FeedbackVO]
  'status-changed': [status: string]
  'feedback-refreshed': [data: FeedbackVO]
  'lock': []
}>()

// 模态框关闭逻辑：只有 mousedown 和 mouseup 都在外部才关闭
let mouseDownOnOverlay = false

const onOverlayMouseDown = () => {
  mouseDownOnOverlay = true
}

const onOverlayMouseUp = () => {
  if (mouseDownOnOverlay) {
    close()
  }
  mouseDownOnOverlay = false
}

const { subscribeFeedbackUpdated, subscribeFeedbackNew, subscribeFeedbackSync } = useWebSocket({ autoConnect: false })

// ==================== 常量映射 ====================
const statusMap: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  RESOLVED: '已解决',
  REJECTED: '已驳回',
}
const typeMap: Record<string, string> = {
  INACCURATE: '分析不准确',
  MISSING: '信息缺失',
  OTHER: '其他',
}
const moduleMap: Record<string, string> = {
  sentiment: '情感分析',
  risk: '风险评估',
  speech: '语音识别',
  visual: '视觉分析',
  spread: '传播预测',
  other: '其他',
}
const feedbackTypes = [
  { value: 'INACCURATE', label: '分析不准确' },
  { value: 'MISSING', label: '信息缺失' },
  { value: 'OTHER', label: '其他问题' },
]
const modules = [
  { value: 'sentiment', label: '情感分析' },
  { value: 'risk', label: '风险评估' },
  { value: 'speech', label: '语音识别' },
  { value: 'visual', label: '视觉分析' },
  { value: 'spread', label: '传播预测' },
  { value: 'other', label: '其他' },
]

// ==================== 状态 ====================
const form = reactive({ feedbackType: 'INACCURATE', module: '', content: '' })
const submitting = ref(false)
const replying = ref(false)
const closingStatus = ref<string | null>(null)
const chatBodyRef = ref<HTMLElement | null>(null)
const adminReplyText = ref('')
const moduleDropdownOpen = ref(false)
const moduleSelectRef = ref<HTMLElement | null>(null)
const moduleTriggerRef = ref<HTMLElement | null>(null)
const dropdownPortalRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const updateDropdownPosition = () => {
  if (!moduleTriggerRef.value) return
  const rect = moduleTriggerRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
}

const toggleModuleDropdown = () => {
  moduleDropdownOpen.value = !moduleDropdownOpen.value
  if (moduleDropdownOpen.value) {
    nextTick(updateDropdownPosition)
  }
}

/** 本次会话中管理员乐观追加的消息 */
const localAdminMessages = ref<FeedbackMessage[]>([])

/** 本次会话中用户乐观追加的消息（发送后立即显示，等 props 刷新后清空） */
const localUserMessages = ref<FeedbackMessage[]>([])

/** 本次会话中对状态的乐观更新（仅 UI 层） */
const localStatus = ref<string | null>(null)

// ==================== 计算属性 ====================
const isChatMode = computed(() => !!props.feedbackData)

const currentStatus = computed(() =>
  localStatus.value ?? props.feedbackData?.status ?? 'PENDING'
)

/** 管理员操作区可见：状态为待处理或处理中时才允许回复/操作 */
const isAdminActionable = computed(() =>
  currentStatus.value === 'PENDING' || currentStatus.value === 'PROCESSING'
)

const dialogTitle = computed(() => {
  if (!isChatMode.value) return '反馈给管理员'
  if (props.isAdmin) return '对话记录'
  return props.readonly ? '对话记录' : '反馈记录'
})

const baseMessages = computed<FeedbackMessage[]>(() => {
  if (!props.feedbackData?.content) return []
  try {
    return JSON.parse(props.feedbackData.content)
  } catch {
    return [{ role: 'user' as const, text: props.feedbackData.content, time: props.feedbackData.gmtCreated }]
  }
})

const allMessages = computed<FeedbackMessage[]>(() => [
  ...baseMessages.value,
  ...localAdminMessages.value,
  ...localUserMessages.value,
])

const canSubmit = computed(() => {
  if (isChatMode.value) return form.content.trim().length >= 1
  return !!(form.feedbackType && form.content.trim().length >= 5)
})

// ==================== 工具方法 ====================
const close = () => emit('update:visible', false)

const resetForm = () => {
  form.feedbackType = 'INACCURATE'
  form.module = ''
  form.content = ''
  adminReplyText.value = ''
  localAdminMessages.value = []
  localUserMessages.value = []
  localStatus.value = null
  moduleDropdownOpen.value = false
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

const selectModule = (value: string) => {
  form.module = value
  moduleDropdownOpen.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  if (
    moduleSelectRef.value && !moduleSelectRef.value.contains(target) &&
    (!dropdownPortalRef.value || !dropdownPortalRef.value.contains(target))
  ) {
    moduleDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  try {
    return new Date(timeStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return timeStr
  }
}

// ==================== 监听 ====================
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      resetForm()
      // 打开弹窗时主动拉取最新数据，避免错过弹窗关闭期间的消息
      if (props.feedbackData?.id) {
        try {
          const res = await getFeedbackById(props.feedbackData.id)
          if (res.code === 200 && res.data) {
            emit('feedback-refreshed', res.data)
          }
        } catch { /* silent */ }
      }
      scrollToBottom()
    }
  }
)

// feedbackData 更新时（父组件刷新后），清空乐观消息避免重复
watch(
  () => props.feedbackData?.content,
  () => {
    localUserMessages.value = []
    localAdminMessages.value = []
  }
)

watch(allMessages, () => scrollToBottom())

// 订阅反馈更新推送（管理员回复/状态变更时实时刷新聊天记录）
subscribeFeedbackUpdated(async (data: FeedbackUpdatedData) => {
  if (!props.visible || !props.feedbackData) return
  if (data.feedbackId !== props.feedbackData.id) return
  try {
    const res = await getFeedbackById(data.feedbackId)
    if (res.code === 200 && res.data) {
      emit('feedback-refreshed', res.data)
      // 同步乐观状态
      if (localStatus.value && res.data.status !== localStatus.value) {
        localStatus.value = null
      }
      // 清除本地乐观消息（服务端已包含）
      localAdminMessages.value = []
    }
  } catch { /* silent */ }
})

// 管理员模式：订阅 feedback_new（用户发消息时），实时刷新对话记录
subscribeFeedbackNew(async (data: FeedbackNewData) => {
  if (!props.visible || !props.feedbackData || !props.isAdmin) return
  if (data.feedbackId !== props.feedbackData.id) return
  try {
    const res = await getFeedbackById(data.feedbackId)
    if (res.code === 200 && res.data) {
      emit('feedback-refreshed', res.data)
    }
  } catch { /* silent */ }
})

// 管理员模式：订阅 feedback_sync（其他管理员回复/状态变更时），实时刷新对话记录但不增加未读
subscribeFeedbackSync(async (data: FeedbackSyncData) => {
  if (!props.visible || !props.feedbackData || (!props.isAdmin && !props.adminView)) return
  if (data.feedbackId !== props.feedbackData.id) return
  try {
    const res = await getFeedbackById(data.feedbackId)
    if (res.code === 200 && res.data) {
      emit('feedback-refreshed', res.data)
      localAdminMessages.value = []
      if (localStatus.value && res.data.status !== localStatus.value) {
        localStatus.value = null
      }
    }
  } catch { /* silent */ }
})

// ==================== 用户提交（新建反馈 / 用户追加消息） ====================
const handleSubmit = async () => {
  if (!canSubmit.value || submitting.value) return
  if (!props.taskId || !props.videoId) {
    ElMessage.warning('分析数据未加载完成')
    return
  }

  const text = form.content.trim()
  submitting.value = true

  // 聊天模式：乐观追加用户消息，立即显示
  let optimisticMsg: FeedbackMessage | null = null
  if (isChatMode.value) {
    optimisticMsg = { role: 'user', text, time: new Date().toISOString() }
    localUserMessages.value.push(optimisticMsg)
    form.content = ''
  }

  try {
    const params = isChatMode.value
      ? {
          taskId: props.taskId,
          videoId: props.videoId,
          feedbackType: props.feedbackData!.feedbackType,
          content: text,
        }
      : {
          taskId: props.taskId,
          videoId: props.videoId,
          feedbackType: form.feedbackType,
          ...(form.module ? { module: form.module } : {}),
          content: text,
        }
    const res = await submitFeedback(params)
    if (res.code === 200) {
      ElMessage.success(isChatMode.value ? '消息已发送' : '反馈已提交，感谢您的反馈！')
      if (!isChatMode.value) {
        resetForm()
        emit('submitted', res.data)
        close()
      } else {
        // 用返回数据更新父组件（含最新 status，如 PENDING reopen）
        emit('submitted', res.data)
        localStatus.value = null
      }
    } else {
      // 回滚乐观消息
      if (optimisticMsg) {
        const idx = localUserMessages.value.indexOf(optimisticMsg)
        if (idx > -1) localUserMessages.value.splice(idx, 1)
        form.content = text
      }
      ElMessage.error(res.message || '提交失败')
    }
  } catch {
    if (optimisticMsg) {
      const idx = localUserMessages.value.indexOf(optimisticMsg)
      if (idx > -1) localUserMessages.value.splice(idx, 1)
      form.content = text
    }
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// ==================== 管理员回复 ====================
const handleAdminReply = async () => {
  const text = adminReplyText.value.trim()
  if (!text || replying.value) return
  if (!props.feedbackData?.id) {
    ElMessage.warning('反馈数据未加载')
    return
  }

  replying.value = true
  // 乐观更新：立即显示管理员消息
  const optimisticMsg: FeedbackMessage = {
    role: 'admin',
    text,
    time: new Date().toISOString(),
  }
  localAdminMessages.value.push(optimisticMsg)
  adminReplyText.value = ''

  try {
    const res = await replyFeedback(props.feedbackData.id, text)
    if (res.code === 200) {
      ElMessage.success('回复已发送')
      emit('submitted')
    } else {
      // 回滚乐观更新
      localAdminMessages.value.pop()
      adminReplyText.value = text
      ElMessage.error(res.message || '回复失败')
    }
  } catch {
    localAdminMessages.value.pop()
    adminReplyText.value = text
    ElMessage.error('回复失败，请稍后重试')
  } finally {
    replying.value = false
  }
}

// ==================== 管理员更改状态 ====================
const handleStatusChange = async (status: 'RESOLVED' | 'REJECTED') => {
  if (closingStatus.value || !props.feedbackData?.id) return
  closingStatus.value = status

  // 若输入框有内容，先把回复发出去再改状态
  const pendingReply = adminReplyText.value.trim()
  if (pendingReply) {
    const optimisticMsg: FeedbackMessage = {
      role: 'admin',
      text: pendingReply,
      time: new Date().toISOString(),
    }
    localAdminMessages.value.push(optimisticMsg)
    adminReplyText.value = ''

    try {
      const replyRes = await replyFeedback(props.feedbackData.id, pendingReply)
      if (replyRes.code !== 200) {
        // 回复失败：回滚乐观消息，中止后续状态变更
        localAdminMessages.value.pop()
        adminReplyText.value = pendingReply
        ElMessage.error(replyRes.message || '回复发送失败，操作已取消')
        closingStatus.value = null
        return
      }
    } catch {
      localAdminMessages.value.pop()
      adminReplyText.value = pendingReply
      ElMessage.error('回复发送失败，操作已取消')
      closingStatus.value = null
      return
    }
  }

  const prevStatus = localStatus.value ?? props.feedbackData.status
  localStatus.value = status

  try {
    const res = await closeFeedback(props.feedbackData.id, status)
    if (res.code === 200) {
      const label = status === 'RESOLVED' ? '已回复并标记为"已解决"' : '已回复并标记为"已驳回"'
      ElMessage.success(pendingReply ? label : label.replace('已回复并', ''))
      // 重新拉取最新数据，显示系统消息
      try {
        const fresh = await getFeedbackById(props.feedbackData.id)
        if (fresh.code === 200 && fresh.data) {
          localAdminMessages.value = []
          emit('feedback-refreshed', fresh.data)
        }
      } catch { /* silent */ }
      emit('submitted')
      emit('status-changed', status)
    } else {
      localStatus.value = prevStatus
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    localStatus.value = prevStatus
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    closingStatus.value = null
  }
}
</script>

<style lang="scss">
$purple: #4b70e2;
$neu-bg: #ecf0f3;
$black: #181818;
$gray: #a0a5a8;
$green: #52c41a;
$red: #f56c6c;
$orange: #e6a23c;

.feedback-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feedback-dialog {
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.chat-mode {
    height: 72vh;
  }

  // ===== 标题栏 =====
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: $black;
      flex-shrink: 0;
    }

    .header-tag {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;

      &.type-tag {
        background: rgba($purple, 0.1);
        color: $purple;
      }

      &.module-tag {
        background: rgba(#10b981, 0.1);
        color: #059669;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-badge {
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

      &.status-pending    { background: rgba($orange, 0.12); color: $orange; }
      &.status-processing { background: rgba($purple, 0.12); color: $purple; }
      &.status-resolved   { background: rgba($green,  0.12); color: $green; }
      &.status-rejected   { background: rgba($red,    0.12); color: $red; }
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: $gray;
      padding: 4px;
      border-radius: 8px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      svg { width: 18px; height: 18px; }

      &:hover { color: $black; background: rgba(0, 0, 0, 0.05); }
    }
  }

  // ===== 聊天消息区 =====
  .chat-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 2px; }
  }

  .chat-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: $gray;
    padding: 40px 0;

    svg { opacity: 0.4; }
    p { margin: 0; font-size: 14px; }
  }

  .chat-bubble-system {
    display: flex; justify-content: center; align-items: center; padding: 2px 0;
    span {
      font-size: 11px; color: #a0a5a8; background: rgba(0,0,0,0.04);
      padding: 4px 12px; border-radius: 20px; font-style: italic;
    }
  }

  .chat-bubble-wrap {
    display: flex;
    &.bubble-right { justify-content: flex-end; }
    &.bubble-left  { justify-content: flex-start; }
  }

  .chat-bubble {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 14px;
    transition: all 0.2s;

    &.bubble-on-right { border-bottom-right-radius: 4px; }
    &.bubble-on-left  { border-bottom-left-radius: 4px; }

    &.bubble-user {
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      color: #fff;
      .bubble-time { color: rgba(255, 255, 255, 0.7); }
      .meta-tag { background: rgba(255, 255, 255, 0.2); color: #fff; }
    }

    &.bubble-admin {
      background: $neu-bg;
      color: $black;
      .bubble-time { color: $gray; }
      .meta-tag { background: rgba($purple, 0.1); color: $purple; }
    }

    .bubble-meta { display: flex; gap: 6px; margin-bottom: 6px; }
    .meta-tag { padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .bubble-text { margin: 0; font-size: 14px; line-height: 1.5; word-break: break-word; }
    .bubble-time { display: block; font-size: 11px; margin-top: 4px; text-align: right; }
  }

  // ===== 管理员操作区 =====
  .admin-action-area {
    flex-shrink: 0;
    padding: 12px 20px 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    background: #fafbfd;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .admin-reply-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .admin-status-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .action-hint {
      font-size: 12px;
      color: $gray;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  .status-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &.btn-resolve {
      color: darken($green, 10%);
      background: rgba($green, 0.08);
      border-color: rgba($green, 0.25);

      &:hover:not(:disabled):not(.is-active) {
        background: rgba($green, 0.15);
        border-color: rgba($green, 0.45);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba($green, 0.2);
      }

      &.is-active {
        background: rgba($green, 0.15);
        border-color: rgba($green, 0.5);
        cursor: default;
      }
    }

    &.btn-reject {
      color: darken($red, 5%);
      background: rgba($red, 0.08);
      border-color: rgba($red, 0.25);

      &:hover:not(:disabled):not(.is-active) {
        background: rgba($red, 0.15);
        border-color: rgba($red, 0.45);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba($red, 0.2);
      }

      &.is-active {
        background: rgba($red, 0.15);
        border-color: rgba($red, 0.5);
        cursor: default;
      }
    }

    &:disabled:not(.is-active) {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none !important;
    }
  }

  // ===== 已处理静默提示条 =====
  .admin-closed-tip {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    background: #f5f6f8;
    color: $gray;
    font-size: 12.5px;

    svg { flex-shrink: 0; opacity: 0.6; }
    span { line-height: 1.4; }
  }

  .lock-action-btn {
    width: 100%; padding: 10px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff; font-size: 14px; cursor: pointer; transition: all 0.25s;
    &:hover { opacity: 0.9; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  // ===== 用户回复区 =====
  .chat-input-area {
    flex-shrink: 0;
    padding: 12px 20px 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }

  .chat-send-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .chat-textarea {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    background: $neu-bg;
    font-size: 13px;
    font-family: inherit;
    resize: none;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;

    &:focus { border-color: $purple; }
    &::placeholder { color: $gray; }
  }

  .send-btn {
    padding: 8px 18px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    white-space: nowrap;

    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba($purple, 0.35); }
    &:active:not(:disabled) { transform: scale(0.98); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  // ===== 新建反馈表单 =====
  .dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 24px 16px;

    .form-group { margin-bottom: 20px; }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: $black;
      margin-bottom: 8px;

      .optional { font-weight: 400; color: $gray; font-size: 12px; }
    }

    .radio-group { display: flex; gap: 10px; flex-wrap: wrap; }

    .radio-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border-radius: 10px;
      cursor: pointer;
      background: $neu-bg;
      transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 2px 2px 4px rgba(163, 177, 198, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.8);

      input { display: none; }
      .radio-label { font-size: 13px; color: #666; }

      &.active {
        background: $purple;
        box-shadow: 2px 2px 6px rgba(75, 112, 226, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.5);
        .radio-label { color: #fff; }
      }

      &:hover:not(.active) {
        box-shadow: 1px 1px 3px rgba(163, 177, 198, 0.4), -1px -1px 3px rgba(255, 255, 255, 0.9);
      }
    }

    .form-select {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 10px;
      background: $neu-bg;
      font-size: 14px;
      color: $black;
      outline: none;
      appearance: none;
      cursor: pointer;
      transition: border-color 0.2s;

      &:focus { border-color: $purple; }
    }

    // ===== 自定义下拉组件 =====
    .custom-select {
      position: relative;
      width: 100%;

      .custom-select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border: 1.5px solid rgba(0, 0, 0, 0.08);
        border-radius: 12px;
        background: $neu-bg;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        outline: none;
        user-select: none;

        &:hover {
          border-color: rgba($purple, 0.3);
          box-shadow: 0 2px 8px rgba($purple, 0.08);
        }

        &:focus {
          border-color: $purple;
          box-shadow: 0 0 0 3px rgba($purple, 0.1);
        }
      }

      &.open .custom-select-trigger {
        border-color: $purple;
        box-shadow: 0 0 0 3px rgba($purple, 0.1);
      }

      &.has-value .select-value {
        color: $black;
        font-weight: 500;
      }

      .select-value {
        font-size: 14px;
        color: $black;

        &.placeholder {
          color: $gray;
          font-weight: 400;
        }
      }

      .select-arrow {
        width: 16px;
        height: 16px;
        color: $gray;
        transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        flex-shrink: 0;
      }

      &.open .select-arrow {
        transform: rotate(180deg);
        color: $purple;
      }
    }

    .form-textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 10px;
      background: $neu-bg;
      font-size: 14px;
      color: $black;
      outline: none;
      resize: vertical;
      min-height: 100px;
      font-family: inherit;
      line-height: 1.5;
      box-sizing: border-box;
      transition: border-color 0.2s;

      &:focus { border-color: $purple; }
      &::placeholder { color: $gray; }
    }

    .char-count {
      text-align: right;
      font-size: 12px;
      color: $gray;
      margin-top: 4px;
      &.insufficient { color: $orange; }
      .hint { font-size: 11px; }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);

    .btn {
      padding: 10px 24px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .btn-cancel {
      background: $neu-bg;
      color: #666;
      box-shadow: 2px 2px 4px rgba(163, 177, 198, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.8);
      &:hover { color: $black; }
    }

    .btn-submit {
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%);
      color: #fff;
      box-shadow: 2px 2px 6px rgba(75, 112, 226, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.5);

      &:hover:not(:disabled) {
        box-shadow: 3px 3px 8px rgba(75, 112, 226, 0.4), -2px -2px 6px rgba(255, 255, 255, 0.6);
        transform: translateY(-1px);
      }

      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  }
}

// ===== 弹出动画 =====
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  .feedback-dialog { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  .feedback-dialog { transform: scale(0.95) translateY(10px); opacity: 0; }
}

// ===== Teleport 下拉面板（全局作用域） =====
.module-dropdown-portal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 6px;
  max-height: 240px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 2px; }

  .custom-select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13.5px;
    color: #555;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
    user-select: none;

    &:hover {
      background: rgba(#4b70e2, 0.06);
      color: #181818;
    }

    &.active {
      background: rgba(#4b70e2, 0.1);
      color: #4b70e2;
      font-weight: 500;
    }

    .check-icon {
      width: 15px;
      height: 15px;
      color: #4b70e2;
      flex-shrink: 0;
    }
  }
}

// ===== 下拉动画 =====
.dropdown-enter-active {
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.99);
}
</style>

<template>
  <div class="admin-feedback-page">
    <div class="page-header">
      <h2 class="page-title">反馈管理</h2>
      <div class="filter-bar">
        <NeuSelect
          v-model="scopeFilter"
          :options="scopeOptions"
          placeholder="全部反馈"
        />
        <NeuSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="全部状态"
        />
      </div>
    </div>

    <div class="feedback-list" v-loading="loading">
      <div v-if="feedbacks.length === 0 && !loading" class="empty-state">
        <p>暂无反馈记录</p>
      </div>

      <div v-for="item in feedbacks" :key="item.id" class="feedback-card neu-card" :class="{ 'is-expanded': expandedId === item.id }">
        <div class="card-main" @click="toggleExpand(item.id)">
          <div class="card-left">
            <span class="status-tag" :class="'status-' + item.status.toLowerCase()">{{ statusMap[item.status] || item.status }}</span>
            <span class="type-tag">{{ typeMap[item.feedbackType] || item.feedbackType }}</span>
            <span class="module-tag" v-if="item.module">{{ moduleMap[item.module] || item.module }}</span>
          </div>
          <div class="card-center">
            <div class="card-title-row">
              <span class="video-title" v-if="item.videoTitle">{{ item.videoTitle }}</span>
              <span class="video-deleted-badge" v-if="item.videoDeleted">已删除</span>
            </div>
            <div class="card-meta">{{ item.username }} · {{ formatTime(item.gmtCreated) }}</div>
          </div>
          <div class="card-right">
            <span v-if="unreadMap[item.id]" class="unread-badge">{{ unreadMap[item.id] }}</span>
            <svg class="expand-arrow" :class="{ rotated: expandedId === item.id }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        <Transition name="expand">
          <div v-if="expandedId === item.id" class="card-detail">
            <!-- 分析快照摘要 -->
            <div class="snapshot-card" v-if="item.analysisSnapshot">
              <div class="snapshot-header">分析摘要快照</div>
              <div class="snapshot-grid">
                <div class="snapshot-item" v-if="item.analysisSnapshot.aiDescription">
                  <label>AI描述</label><p>{{ item.analysisSnapshot.aiDescription }}</p>
                </div>
                <div class="snapshot-item" v-if="item.analysisSnapshot.identityLabel">
                  <label>身份判定</label><p>{{ item.analysisSnapshot.identityLabel }}</p>
                </div>
                <div class="snapshot-item" v-if="item.analysisSnapshot.universityName">
                  <label>高校关联</label><p>{{ item.analysisSnapshot.universityName }}</p>
                </div>
                <div class="snapshot-item" v-if="item.analysisSnapshot.topicCategory">
                  <label>主题</label><p>{{ item.analysisSnapshot.topicCategory }}{{ item.analysisSnapshot.topicSubCategory ? ' / ' + item.analysisSnapshot.topicSubCategory : '' }}</p>
                </div>
                <div class="snapshot-item" v-if="item.analysisSnapshot.opinionRiskReason">
                  <label>舆论风险</label><p>{{ item.analysisSnapshot.opinionRiskReason }}</p>
                </div>
                <div class="snapshot-item" v-if="item.analysisSnapshot.actionSuggestion">
                  <label>处置建议</label><p>{{ item.analysisSnapshot.actionSuggestion }}{{ item.analysisSnapshot.actionDetail ? '：' + item.analysisSnapshot.actionDetail : '' }}</p>
                </div>
              </div>
            </div>

            <!-- 查看完整分析按钮 -->
            <div class="view-analysis-row">
              <template v-if="!item.videoDeleted">
                <button class="action-btn view-btn" @click.stop="goToAnalysis(item)">查看完整分析</button>
              </template>
              <template v-else>
                <span class="deleted-hint">原视频已删除，仅可查看快照</span>
              </template>
            </div>

            <!-- 聊天记录 -->
            <div class="chat-section">
              <div class="chat-section-title">对话记录</div>
              <div class="chat-messages" :ref="el => setChatMessagesRef(el, item.id)">
                <template v-for="(msg, idx) in parseMessages(item.content)">
                  <div v-if="msg.role === 'system'" :key="'s' + idx" class="msg-system">
                    <span>{{ msg.text }}</span>
                  </div>
                  <div v-else :key="'m' + idx" class="msg-wrap" :class="msg.role === 'user' ? 'msg-left' : 'msg-right'">
                    <div class="msg-bubble" :class="'msg-' + msg.role">
                      <p>{{ msg.text }}</p>
                      <span class="msg-time">{{ formatTime(msg.time) }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- 操作区 -->
            <div class="detail-actions" v-if="(item.status === 'PENDING' || item.status === 'PROCESSING') && item.handlerId === currentUserId">
              <!-- 回复框：纯发消息 -->
              <textarea v-model="replyText" class="reply-textarea" placeholder="输入回复内容..." rows="3"></textarea>
              <div class="reply-btns">
                <button class="action-btn send-btn" @click.stop="handleSendReply(item)" :disabled="replying || !replyText.trim()">{{ replying ? '发送中...' : '发送回复' }}</button>
              </div>
              <!-- 状态按钮：独立改状态，不需要填写回复 -->
              <div class="status-btns">
                <button class="action-btn resolve-btn" @click.stop="handleClose(item, 'RESOLVED')" :disabled="closing || replying">{{ closing ? '处理中...' : '标记已解决' }}</button>
                <button class="action-btn reject-btn" @click.stop="handleClose(item, 'REJECTED')" :disabled="closing || replying">{{ closing ? '处理中...' : '驳回' }}</button>
              </div>
            </div>
            <div class="detail-actions" v-else-if="(item.status === 'PENDING' || item.status === 'PROCESSING') && item.handlerId !== currentUserId">
              <button v-if="!item.handlerId" class="action-btn lock-btn" @click.stop="handleLock(item)" :disabled="locking">{{ locking ? '锁定中...' : '开始处理' }}</button>
              <p v-else class="processing-hint">该反馈正由 {{ item.handlerName }} 处理中</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="pagination-bar" v-if="total > pageSize">
      <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--; loadFeedbacks()">上一页</button>
      <span class="page-info">{{ currentPage }} / {{ Math.ceil(total / pageSize) }}</span>
      <button class="page-btn" :disabled="currentPage >= Math.ceil(total / pageSize)" @click="currentPage++; loadFeedbacks()">下一页</button>
    </div>
  </div>
</template>

<!-- SCRIPT_SECTION -->

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import { getAdminFeedbackList, lockFeedback, replyFeedback, closeFeedback, clearFeedbackUnread, type FeedbackVO, type FeedbackMessage } from '@/api'
import { ElMessage } from 'element-plus'
import { useWebSocket } from '@/composables/useWebSocket'
import type { FeedbackNewData, FeedbackLockedData, FeedbackSyncData } from '@/types'

const router = useRouter()
const NeuSelect = defineAsyncComponent(() => import('../components/NeuSelect.vue').then((m: any) => m.default ?? m))
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id ?? '')
const { subscribeFeedbackNew, subscribeVideoDeleted, subscribeFeedbackLocked, subscribeFeedbackSync } = useWebSocket({ autoConnect: false })

const loading = ref(false)
const feedbacks = ref<FeedbackVO[]>([])
const statusFilter = ref('')
const scopeFilter = ref<'ALL' | 'MINE'>('ALL')
const scopeOptions = [
  { label: '全部反馈', value: 'ALL' },
  { label: '我处理的反馈', value: 'MINE' }
]
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待处理', value: 'PENDING' },
  { label: '处理中', value: 'PROCESSING' },
  { label: '已解决', value: 'RESOLVED' },
  { label: '已驳回', value: 'REJECTED' }
]
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const expandedId = ref<string | null>(null)
const unreadMap = ref<Record<string, number>>({})
const chatMessagesRefs: Record<string, HTMLElement> = {}

const setChatMessagesRef = (el: unknown, id: string) => {
  if (el) chatMessagesRefs[id] = el as HTMLElement
}

const scrollChatToBottom = (id: string) => {
  nextTick(() => {
    const el = chatMessagesRefs[id]
    if (el) el.scrollTop = el.scrollHeight
  })
}
const replyText = ref('')
const locking = ref(false)
const replying = ref(false)
const closing = ref(false)

const statusMap: Record<string, string> = { PENDING: '待处理', PROCESSING: '处理中', RESOLVED: '已解决', REJECTED: '已驳回' }
const typeMap: Record<string, string> = { INACCURATE: '分析不准确', MISSING: '信息缺失', OTHER: '其他' }
const moduleMap: Record<string, string> = { sentiment: '情感分析', risk: '风险评估', speech: '语音识别', visual: '视觉分析', spread: '传播预测', other: '其他' }

watch([scopeFilter, statusFilter], () => {
  currentPage.value = 1
  loadFeedbacks()
})

const loadFeedbacks = async () => {
  loading.value = true
  try {
    const res = await getAdminFeedbackList(
      currentPage.value,
      pageSize,
      statusFilter.value || undefined,
      scopeFilter.value === 'MINE'
    )
    if (res.code === 200 && res.data) {
      feedbacks.value = res.data.records
      total.value = res.data.total
      // 根据 DB adminUnread 恢复未读角标（页面重建后不丢失）
      res.data.records.forEach((f: FeedbackVO) => {
        if (f.adminUnread && f.adminUnread > 0 && expandedId.value !== f.id) {
          unreadMap.value[f.id] = f.adminUnread
        } else if (!f.adminUnread || f.adminUnread === 0) {
          delete unreadMap.value[f.id]
        }
      })

      // 对话展开状态下，列表刷新后自动滚到底部，确保最新消息可见
      if (expandedId.value && res.data.records.some((f: FeedbackVO) => f.id === expandedId.value)) {
        scrollChatToBottom(expandedId.value)
      }
    }
  } catch { /* silent */ }
  loading.value = false
}

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
  replyText.value = ''
  if (expandedId.value === id) {
    if (unreadMap.value[id]) delete unreadMap.value[id]
    scrollChatToBottom(id)
  }
}

type AdminFeedbackMessage = FeedbackMessage | { role: 'system'; text: string; time: string }

const parseMessages = (content: string): AdminFeedbackMessage[] => {
  if (!content) return []
  try { return JSON.parse(content) }
  catch { return [{ role: 'user', text: content, time: '' }] }
}

const goToAnalysis = async (item: FeedbackVO) => {
  // readOnly: 未锁定 或 锁定者不是自己
  const readOnly = !!(item.handlerId && item.handlerId !== currentUserId.value)

  // 只有自己是处理人时才清零 DB 未读数，避免影响其他管理员的红点
  if (item.handlerId === currentUserId.value) {
    await clearFeedbackUnread(item.id).catch(() => {/* silent */})
  }

  router.push({
    path: '/analysis',
    query: { videoId: item.videoId, feedbackId: item.id },
    state: { feedbackData: JSON.parse(JSON.stringify(item)), readOnly }
  })
}

const handleLock = async (item: FeedbackVO) => {
  locking.value = true
  try {
    const res = await lockFeedback(item.id)
    if (res.code === 200) { ElMessage.success('已锁定，请开始处理'); await loadFeedbacks() }
    else { ElMessage.error(res.message || '锁定失败') }
  } catch { ElMessage.error('操作失败') }
  locking.value = false
}

const handleSendReply = async (item: FeedbackVO) => {
  if (!replyText.value.trim()) { ElMessage.warning('请输入回复内容'); return }
  replying.value = true
  try {
    const res = await replyFeedback(item.id, replyText.value.trim())
    if (res.code === 200) { ElMessage.success('回复已发送'); replyText.value = ''; await loadFeedbacks() }
    else { ElMessage.error(res.message || '发送失败') }
  } catch { ElMessage.error('发送失败') }
  replying.value = false
}

const handleClose = async (item: FeedbackVO, status: string) => {
  closing.value = true
  const pendingReply = replyText.value.trim()

  // 若回复框有内容，先发送回复再改状态
  if (pendingReply) {
    try {
      const replyRes = await replyFeedback(item.id, pendingReply)
      if (replyRes.code !== 200) {
        ElMessage.error(replyRes.message || '回复发送失败，操作已取消')
        closing.value = false
        return
      }
      replyText.value = ''
    } catch {
      ElMessage.error('回复发送失败，操作已取消')
      closing.value = false
      return
    }
  }

  try {
    const res = await closeFeedback(item.id, status)
    if (res.code === 200) {
      const baseLabel = status === 'RESOLVED' ? '已标记为已解决' : '已驳回'
      ElMessage.success(pendingReply ? `已回复并${baseLabel}` : baseLabel)
      await loadFeedbacks()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败')
  }
  closing.value = false
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadFeedbacks()
  subscribeFeedbackNew(async (_data: FeedbackNewData) => {
    await loadFeedbacks()
    // unreadMap 已由 loadFeedbacks 根据 DB adminUnread 字段重建，无需手动累加
  })
  // 视频删除后实时刷新列表，更新"已删除"状态
  subscribeVideoDeleted(() => {
    loadFeedbacks()
  })
  // 反馈被锁定后实时刷新列表（状态变为处理中、显示处理人）
  subscribeFeedbackLocked((_data: FeedbackLockedData) => {
    loadFeedbacks()
    // unreadMap 由 loadFeedbacks 重建，锁定时后端已清零 adminUnread
  })
  // 其他管理员会话有更新时实时刷新（仅同步事实，不增加未读）
  subscribeFeedbackSync((data: FeedbackSyncData) => {
    const exists = feedbacks.value.some(f => f.id === data.feedbackId)
    if (exists || !statusFilter.value) {
      loadFeedbacks()
    }
  })
})
</script>

<style scoped lang="scss">
$bg: #F5F7FA;
$neu-1: #F5F7FA;
$neu-2: #DCDFE6;
$white: #FFFFFF;
$gray: #909399;
$black: #303133;
$purple: #409EFF;

.admin-feedback-page {
  min-height: 100vh;

  .page-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;

    .page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px;
      border-radius: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      box-shadow: none;

      :deep(.neu-select) {
        min-width: 132px;
      }

      :deep(.neu-select-trigger) {
        min-height: 38px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
      }
    }
  }

  .empty-state { text-align: center; padding: 80px 20px; color: var(--text-secondary); font-size: 15px; }

  .neu-card {
    background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 16px; overflow: hidden; transition: all 0.3s;
    box-shadow: none;
  }

  .card-main {
    display: flex; align-items: center; gap: 16px; padding: 16px 20px; cursor: pointer; transition: background 0.2s;
    &:hover { background: var(--bg-hover); }
  }
  .card-left { display: flex; gap: 8px; flex-shrink: 0; }
  .status-tag, .type-tag, .module-tag { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
  .status-tag {
    &.status-pending { background: rgba(#e6a23c,0.12); color: #e6a23c; }
    &.status-processing { background: rgba($purple,0.12); color: $purple; }
    &.status-resolved { background: rgba(#52c41a,0.12); color: #52c41a; }
    &.status-rejected { background: rgba(#f56c6c,0.12); color: #f56c6c; }
  }
  .type-tag { background: var(--bg-hover); color: var(--text-secondary); }
  .module-tag { background: rgba($purple,0.12); color: $purple; }

  .card-center {
    flex: 1; min-width: 0;
    .card-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .video-title { font-size: 14px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .video-deleted-badge { padding: 1px 6px; border-radius: 4px; font-size: 11px; background: rgba(#f56c6c,0.12); color: #f56c6c; flex-shrink: 0; }
    .card-meta { font-size: 12px; color: var(--text-secondary); }
  }

  .expand-arrow { width: 18px; height: 18px; color: var(--text-secondary); transition: transform 0.3s; &.rotated { transform: rotate(180deg); } }

  .unread-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: #f56c6c;
    color: #fff !important;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    flex-shrink: 0;
  }

  .card-detail {
    padding: 0 20px 20px; border-top: 1px solid var(--border-color);

    .snapshot-card {
      margin-top: 16px; padding: 16px; border-radius: 8px;
      background: var(--bg-hover); border: 1px solid var(--border-color);
      .snapshot-header { font-size: 13px; font-weight: 600; color: var(--color-primary); margin-bottom: 12px; letter-spacing: 0.5px; }
      .snapshot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .snapshot-item {
        label { display: block; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        p { margin: 0; font-size: 13px; color: var(--text-primary); line-height: 1.5; }
      }
    }

    .view-analysis-row { margin-top: 12px; }
    .view-btn {
      background: var(--color-primary); color: #fff !important;
      padding: 8px 20px; border: none; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.25s;
      &:hover { transform: translateY(-1px); box-shadow: none; }
    }
    .deleted-hint { font-size: 13px; color: var(--text-secondary); font-style: italic; }

    .chat-section { margin-top: 16px; }
    .chat-section-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; letter-spacing: 0.5px; }
    .chat-messages { display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 4px; }
    .msg-system {
      display: flex; justify-content: center; align-items: center;
      span {
        font-size: 11px; color: var(--text-tertiary); background: var(--bg-hover);
        padding: 4px 12px; border-radius: 20px; font-style: italic;
      }
    }
    .msg-wrap {
      display: flex;
      &.msg-left { justify-content: flex-start; }
      &.msg-right { justify-content: flex-end; }
    }
    .msg-bubble {
      max-width: 80%; padding: 10px 14px; border-radius: 14px;
      &.msg-user { background: var(--bg-hover); color: var(--text-primary); border-bottom-left-radius: 4px; }
      &.msg-admin { background: #2f86e6; color: #fff !important; border-bottom-right-radius: 4px;
        p { color: #fff !important; }
        .msg-time { color: rgba(255,255,255,0.92) !important; }
        .msg-tag { background: rgba(255,255,255,0.24); color: #fff !important; }
      }
      .msg-meta { display: flex; gap: 6px; margin-bottom: 4px; }
      .msg-tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; background: rgba($purple, 0.12); color: $purple; }
      p { margin: 0; font-size: 13px; line-height: 1.5; word-break: break-word; }
      .msg-time { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 4px; text-align: right; }
    }

    .detail-actions { margin-top: 20px; }
    .reply-textarea {
      width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 10px;
      background: var(--bg-card); color: var(--text-primary); font-size: 14px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box; margin-bottom: 12px;
      &:focus { border-color: $purple; }
      &::placeholder { color: var(--text-tertiary); }
    }
    .reply-btns { display: flex; gap: 10px; }
    .status-btns { display: flex; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border-color); }
    .action-btn {
      padding: 8px 20px; border: none; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.25s;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .lock-btn { background: linear-gradient(135deg, $purple 0%, #7c9df7 100%); color: #fff; }
    .send-btn { background: linear-gradient(135deg, $purple 0%, #7c9df7 100%); color: #fff; }
    .resolve-btn { background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); color: #fff; }
    .reject-btn { background: var(--bg-hover); color: #f56c6c; box-shadow: none; }
    .processing-hint { font-size: 13px; color: var(--text-secondary); font-style: italic; }
  }

  .pagination-bar {
    display: flex; justify-content: center; align-items: center; gap: 16px; padding: 20px 0;
    .page-btn {
      padding: 8px 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-card); color: var(--text-primary); font-size: 13px; cursor: pointer;
      box-shadow: none; transition: all 0.25s;
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      &:hover:not(:disabled) { color: $purple; border-color: $purple; }
    }
    .page-info { font-size: 13px; color: var(--text-secondary); }
  }

  @media (max-width: 900px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;

      .filter-bar {
        width: 100%;
        flex-wrap: wrap;
      }

      :deep(.neu-select) {
        flex: 1;
        min-width: 140px;
      }
    }
  }
}

.expand-enter-active, .expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to, .expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>


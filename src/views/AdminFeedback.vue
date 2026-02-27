<template>
  <div class="admin-feedback-page">
    <div class="page-header">
      <h2 class="page-title">反馈管理</h2>
      <div class="filter-bar">
        <select v-model="statusFilter" class="filter-select" @change="loadFeedbacks">
          <option value="">全部状态</option>
          <option value="PENDING">待处理</option>
          <option value="PROCESSING">处理中</option>
          <option value="RESOLVED">已解决</option>
          <option value="REJECTED">已驳回</option>
        </select>
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
              <button v-if="!item.videoDeleted" class="action-btn view-btn" @click.stop="goToAnalysis(item)">查看完整分析</button>
              <span v-else class="deleted-hint">原视频已删除，仅可查看快照</span>
            </div>

            <!-- 聊天记录 -->
            <div class="chat-section">
              <div class="chat-section-title">对话记录</div>
              <div class="chat-messages">
                <div v-for="(msg, idx) in parseMessages(item.content)" :key="idx" class="msg-wrap" :class="msg.role === 'user' ? 'msg-left' : 'msg-right'">
                  <div class="msg-bubble" :class="'msg-' + msg.role">
                    <div class="msg-meta" v-if="msg.type || msg.module">
                      <span class="msg-tag" v-if="msg.type">{{ typeMap[msg.type] || msg.type }}</span>
                      <span class="msg-tag" v-if="msg.module">{{ moduleMap[msg.module] || msg.module }}</span>
                    </div>
                    <p>{{ msg.text }}</p>
                    <span class="msg-time">{{ formatTime(msg.time) }}</span>
                  </div>
                </div>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import { getAdminFeedbackList, lockFeedback, replyFeedback, closeFeedback, type FeedbackVO, type FeedbackMessage } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id ?? '')

const loading = ref(false)
const feedbacks = ref<FeedbackVO[]>([])
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const expandedId = ref<string | null>(null)
const replyText = ref('')
const locking = ref(false)
const replying = ref(false)
const closing = ref(false)

const statusMap: Record<string, string> = { PENDING: '待处理', PROCESSING: '处理中', RESOLVED: '已解决', REJECTED: '已驳回' }
const typeMap: Record<string, string> = { INACCURATE: '分析不准确', MISSING: '信息缺失', OTHER: '其他' }
const moduleMap: Record<string, string> = { sentiment: '情感分析', risk: '风险评估', speech: '语音识别', visual: '视觉分析', spread: '传播预测', other: '其他' }

const loadFeedbacks = async () => {
  loading.value = true
  try {
    const res = await getAdminFeedbackList(currentPage.value, pageSize, statusFilter.value || undefined)
    if (res.code === 200 && res.data) { feedbacks.value = res.data.records; total.value = res.data.total }
  } catch { /* silent */ }
  loading.value = false
}

const toggleExpand = (id: string) => { expandedId.value = expandedId.value === id ? null : id; replyText.value = '' }

const parseMessages = (content: string): FeedbackMessage[] => {
  if (!content) return []
  try { return JSON.parse(content) }
  catch { return [{ role: 'user', text: content, time: '' }] }
}

const goToAnalysis = async (item: FeedbackVO) => {
  // 已被其他管理员接管，禁止进入完整分析
  if (item.handlerId && item.handlerId !== currentUserId.value) {
    ElMessage.warning(`该反馈已由 ${item.handlerName || '其他管理员'} 处理，无法进入完整分析`)
    return
  }

  // 点击“查看完整分析”即自动锁定，进入处理模式
  if (!item.handlerId) {
    try {
      const lockRes = await lockFeedback(item.id)
      if (lockRes.code !== 200) {
        ElMessage.error(lockRes.message || '锁定失败，无法进入完整分析')
        await loadFeedbacks()
        return
      }
    } catch {
      ElMessage.error('锁定失败，可能已被其他管理员接管')
      await loadFeedbacks()
      return
    }
  }

  router.push({
    path: '/analysis',
    query: { videoId: item.videoId, feedback: item.id, feedbackId: item.id },
    state: { feedbackData: JSON.parse(JSON.stringify(item)) }
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

onMounted(() => { loadFeedbacks() })
</script>

<style scoped lang="scss">
$bg: #edf2f0;
$neu-1: #ecf0f3;
$neu-2: #d1d9e6;
$white: #f9f9f9;
$gray: #a0a5a8;
$black: #181818;
$purple: #4b70e2;

.admin-feedback-page {
  min-height: 100vh;

  .page-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
    .page-title { font-size: 22px; font-weight: 700; color: $black; margin: 0; }
    .filter-select {
      padding: 8px 16px; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px;
      background: $neu-1; font-size: 14px; color: $black; outline: none; cursor: pointer;
      &:focus { border-color: $purple; }
    }
  }

  .empty-state { text-align: center; padding: 80px 20px; color: $gray; font-size: 15px; }

  .neu-card {
    background: $neu-1; border-radius: 16px; margin-bottom: 16px; overflow: hidden; transition: all 0.3s;
    box-shadow: 6px 6px 12px rgba(163,177,198,0.4), -6px -6px 12px rgba(255,255,255,0.9);
  }

  .card-main {
    display: flex; align-items: center; gap: 16px; padding: 16px 20px; cursor: pointer; transition: background 0.2s;
    &:hover { background: rgba($purple, 0.02); }
  }
  .card-left { display: flex; gap: 8px; flex-shrink: 0; }
  .status-tag, .type-tag, .module-tag { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
  .status-tag {
    &.status-pending { background: rgba(#e6a23c,0.12); color: #e6a23c; }
    &.status-processing { background: rgba($purple,0.12); color: $purple; }
    &.status-resolved { background: rgba(#52c41a,0.12); color: #52c41a; }
    &.status-rejected { background: rgba(#f56c6c,0.12); color: #f56c6c; }
  }
  .type-tag { background: rgba($black,0.06); color: #666; }
  .module-tag { background: rgba($purple,0.06); color: $purple; }

  .card-center {
    flex: 1; min-width: 0;
    .card-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .video-title { font-size: 14px; font-weight: 500; color: $black; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .video-deleted-badge { padding: 1px 6px; border-radius: 4px; font-size: 11px; background: rgba(#f56c6c,0.1); color: #f56c6c; flex-shrink: 0; }
    .card-meta { font-size: 12px; color: $gray; }
  }

  .expand-arrow { width: 18px; height: 18px; color: $gray; transition: transform 0.3s; &.rotated { transform: rotate(180deg); } }

  .card-detail {
    padding: 0 20px 20px; border-top: 1px solid rgba(0,0,0,0.05);

    .snapshot-card {
      margin-top: 16px; padding: 16px; border-radius: 12px;
      background: rgba($purple, 0.03); border: 1px solid rgba($purple, 0.08);
      .snapshot-header { font-size: 13px; font-weight: 600; color: $purple; margin-bottom: 12px; letter-spacing: 0.5px; }
      .snapshot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .snapshot-item {
        label { display: block; font-size: 11px; font-weight: 600; color: $gray; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        p { margin: 0; font-size: 13px; color: $black; line-height: 1.5; }
      }
    }

    .view-analysis-row { margin-top: 12px; }
    .view-btn {
      background: linear-gradient(135deg, $purple 0%, #7c9df7 100%); color: #fff;
      padding: 8px 20px; border: none; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.25s;
      &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba($purple, 0.3); }
    }
    .deleted-hint { font-size: 13px; color: $gray; font-style: italic; }

    .chat-section { margin-top: 16px; }
    .chat-section-title { font-size: 13px; font-weight: 600; color: $gray; margin-bottom: 10px; letter-spacing: 0.5px; }
    .chat-messages { display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 4px; }
    .msg-wrap {
      display: flex;
      &.msg-left { justify-content: flex-start; }
      &.msg-right { justify-content: flex-end; }
    }
    .msg-bubble {
      max-width: 80%; padding: 10px 14px; border-radius: 14px;
      &.msg-user { background: rgba($purple, 0.08); color: $black; border-bottom-left-radius: 4px; }
      &.msg-admin { background: linear-gradient(135deg, $purple 0%, #7c9df7 100%); color: #fff; border-bottom-right-radius: 4px;
        .msg-time { color: rgba(255,255,255,0.7); }
        .msg-tag { background: rgba(255,255,255,0.2); color: #fff; }
      }
      .msg-meta { display: flex; gap: 6px; margin-bottom: 4px; }
      .msg-tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; background: rgba($purple, 0.1); color: $purple; }
      p { margin: 0; font-size: 13px; line-height: 1.5; word-break: break-word; }
      .msg-time { display: block; font-size: 11px; color: $gray; margin-top: 4px; text-align: right; }
    }

    .detail-actions { margin-top: 20px; }
    .reply-textarea {
      width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px;
      background: $white; font-size: 14px; font-family: inherit; resize: vertical; outline: none; box-sizing: border-box; margin-bottom: 12px;
      &:focus { border-color: $purple; }
    }
    .reply-btns { display: flex; gap: 10px; }
    .status-btns { display: flex; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(0,0,0,0.06); }
    .action-btn {
      padding: 8px 20px; border: none; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.25s;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .lock-btn { background: linear-gradient(135deg, $purple 0%, #7c9df7 100%); color: #fff; }
    .send-btn { background: linear-gradient(135deg, $purple 0%, #7c9df7 100%); color: #fff; }
    .resolve-btn { background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); color: #fff; }
    .reject-btn { background: $neu-1; color: #f56c6c; box-shadow: 2px 2px 4px rgba(163,177,198,0.3), -2px -2px 4px rgba(255,255,255,0.8); }
    .processing-hint { font-size: 13px; color: $gray; font-style: italic; }
  }

  .pagination-bar {
    display: flex; justify-content: center; align-items: center; gap: 16px; padding: 20px 0;
    .page-btn {
      padding: 8px 16px; border: none; border-radius: 8px; background: $neu-1; color: $black; font-size: 13px; cursor: pointer;
      box-shadow: 2px 2px 4px rgba(163,177,198,0.3), -2px -2px 4px rgba(255,255,255,0.8); transition: all 0.25s;
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      &:hover:not(:disabled) { color: $purple; }
    }
    .page-info { font-size: 13px; color: $gray; }
  }
}

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
</style>


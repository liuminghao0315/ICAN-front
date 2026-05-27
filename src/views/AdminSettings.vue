<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAdminCookies,
  addAdminCookie,
  updateAdminCookie,
  updateAdminCookieStatus,
  deleteAdminCookie,
  getSystemSettings,
  updateSystemSetting,
  type PlatformCookieVO,
  type SystemSettingsData
} from '@/api'

// ==================== Cookie 管理 ====================
const loading = ref(false)
const cookies = ref<Record<string, PlatformCookieVO[]>>({ KUAISHOU: [] })

const showAddDialog = ref(false)
const addForm = ref({ platform: '', cookieValue: '', label: '' })
const addLoading = ref(false)

const showEditDialog = ref(false)
const editForm = ref({ id: '', cookieValue: '', label: '' })
const editLoading = ref(false)
const concurrencyInputRef = ref<HTMLInputElement | null>(null)
const addLabelInputRef = ref<HTMLInputElement | null>(null)
const addCookieTextareaRef = ref<HTMLTextAreaElement | null>(null)
const editLabelInputRef = ref<HTMLInputElement | null>(null)
const editCookieTextareaRef = ref<HTMLTextAreaElement | null>(null)

const shouldIgnoreKeyboardSubmit = (event: KeyboardEvent) =>
  event.isComposing || event.keyCode === 229

const focusElement = (target: HTMLInputElement | HTMLTextAreaElement | null) => {
  if (!target) return
  nextTick(() => {
    setTimeout(() => target.focus(), 40)
  })
}

const platforms = [
  { key: 'KUAISHOU', name: '快手' }
]

async function fetchCookies() {
  try {
    const res = await getAdminCookies()
    if (res.code === 200) {
      cookies.value = res.data
    } else {
      ElMessage.error(res.message || '获取Cookie列表失败')
    }
  } catch {
    ElMessage.error('网络错误')
  }
}

function openAddDialog(platform: string) {
  addForm.value = { platform, cookieValue: '', label: '' }
  showAddDialog.value = true
}

async function handleAdd() {
  if (!addForm.value.cookieValue.trim()) {
    ElMessage.warning('Cookie值不能为空')
    return
  }
  addLoading.value = true
  try {
    const res = await addAdminCookie(addForm.value.platform, addForm.value.cookieValue.trim(), addForm.value.label.trim() || undefined)
    if (res.code === 200) {
      ElMessage.success('添加成功')
      showAddDialog.value = false
      await fetchCookies()
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch {
    ElMessage.error('网络错误')
  } finally {
    addLoading.value = false
  }
}

function openEditDialog(cookie: PlatformCookieVO) {
  editForm.value = { id: cookie.id, cookieValue: cookie.cookieValue, label: cookie.label || '' }
  showEditDialog.value = true
}

function handleSaveConcurrencyEnter(event: KeyboardEvent) {
  if (shouldIgnoreKeyboardSubmit(event)) return
  event.preventDefault()
  if (savingConcurrency.value) return
  void saveConcurrency()
}

function handleAddCookieShortcut(event: KeyboardEvent) {
  if (shouldIgnoreKeyboardSubmit(event)) return
  event.preventDefault()
  if (addLoading.value) return
  void handleAdd()
}

function handleEditCookieShortcut(event: KeyboardEvent) {
  if (shouldIgnoreKeyboardSubmit(event)) return
  event.preventDefault()
  if (editLoading.value) return
  void handleEdit()
}

async function handleEdit() {
  if (!editForm.value.cookieValue.trim()) {
    ElMessage.warning('Cookie值不能为空')
    return
  }
  editLoading.value = true
  try {
    const res = await updateAdminCookie(editForm.value.id, editForm.value.cookieValue.trim(), editForm.value.label.trim() || undefined)
    if (res.code === 200) {
      ElMessage.success('更新成功')
      showEditDialog.value = false
      await fetchCookies()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch {
    ElMessage.error('网络错误')
  } finally {
    editLoading.value = false
  }
}

async function handleDelete(cookie: PlatformCookieVO) {
  try {
    const res = await deleteAdminCookie(cookie.id)
    if (res.code === 200) {
      ElMessage.success('已删除')
      await fetchCookies()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch {
    ElMessage.error('网络错误')
  }
}

function truncateCookie(value: string, maxLen = 50): string {
  return value.length > maxLen ? value.substring(0, maxLen) + '...' : value
}

function formatTime(time: string | null): string {
  if (!time) return '从未使用'
  const d = new Date(time)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ==================== 系统设置 ====================
const settingsLoading = ref(false)
const maxConcurrency = ref('2')
const processingCount = ref(0)
const pendingConcurrency = ref<number | null>(null)
const savingConcurrency = ref(false)

async function fetchSettings() {
  try {
    const res = await getSystemSettings()
    if (res.code === 200) {
      maxConcurrency.value = res.data.settings['max_analysis_concurrency'] || '2'
      processingCount.value = res.data.processingCount
      pendingConcurrency.value = res.data.pendingConcurrency
    }
  } catch {
    ElMessage.error('获取设置失败')
  }
}

async function saveConcurrency() {
  const val = parseInt(maxConcurrency.value)
  if (isNaN(val) || val < 1 || val > 10) {
    ElMessage.warning('并发数范围: 1-10')
    return
  }
  savingConcurrency.value = true
  try {
    const res = await updateSystemSetting('max_analysis_concurrency', String(val))
    if (res.code === 200) {
      ElMessage.success(res.message || '设置已更新')
      await fetchSettings()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch {
    ElMessage.error('网络错误')
  } finally {
    savingConcurrency.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([fetchCookies(), fetchSettings()])
  } finally {
    loading.value = false
  }
})

watch(showAddDialog, (visible) => {
  if (visible) focusElement(addLabelInputRef.value)
}, { flush: 'post' })

watch(showEditDialog, (visible) => {
  if (visible) focusElement(editLabelInputRef.value)
}, { flush: 'post' })
</script>

<template>
  <div class="admin-settings-page">
    <div class="page-header">
      <h2>系统设置</h2>
      <p class="page-desc">管理平台Cookie与分析并发控制</p>
    </div>

    <!-- Cookie 管理 -->
    <div class="platform-sections">
      <div v-for="platform in platforms" :key="platform.key" class="platform-section">
        <div class="section-header">
          <h3>Cookie 管理 - {{ platform.name }}</h3>
          <button class="btn-add" @click="openAddDialog(platform.key)">+ 添加Cookie</button>
        </div>

        <div v-if="cookies[platform.key]?.length === 0" class="empty-state">
          暂无Cookie，点击上方按钮添加
        </div>

        <div v-else class="cookie-list">
          <div v-for="cookie in cookies[platform.key]" :key="cookie.id" class="cookie-card">
            <div class="cookie-main">
              <div class="cookie-label">
                <span class="label-text">{{ cookie.label || '未命名' }}</span>
                <span :class="['status-badge', cookie.status === 'ACTIVE' ? 'active' : 'expired']">
                  {{ cookie.status === 'ACTIVE' ? '活跃' : '过期' }}
                </span>
              </div>
              <div class="cookie-value" :title="cookie.cookieValue">
                {{ truncateCookie(cookie.cookieValue) }}
              </div>
              <div class="cookie-meta">
                <span>使用 {{ cookie.useCount }} 次</span>
                <span>最后使用: {{ formatTime(cookie.lastUsedAt) }}</span>
              </div>
            </div>
            <div class="cookie-actions">
              <button class="btn-action btn-edit" @click="openEditDialog(cookie)">编辑</button>
              <button class="btn-action btn-delete" @click="handleDelete(cookie)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析并发控制 -->
    <div class="platform-section concurrency-section">
      <div class="section-header">
        <h3>分析并发控制</h3>
      </div>
      <div class="concurrency-content">
        <div class="concurrency-row">
          <label>最大并发数</label>
          <div class="concurrency-input-group">
            <input
              ref="concurrencyInputRef"
              v-model="maxConcurrency"
              type="number"
              min="1"
              max="10"
              class="concurrency-input"
              @keydown.enter="handleSaveConcurrencyEnter"
            />
            <button class="btn-save" :disabled="savingConcurrency" @click="saveConcurrency">
              {{ savingConcurrency ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
        <div class="concurrency-status">
          <span class="status-item">当前正在分析: <b>{{ processingCount }}</b> 个任务</span>
          <span v-if="pendingConcurrency !== null" class="status-item pending-notice">
            已预约: 限制 {{ pendingConcurrency }} 并发（等待当前分析完成后生效）
          </span>
        </div>
      </div>
    </div>

    <!-- 添加对话框 -->
    <Teleport to="body">
      <div v-if="showAddDialog" class="dialog-overlay" @click.self="showAddDialog = false">
        <div class="dialog-content">
          <h3>添加 Cookie</h3>
          <div class="form-group">
            <label>备注名称</label>
            <input ref="addLabelInputRef" v-model="addForm.label" placeholder="如：账号A、小明的号" />
          </div>
          <div class="form-group">
            <label>Cookie 值</label>
            <textarea ref="addCookieTextareaRef" v-model="addForm.cookieValue" rows="5" placeholder="粘贴完整的Cookie字符串" @keydown.enter.ctrl="handleAddCookieShortcut"></textarea>
          </div>
          <div class="dialog-actions">
            <button class="btn-cancel" @click="showAddDialog = false">取消</button>
            <button class="btn-confirm" :disabled="addLoading" @click="handleAdd">
              {{ addLoading ? '添加中...' : '确认添加' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 编辑对话框 -->
    <Teleport to="body">
      <div v-if="showEditDialog" class="dialog-overlay" @click.self="showEditDialog = false">
        <div class="dialog-content">
          <h3>编辑 Cookie</h3>
          <div class="form-group">
            <label>备注名称</label>
            <input ref="editLabelInputRef" v-model="editForm.label" placeholder="如：账号A、小明的号" />
          </div>
          <div class="form-group">
            <label>Cookie 值</label>
            <textarea ref="editCookieTextareaRef" v-model="editForm.cookieValue" rows="5" placeholder="粘贴完整的Cookie字符串" @keydown.enter.ctrl="handleEditCookieShortcut"></textarea>
          </div>
          <div class="dialog-actions">
            <button class="btn-cancel" @click="showEditDialog = false">取消</button>
            <button class="btn-confirm" :disabled="editLoading" @click="handleEdit">
              {{ editLoading ? '保存中...' : '确认保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.admin-settings-page {
  padding: 32px;
  max-width: 960px;
  margin: 0 auto;
  min-height: 100%;
  background: var(--bg-page);
}

.page-header {
  margin-bottom: 32px;

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px;
  }

  .page-desc {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }
}

.platform-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 32px;
}

.platform-section {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
}

.btn-add {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--color-primary, #4f46e5);
  background: transparent;
  color: var(--color-primary, #4f46e5);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--color-primary, #4f46e5);
    color: #fff;
  }
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: var(--text-tertiary, #999);
  font-size: 14px;
}

.cookie-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cookie-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--bg-elevated, rgba(0, 0, 0, 0.02));
  border: 1px solid var(--border-light, rgba(0, 0, 0, 0.04));
  gap: 16px;
}

.cookie-main {
  flex: 1;
  min-width: 0;
}

.cookie-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;

  .label-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;

  &.active {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  }

  &.expired {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }
}

.cookie-value {
  font-size: 12px;
  color: var(--text-tertiary, #888);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.cookie-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-tertiary, #999);
}

.cookie-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  padding: 5px 10px;
  border-radius: 5px;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
}

.btn-edit {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.btn-delete {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

// 并发控制
.concurrency-section {
  margin-top: 0;
}

.concurrency-content {
  padding: 8px 0;
}

.concurrency-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
  }
}

.concurrency-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.concurrency-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg-elevated, #fafafa);
  color: var(--text-primary);
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--primary-color, #4f46e5);
  }
}

.btn-save {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: var(--primary-color, #4f46e5);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.concurrency-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  font-size: 13px;
  color: var(--text-secondary);

  b {
    color: var(--text-primary);
  }
}

.pending-notice {
  color: #d97706;
  font-weight: 500;
}

// Dialog styles
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog-content {
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 28px;
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;

  h3 {
    margin: 0 0 20px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }

  input, textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 8px;
    font-size: 14px;
    background: var(--bg-elevated, #fafafa);
    color: var(--text-primary);
    resize: vertical;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: var(--primary-color, #4f46e5);
    }
  }

  textarea {
    font-family: monospace;
    font-size: 12px;
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #ddd);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: var(--primary-color, #4f46e5);
  color: #fff;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>

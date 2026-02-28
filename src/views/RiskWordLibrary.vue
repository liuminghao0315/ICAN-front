<template>
  <div class="risk-word-library">

    <!-- ===== 左侧词库包导航栏（轻盈透明，飘在背景上）===== -->
    <aside class="pack-sidebar">
      <!-- 搜索框 + 排序按钮 -->
      <div class="sidebar-search">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input v-model="packSearch" class="search-input" placeholder="搜索词汇、包名、描述..." />
        <button v-if="packSearch" class="search-clear" @click="packSearch = ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <!-- 排序按钮 -->
      <div class="sidebar-sort-bar">
        <div class="sort-bar-inner">
          <!-- 左侧：排序字段选择（点击弹出下拉） -->
          <div class="sort-field-wrap">
            <button class="sort-field-btn" @click.stop="showSortDropdown = !showSortDropdown">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="sort-icon">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="15" y2="12"/>
                <line x1="3" y1="18" x2="9" y2="18"/>
              </svg>
              <span class="sort-label">{{ sortFieldLabel }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sort-chevron" :class="{ 'is-open': showSortDropdown }">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <!-- 下拉菜单 -->
            <Transition name="sort-drop">
              <div v-if="showSortDropdown" class="sort-dropdown">
                <button class="sort-drop-item" :class="{ 'is-active': sortField === 'date' }" @click="selectSortField('date')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  按添加日期
                  <svg v-if="sortField === 'date'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="drop-check">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                <button class="sort-drop-item" :class="{ 'is-active': sortField === 'count' }" @click="selectSortField('count')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20V10"></path>
                    <path d="M18 20V4"></path>
                    <path d="M6 20v-4"></path>
                  </svg>
                  按总词汇数
                  <svg v-if="sortField === 'count'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="drop-check">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </div>
            </Transition>
          </div>
          <!-- 右侧：升降序切换 -->
          <button class="sort-order-btn" @click="toggleSortOrder" :title="sortOrder === 'desc' ? '当前降序，点击切换升序' : '当前升序，点击切换降序'">
            <svg v-if="sortOrder === 'desc'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="order-icon">
              <!-- 降序：大→小，箭头向下 -->
              <line x1="4" y1="6" x2="11" y2="6"/>
              <line x1="4" y1="12" x2="9" y2="12"/>
              <line x1="4" y1="18" x2="7" y2="18"/>
              <polyline points="15 3 15 21"/>
              <polyline points="11 17 15 21 19 17"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="order-icon">
              <!-- 升序：小→大，箭头向上 -->
              <line x1="4" y1="6" x2="7" y2="6"/>
              <line x1="4" y1="12" x2="9" y2="12"/>
              <line x1="4" y1="18" x2="11" y2="18"/>
              <polyline points="15 3 15 21"/>
              <polyline points="11 7 15 3 19 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 词库包列表 -->
      <div class="pack-list">
        <!-- 加载骨架 -->
        <div v-if="dataLoading" class="pack-skeleton">
          <div v-for="i in 4" :key="i" class="pack-skeleton-item">
            <div class="pack-sk-icon"></div>
            <div class="pack-sk-info">
              <div class="pack-sk-line long"></div>
              <div class="pack-sk-line short"></div>
            </div>
          </div>
        </div>
        <TransitionGroup v-else name="pack-list" tag="div">
          <div
            v-for="pack in filteredPacks"
            :key="pack.id"
            class="pack-item"
            :class="{ 'is-active': activePack?.id === pack.id }"
            @click="selectPack(pack)"
          >
            <div class="pack-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div class="pack-info">
              <span class="pack-name">{{ pack.name }}</span>
              <span class="pack-meta">
                <template v-if="packSearch.trim()">
                  <template v-if="pack.name.includes(packSearch.trim()) || pack.description.includes(packSearch.trim())">
                    名称或描述匹配
                  </template>
                  <template v-else>
                    {{ getSearchMatchCount(pack) }} 个词汇匹配
                  </template>
                  / {{ pack.words.length }} 词
                </template>
                <template v-else>{{ pack.words.length }} 词</template>
              </span>
            </div>
            <!-- 更多操作按钮 -->
            <button class="pack-more-btn" @click.stop="openPackMenu($event, pack)" title="更多操作">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
          </div>
        </TransitionGroup>

        <!-- 空搜索结果 -->
        <div v-if="filteredPacks.length === 0 && packSearch" class="pack-empty-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>没有包含「{{ packSearch }}」的词库包</span>
        </div>
      </div>

      <!-- 新建词包按钮 -->
      <div class="sidebar-footer">
        <button class="new-pack-btn" @click="showNewPackModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          新建词库包
        </button>
      </div>
    </aside>

    <!-- ===== 右侧工作区（悬浮白卡片）===== -->
    <main class="workspace">

      <!-- 加载骨架屏 -->
      <div v-if="dataLoading" class="skeleton-workspace">
        <div class="skeleton-header">
          <div class="skeleton-block title-block"></div>
          <div class="skeleton-block btn-block"></div>
        </div>
        <div class="skeleton-filter-bar">
          <div v-for="i in 4" :key="i" class="skeleton-block pill-block"></div>
        </div>
        <div class="skeleton-tags">
          <div v-for="i in 12" :key="i" class="skeleton-block tag-block" :style="{ width: (50 + Math.floor((i * 37) % 80)) + 'px' }"></div>
        </div>
      </div>

      <!-- 无词库包时的全局空状态 -->
      <Transition name="empty-fade" mode="out-in">
        <div v-if="!dataLoading && wordPacks.length === 0" key="no-packs" class="empty-state-full">
          <div class="empty-illustration">
            <div class="empty-icon-wrap">
              <svg viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="48" fill="rgba(75,112,226,0.06)" stroke="rgba(75,112,226,0.15)" stroke-width="1.5"></circle>
                <path d="M60 30 L60 90 M30 60 L90 60" stroke="rgba(75,112,226,0.25)" stroke-width="2" stroke-linecap="round"></path>
                <path d="M60 20 C60 20 80 30 80 50 L80 75 L60 85 L40 75 L40 50 C40 30 60 20 60 20Z"
                  fill="rgba(75,112,226,0.08)" stroke="rgba(75,112,226,0.3)" stroke-width="1.5" stroke-linejoin="round"></path>
                <line x1="60" y1="38" x2="60" y2="52" stroke="rgba(75,112,226,0.5)" stroke-width="2" stroke-linecap="round"></line>
                <circle cx="60" cy="58" r="2" fill="rgba(75,112,226,0.5)"></circle>
              </svg>
            </div>
          </div>
          <h3 class="empty-title">还没有任何词库包</h3>
          <p class="empty-desc">创建你的第一个词库包，将风险词汇按主题分类管理</p>
          <div class="empty-actions">
            <button class="btn-primary" @click="showNewPackModal = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              新建词库包
            </button>
          </div>
        </div>

        <!-- 有词库包时的工作区 -->
        <div v-else key="workspace-content" class="workspace-inner">

          <!-- 顶部信息看板 -->
          <div class="workspace-header">
            <div class="header-left">
              <Transition name="pack-switch" mode="out-in">
                <div :key="activePack?.id" class="pack-title-block">
                  <h2 class="pack-title">{{ activePack?.name ?? '请选择词库包' }}</h2>
                  <p class="pack-desc">{{ activePack?.description ?? '从左侧选择一个词库包开始管理' }}</p>
                </div>
              </Transition>
            </div>
            <div class="header-right" v-if="activePack">
              <!-- AI 智能扩写按钮 -->
              <button class="btn-ai-discover" @click="triggerAIDiscover">
                <span class="ai-sparkle-icon">✨</span>
                <span>AI 智能扩写</span>
              </button>
              <!-- 手动添加按钮 -->
              <button class="btn-primary" @click="showAddWordModal = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                手动添加
              </button>
              <!-- 导出按钮 -->
              <button class="btn-export" @click="exportPack(activePack)" title="导出词库包为 .rwpack 文件">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                导出
              </button>
            </div>
          </div>

          <!-- 筛选 Pill Bar + 词汇矩阵 -->
          <div class="workspace-body">
          <!-- 筛选 Pill Bar -->
          <div class="filter-bar" v-if="displayPack">
            <button
              v-for="f in riskFilters"
              :key="f.value"
              class="filter-pill"
              :class="{ 'is-active': activeFilter === f.value, [`pill-${f.value}`]: activeFilter === f.value }"
              @click="activeFilter = f.value"
            >
              <span v-if="f.value !== 'all'" class="pill-dot" :class="`dot-${f.value}`"></span>
              {{ f.label }}
              <span class="pill-count">{{ getFilterCount(f.value) }}</span>
            </button>
          </div>

          <!-- 词汇矩阵 / 空状态 -->
          <Transition name="empty-fade" mode="out-in">
            <!-- 未选中词库包 -->
            <div v-if="!displayPack" key="no-select" class="empty-state-center">
              <svg viewBox="0 0 80 80" fill="none" class="empty-svg">
                <circle cx="40" cy="40" r="32" fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.2)" stroke-width="1.5"></circle>
                <path d="M28 40 L52 40 M40 28 L40 52" stroke="rgba(148,163,184,0.4)" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <p class="empty-hint">从左侧选择一个词库包</p>
            </div>

            <!-- 词库包为空 / 当前筛选无结果 -->
            <div v-else-if="filteredWords.length === 0" key="no-words" class="empty-state-center">
              <div class="empty-illustration-sm">
                <svg viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="38" fill="rgba(75,112,226,0.05)" stroke="rgba(75,112,226,0.12)" stroke-width="1.5"></circle>
                  <path d="M50 25 C50 25 68 33 68 48 L68 68 L50 78 L32 68 L32 48 C32 33 50 25 50 25Z"
                    fill="rgba(75,112,226,0.07)" stroke="rgba(75,112,226,0.25)" stroke-width="1.5" stroke-linejoin="round"></path>
                  <line x1="50" y1="40" x2="50" y2="52" stroke="rgba(75,112,226,0.45)" stroke-width="2" stroke-linecap="round"></line>
                  <circle cx="50" cy="58" r="2" fill="rgba(75,112,226,0.45)"></circle>
                </svg>
              </div>
              <template v-if="activeFilter === 'all'">
                <template v-if="packSearch.trim()">
                  <h4 class="empty-title-sm">该词汇包没有包含「{{ packSearch.trim() }}」的词汇</h4>
                  <div class="empty-actions-sm">
                    <button class="btn-primary-sm" @click="packSearch = ''">清除筛选框</button>
                  </div>
                </template>
                <template v-else>
                  <h4 class="empty-title-sm">该词库包还是空的</h4>
                  <p class="empty-desc-sm">点击右上角手动添加，或让 AI 帮你智能扩写</p>
                  <div class="empty-actions-sm">
                    <button class="btn-primary-sm" @click="showAddWordModal = true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      手动添加
                    </button>
                    <button class="btn-ai-sm" @click="triggerAIDiscover">
                      <span>✨</span> AI 智能扩写
                    </button>
                  </div>
                </template>
              </template>
              <template v-else>
                <h4 class="empty-title-sm">当前筛选无结果</h4>
                <p class="empty-desc-sm">该词库包中没有「{{ riskFilters.find(f => f.value === activeFilter)?.label }}」词汇</p>
                <div class="empty-actions-sm">
                  <button class="btn-primary-sm" @click="activeFilter = 'all'">切换至全部</button>
                </div>
              </template>
            </div>

            <!-- 词汇标签矩阵 -->
            <div v-else key="word-matrix" class="word-matrix">
              <TransitionGroup name="word-tag" tag="div" class="word-tags-flow">
                <div
                  v-for="word in filteredWords"
                  :key="word.id"
                  class="word-tag"
                  :class="[`tag-${word.risk}`, { 'is-hovered': hoveredWordId === word.id, 'is-search-match': packSearch.trim() && word.text.includes(packSearch.trim()) }]"
                  @mouseenter="hoveredWordId = word.id"
                  @mouseleave="hoveredWordId = null"
                >
                  <span class="tag-text" v-html="highlightText(word.text)"></span>
                  <div class="tag-actions">
                    <button class="tag-action-btn edit-btn" @click.stop="editWord(word)" title="编辑 / AI扩写">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="tag-action-btn delete-btn" @click.stop="deleteWord(word.id)" title="删除">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path>
                        <path d="M10 11v6"></path><path d="M14 11v6"></path>
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </Transition>
            </div><!-- /.workspace-body -->
        </div>
      </Transition>
    </main>

    <!-- ===== 新建词库包 Modal ===== -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showNewPackModal" class="modal-overlay" @mousedown.self="onNewPackOverlayMouseDown" @mouseup.self="onNewPackOverlayMouseUp">
          <div class="modal-card">
            <div class="modal-header">
              <h3>新建词库包</h3>
              <button class="modal-close" @click="showNewPackModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>词库包名称</label>
                <input v-model="newPackForm.name" class="form-input" placeholder="例如：心理危机、校园霸凌..." maxlength="20" />
              </div>
              <div class="form-group">
                <label>简短描述</label>
                <input v-model="newPackForm.description" class="form-input" placeholder="一两句话描述该词库包的用途..." maxlength="60" />
              </div>
              <!-- 导入分隔线 -->
              <div class="import-divider">
                <span>或从文件导入</span>
              </div>
              <!-- 导入区域 -->
              <div class="import-zone" @click="triggerImport" @dragover.prevent @drop.prevent="handleDropImport">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="import-zone-icon">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span class="import-zone-text">点击或拖拽 <code>.rwpack</code> 文件，支持批量导入</span>
              </div>
              <input
                ref="importFileInput"
                type="file"
                accept=".rwpack"
                multiple
                style="display:none"
                @change="handleImportFiles"
              />
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showNewPackModal = false">取消</button>
              <button class="btn-primary" :disabled="!newPackForm.name.trim()" @click="createPack">创建</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== 添加词汇 Modal ===== -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showAddWordModal" class="modal-overlay" @mousedown.self="onAddWordOverlayMouseDown" @mouseup.self="onAddWordOverlayMouseUp">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ editingWord ? '编辑词汇' : '添加词汇' }}</h3>
              <button class="modal-close" @click="closeWordModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>词汇内容</label>
                <input v-model="wordForm.text" class="form-input" placeholder="输入风险词汇..." maxlength="30" @keydown.enter="saveWord" />
                <p class="form-hint">多个词汇可用逗号或换行分隔批量添加</p>
              </div>
              <div class="form-group">
                <label>风险等级</label>
                <div class="risk-segmented">
                  <button
                    v-for="lvl in riskLevels"
                    :key="lvl.value"
                    class="seg-option"
                    :class="[`seg-${lvl.value}`, { 'is-selected': wordForm.risk === lvl.value }]"
                    @click="wordForm.risk = lvl.value"
                  >{{ lvl.label }}</button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="closeWordModal">取消</button>
              <button class="btn-primary" :disabled="!wordForm.text.trim()" @click="saveWord">
                {{ editingWord ? '保存' : '添加' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== AI 发现通知 Toast ===== -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="showAIToast" class="ai-toast">
          <span class="ai-toast-icon">✨</span>
          <div class="ai-toast-content">
            <strong>AI 正在分析趋势词汇...</strong>
            <span>发现 {{ aiPendingCount }} 个新趋势词待审核</span>
          </div>
          <button class="ai-toast-close" @click="showAIToast = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== 入库成功 Toast ===== -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="showCommitToast" class="ai-commit-toast">
          <span class="ai-commit-toast-icon">✅</span>
          <span class="ai-commit-toast-text">{{ commitToastText }}</span>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== 编辑词库包 Modal ===== -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showEditPackModal" class="modal-overlay" @mousedown.self="onEditPackOverlayMouseDown" @mouseup.self="onEditPackOverlayMouseUp">
          <div class="modal-card">
            <div class="modal-header">
              <h3>编辑词库包</h3>
              <button class="modal-close" @click="showEditPackModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>词库包名称</label>
                <input v-model="editPackForm.name" class="form-input" placeholder="词库包名称..." maxlength="20" />
              </div>
              <div class="form-group">
                <label>简短描述</label>
                <input v-model="editPackForm.description" class="form-input" placeholder="一两句话描述该词库包的用途..." maxlength="60" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showEditPackModal = false">取消</button>
              <button class="btn-primary" :disabled="!editPackForm.name.trim()" @click="saveEditPack">保存</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== 词库包操作菜单 ===== -->
    <Teleport to="body">
      <Transition name="menu-pop">
        <div
          v-if="packMenuVisible && packMenuTarget"
          class="pack-context-menu"
          :style="{ top: packMenuPos.y + 'px', left: packMenuPos.x + 'px' }"
          @click.stop
        >
          <button class="menu-item" @click="openEditPackModal(packMenuTarget)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            重命名
          </button>
          <button class="menu-item" @click="openMergeModal(packMenuTarget)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3"></path>
              <polyline points="15 3 12 6 9 3"></polyline>
              <line x1="12" y1="3" x2="12" y2="13"></line>
            </svg>
            合并到...
          </button>
          <div class="menu-divider"></div>
          <button class="menu-item menu-item-danger" @click="confirmDeletePack(packMenuTarget)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path>
              <path d="M10 11v6"></path><path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"></path>
            </svg>
            删除词库包
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== 合并词库包 Modal ===== -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showMergeModal" class="modal-overlay" @mousedown.self="onMergeOverlayMouseDown" @mouseup.self="onMergeOverlayMouseUp">
          <div class="modal-card">
            <div class="modal-header">
              <h3>合并词库包</h3>
              <button class="modal-close" @click="showMergeModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="merge-desc">
                将「<strong>{{ mergingPack?.name }}</strong>」中的所有词汇合并到目标词库包，合并后「{{ mergingPack?.name }}」将被删除。
              </p>
              <div class="form-group">
                <label>合并到</label>
                <div class="merge-target-list">
                  <div
                    v-for="pack in mergeTargetPacks"
                    :key="pack.id"
                    class="merge-target-item"
                    :class="{ 'is-selected': mergeTargetId === pack.id }"
                    @click="mergeTargetId = pack.id"
                  >
                    <div class="merge-target-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <div class="merge-target-info">
                      <span class="merge-target-name">{{ pack.name }}</span>
                      <span class="merge-target-count">{{ pack.words.length }} 词</span>
                    </div>
                    <div v-if="mergeTargetId === pack.id" class="merge-target-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div v-if="mergeTargetPacks.length === 0" class="merge-no-target">
                    没有其他词库包可合并
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-ghost" @click="showMergeModal = false">取消</button>
              <button class="btn-primary btn-danger-confirm" :disabled="!mergeTargetId" @click="confirmMerge">合并</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== AI 发现审核抽屉 ===== -->    <Teleport to="body">
      <div class="ai-drawer-portal">
        <Transition name="drawer-mask">
          <div v-if="showAIDrawer" class="ai-drawer-mask" @click="closeAIDrawer"></div>
        </Transition>
        <Transition name="drawer-slide">
          <div v-if="showAIDrawer" class="ai-drawer">
            <div class="ai-drawer-header">
              <div class="ai-drawer-title-row">
                <span class="ai-drawer-title">
                  <!-- 盾牌图标 -->
                  <svg class="ai-drawer-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  AI 语义侦测发现
                  <span class="ai-drawer-count">({{ aiRecommendList.length }})</span>
                </span>
                <button class="ai-drawer-close" @click="closeAIDrawer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <!-- 目标容器提示 -->
              <div class="ai-drawer-target" v-if="activePack">
                <svg class="ai-target-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>
                </svg>
                <span>当前入库目标：<strong>{{ activePack.name }}</strong></span>
              </div>
              <!-- 提示词输入区 -->
              <div class="ai-prompt-area">
                <div class="ai-prompt-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ai-prompt-label-icon">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  输入种子词，AI 将破译其隐语变体
                </div>
                <div class="ai-prompt-input-row">
                  <input
                    v-model="aiPromptInput"
                    class="ai-prompt-input"
                    :class="{ 'has-error': aiPromptError }"
                    placeholder="例如：自杀、抑郁、逃课..."
                    maxlength="20"
                    @keydown.enter="runAIAnalysis"
                    :disabled="aiDrawerLoading"
                  />
                  <button class="ai-prompt-run-btn" @click="runAIAnalysis" :disabled="aiDrawerLoading || !aiPromptInput.trim()">
                    <svg v-if="!aiDrawerLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <div v-else class="btn-spinner"></div>
                  </button>
                </div>
                <p v-if="aiPromptError" class="ai-prompt-error">{{ aiPromptError }}</p>
                <p v-else class="ai-prompt-hint">AI 会从形态变异、亚文化梗、情绪隐喻三个维度分析</p>
              </div>
            </div>

            <Transition name="empty-fade" mode="out-in">
              <div v-if="aiDrawerLoading" key="loading" class="ai-drawer-loading">
                <div class="ai-loading-pulse">
                  <div class="pulse-dot"></div>
                  <div class="pulse-dot"></div>
                  <div class="pulse-dot"></div>
                </div>
                <span class="ai-loading-text">AI 正在破译隐语变体...</span>
                <div class="ai-skeleton-list">
                  <div v-for="i in 3" :key="i" class="ai-skeleton-card">
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line long"></div>
                    <div class="skeleton-line medium"></div>
                  </div>
                </div>
              </div>

              <!-- 未分析时的空状态 -->
              <div v-else-if="aiRecommendList.length === 0" key="empty" class="ai-drawer-empty">
                <svg viewBox="0 0 80 80" fill="none" class="ai-empty-svg">
                  <circle cx="40" cy="40" r="32" fill="rgba(75,112,226,0.06)" stroke="rgba(75,112,226,0.15)" stroke-width="1.5"></circle>
                  <path d="M40 20 C40 20 56 28 56 40 L56 58 L40 66 L24 58 L24 40 C24 28 40 20 40 20Z" fill="rgba(75,112,226,0.07)" stroke="rgba(75,112,226,0.25)" stroke-width="1.5" stroke-linejoin="round"></path>
                  <circle cx="40" cy="42" r="2" fill="rgba(75,112,226,0.45)"></circle>
                  <line x1="40" y1="32" x2="40" y2="38" stroke="rgba(75,112,226,0.45)" stroke-width="2" stroke-linecap="round"></line>
                </svg>
                <p class="ai-empty-hint">输入种子词，点击运行开始分析</p>
              </div>

              <div v-else key="list" class="ai-drawer-list">
                <div class="ai-select-all-row">
                  <label class="ai-checkbox-label">
                    <input type="checkbox" class="ai-checkbox" :checked="allChecked" @change="handleSelectAll" />
                    <span class="ai-checkbox-custom"></span>
                    <span class="ai-select-all-text">全选</span>
                  </label>
                  <span class="ai-select-hint">已选 {{ aiRecommendList.filter(i => i.checked).length }} / {{ aiRecommendList.length }}</span>
                </div>

                <TransitionGroup name="ai-card" tag="div" class="ai-card-list">
                  <div
                    v-for="item in aiRecommendList"
                    :key="item.id"
                    class="ai-recommend-card"
                    :class="{ 'is-checked': item.checked }"
                  >
                    <label class="ai-checkbox-label card-checkbox">
                      <input type="checkbox" class="ai-checkbox" v-model="item.checked" />
                      <span class="ai-checkbox-custom"></span>
                    </label>
                    <div class="ai-card-body">
                      <div class="ai-card-top">
                        <span class="ai-word-text">{{ item.text }}</span>
                        <span class="ai-risk-tag" :class="`risk-tag-${item.risk}`">
                          {{ item.risk === 'high' ? '高风险' : item.risk === 'medium' ? '中风险' : '低风险' }}
                        </span>
                      </div>
                      <!-- 建议分类：AI 多维分析 -->
                      <div v-if="item.suggestedCategories && item.suggestedCategories.length" class="ai-suggested-cats">
                        <span class="ai-suggested-label">原因标签</span>
                        <span
                          v-for="cat in item.suggestedCategories"
                          :key="cat"
                          class="ai-cat-tag"
                        >{{ cat }}</span>
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </Transition>

            <div class="ai-drawer-footer" v-if="!aiDrawerLoading && aiRecommendList.length > 0">
              <button class="btn-ai-commit" @click="commitAIWords" :disabled="!aiRecommendList.some(i => i.checked)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9,12 11,14 15,10"></polyline>
                </svg>
                一键入库
              </button>
              <button class="btn-ai-ignore" @click="ignoreAllAI">忽略全部</button>
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getWordPackList,
  createWordPack as apiCreateWordPack,
  updateWordPack as apiUpdateWordPack,
  deleteWordPack as apiDeleteWordPack,
  addWordsToWordPack,
  deleteWordFromPack
} from '@/api'

// 模态框关闭逻辑：只有 mousedown 和 mouseup 都在外部才关闭
let newPackOverlayMouseDown = false
let addWordOverlayMouseDown = false
let editPackOverlayMouseDown = false
let mergeOverlayMouseDown = false

const onNewPackOverlayMouseDown = () => {
  newPackOverlayMouseDown = true
}

const onNewPackOverlayMouseUp = () => {
  if (newPackOverlayMouseDown) {
    showNewPackModal.value = false
  }
  newPackOverlayMouseDown = false
}

const onAddWordOverlayMouseDown = () => {
  addWordOverlayMouseDown = true
}

const onAddWordOverlayMouseUp = () => {
  if (addWordOverlayMouseDown) {
    closeWordModal()
  }
  addWordOverlayMouseDown = false
}

const onEditPackOverlayMouseDown = () => {
  editPackOverlayMouseDown = true
}

const onEditPackOverlayMouseUp = () => {
  if (editPackOverlayMouseDown) {
    showEditPackModal.value = false
  }
  editPackOverlayMouseDown = false
}

const onMergeOverlayMouseDown = () => {
  mergeOverlayMouseDown = true
}

const onMergeOverlayMouseUp = () => {
  if (mergeOverlayMouseDown) {
    showMergeModal.value = false
  }
  mergeOverlayMouseDown = false
}

// ── 类型定义 ──
type RiskLevel = 'high' | 'medium' | 'low'

interface RiskWord {
  id: string
  text: string
  risk: RiskLevel
}

interface WordPack {
  id: string
  name: string
  description: string
  words: RiskWord[]
  _idx?: number  // 原始加载顺序（用于按添加日期排序）
}

interface AIRecommendItem {
  id: string
  text: string
  risk: RiskLevel
  insight?: string
  checked: boolean
  suggestedCategories?: string[]  // AI 多维分析：该词原因标签的其他分类
}

// ── 数据（从后端加载） ──
const wordPacks = ref<WordPack[]>([])
const dataLoading = ref(true)

// AI API Key
const AI_API_KEY = 'sk-f0fb08942c5c49e6bbf63981fc966229'

// AI 提示词输入
const aiPromptInput = ref('')
const aiPromptError = ref('')

// ── 状态 ──
const activePack = ref<WordPack | null>(null)
// 用于驱动右侧内容区的 key，延迟到 leave 动画结束后再切换，避免空状态闪烁
const displayPack = ref<WordPack | null>(null)
const packSearch = ref('')
const activeFilter = ref<'all' | RiskLevel>('all')
const hoveredWordId = ref<string | null>(null)
const showNewPackModal = ref(false)
const showAddWordModal = ref(false)
const showAIToast = ref(false)
const aiPendingCount = ref(0)
const editingWord = ref<RiskWord | null>(null)

// 编辑词库包 Modal
const showEditPackModal = ref(false)
const editingPack = ref<WordPack | null>(null)
const editPackForm = ref({ name: '', description: '' })

// 右键/操作菜单
const packMenuVisible = ref(false)
const packMenuTarget = ref<WordPack | null>(null)
const packMenuPos = ref({ x: 0, y: 0 })

// 合并词库包
const showMergeModal = ref(false)
const mergingPack = ref<WordPack | null>(null)
const mergeTargetId = ref<string | null>(null)
const mergeTargetPacks = computed(() =>
  wordPacks.value.filter(p => p.id !== mergingPack.value?.id)
)

// AI 抽屉状态
const showAIDrawer = ref(false)
const aiDrawerLoading = ref(false)
const aiRecommendList = ref<AIRecommendItem[]>([])

// 入库成功 Toast
const showCommitToast = ref(false)
const commitToastText = ref('')
let commitToastTimer: ReturnType<typeof setTimeout> | null = null

// 排序
const sortOrder = ref<'desc' | 'asc'>('desc') // desc = 最新在前 / 最多在前
const sortField = ref<'date' | 'count'>('date') // date = 按添加日期，count = 按总词汇数
const showSortDropdown = ref(false)

const sortFieldLabel = computed(() => sortField.value === 'date' ? '按添加日期' : '按总词汇数')

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const selectSortField = (field: 'date' | 'count') => {
  sortField.value = field
  showSortDropdown.value = false
}

// 点击外部关闭下拉
const closeSortDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.sort-field-btn') && !target.closest('.sort-dropdown')) {
    showSortDropdown.value = false
  }
}

// 导入词汇包
const importFileInput = ref<HTMLInputElement | null>(null)
const triggerImport = () => { importFileInput.value?.click() }

const handleImportFiles = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return
  await doImportFiles(Array.from(files))
  // 重置 input
  ;(e.target as HTMLInputElement).value = ''
}

const handleDropImport = async (e: DragEvent) => {
  const files = Array.from(e.dataTransfer?.files || []).filter(f => f.name.endsWith('.rwpack'))
  if (files.length === 0) { ElMessage.warning('请拖入 .rwpack 格式文件'); return }
  await doImportFiles(files)
}

const doImportFiles = async (files: File[]) => {
  let successCount = 0   // 新建成功
  let mergeCount = 0     // 重名合并
  let failCount = 0      // 格式/网络错误
  for (const file of files) {
    try {
      const text = await file.text()
      const pack = parsePackFile(text)
      if (!pack) { failCount++; continue }
      const trimmedName = pack.name.trim()
      const existing = wordPacks.value.find(p => p.name.trim() === trimmedName)
      if (existing) {
        // 重名：合并词汇（去重）
        if (pack.words.length > 0) {
          const existingTexts = new Set(existing.words.map(w => w.text.trim()))
          const newWords = pack.words.filter(w => !existingTexts.has(w.text.trim()))
          if (newWords.length > 0) {
            await addWordsToWordPack(existing.id, newWords)
          }
        }
        mergeCount++
        continue
      }
      const res = await apiCreateWordPack({ name: trimmedName, description: pack.description || '暂无描述' })
      if (res.code === 200 && res.data) {
        if (pack.words.length > 0) {
          await addWordsToWordPack(res.data.id, pack.words)
        }
        successCount++
      }
    } catch {
      failCount++
    }
  }
  await loadPacks()
  if (successCount > 0 || mergeCount > 0) {
    const parts = []
    if (successCount > 0) parts.push(`新建 ${successCount} 个`)
    if (mergeCount > 0) parts.push(`合并 ${mergeCount} 个同名`)
    if (failCount > 0) parts.push(`${failCount} 个格式错误`)
    ElMessage.success(`导入完成：${parts.join('，')}`)
    showNewPackModal.value = false
  } else if (failCount > 0) {
    ElMessage.error('导入失败，请检查文件格式')
  }
}

// 解析 .rwpack 文件
const parsePackFile = (text: string): { name: string; description: string; words: { text: string; risk: RiskLevel }[] } | null => {
  try {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    let name = ''
    let description = ''
    const words: { text: string; risk: RiskLevel }[] = []
    for (const line of lines) {
      if (line.startsWith('NAME:')) name = line.slice(5).trim()
      else if (line.startsWith('DESC:')) description = line.slice(5).trim()
      else if (line.startsWith('WORD:')) {
        const parts = line.slice(5).split('|')
        const wordText = parts[0]?.trim()
        const risk = (parts[1]?.trim() as RiskLevel) || 'medium'
        if (wordText) words.push({ text: wordText, risk: ['high','medium','low'].includes(risk) ? risk : 'medium' })
      }
    }
    if (!name) return null
    return { name, description, words }
  } catch { return null }
}

// 导出词汇包
const exportPack = (pack: WordPack) => {
  const lines: string[] = [
    `NAME:${pack.name}`,
    `DESC:${pack.description}`,
    ...pack.words.map(w => `WORD:${w.text}|${w.risk}`)
  ]
  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pack.name}.rwpack`
  a.click()
  URL.revokeObjectURL(url)
}

const newPackForm = ref({ name: '', description: '' })
const wordForm = ref({ text: '', risk: 'medium' as RiskLevel })

// ── 初始化加载 ──
const loadPacks = async () => {
  dataLoading.value = true
  try {
    const res = await getWordPackList()
    if (res.code === 200 && res.data) {
      wordPacks.value = res.data.map((p: any, idx: number) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        _idx: idx,
        words: (p.words || []).map((w: any) => ({
          id: w.id,
          text: w.text,
          risk: (w.risk || 'medium') as RiskLevel,
        }))
      }))
      if (wordPacks.value.length > 0 && !activePack.value) {
        activePack.value = wordPacks.value[0]
        displayPack.value = wordPacks.value[0]
      }
    }
  } catch (e: any) {
    ElMessage.error('加载词库包失败: ' + (e.message || '网络错误'))
  } finally {
    dataLoading.value = false
  }
}

onMounted(() => {
  loadPacks()
  document.addEventListener('click', closePackMenu)
  document.addEventListener('click', closeSortDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closePackMenu)
  document.removeEventListener('click', closeSortDropdown)
})

// ── 常量 ──
const riskFilters = [
  { label: '全部', value: 'all' },
  { label: '高风险', value: 'high' },
  { label: '中风险', value: 'medium' },
  { label: '低风险', value: 'low' },
] as const

const riskLevels = [
  { label: '高风险', value: 'high' as RiskLevel },
  { label: '中风险', value: 'medium' as RiskLevel },
  { label: '低风险', value: 'low' as RiskLevel },
]

// ── 计算属性 ──
const filteredPacks = computed(() => {
  const kw = packSearch.value.trim()
  // 先按搜索词过滤：匹配词汇包名称、描述、或包含的词汇
  let result = kw
    ? wordPacks.value.filter(p =>
        p.name.includes(kw) ||
        p.description.includes(kw) ||
        p.words.some(w => w.text.includes(kw))
      )
    : [...wordPacks.value]
  // 再按排序字段排序
  result = result.slice().sort((a, b) => {
    let diff: number
    if (sortField.value === 'count') {
      diff = a.words.length - b.words.length
    } else {
      diff = (a._idx ?? 0) - (b._idx ?? 0)
    }
    return sortOrder.value === 'desc' ? -diff : diff
  })
  return result
})

const filteredWords = computed(() => {
  if (!displayPack.value) return []
  const words = displayPack.value.words
  const kw = packSearch.value.trim()
  // 先按风险等级筛选
  const byRisk = activeFilter.value === 'all' ? words : words.filter(w => w.risk === activeFilter.value)
  // 再按搜索词筛选（搜索时只显示匹配词汇）
  if (kw) return byRisk.filter(w => w.text.includes(kw))
  return byRisk
})

const getFilterCount = (filter: string) => {
  if (!displayPack.value) return 0
  if (filter === 'all') return displayPack.value.words.length
  return displayPack.value.words.filter(w => w.risk === filter).length
}

// 获取词库包中匹配搜索词的词汇数量
const getSearchMatchCount = (pack: WordPack) => {
  const kw = packSearch.value.trim()
  if (!kw) return 0
  return pack.words.filter(w => w.text.includes(kw)).length
}

// 高亮搜索词
const highlightText = (text: string) => {
  const kw = packSearch.value.trim()
  if (!kw) return text
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(escaped, 'g'), `<mark class="search-highlight">$&</mark>`)
}

// ── 操作 ──
const selectPack = (pack: WordPack) => {
  activePack.value = pack
  activeFilter.value = 'all'
  // 短暂延迟切换 displayPack，让 empty-fade 的 leave 先完成，避免空状态闪烁
  setTimeout(() => { displayPack.value = pack }, 160)
}

const createPack = async () => {
  if (!newPackForm.value.name.trim()) return
  // 名称去重（trim后比较，不区分大小写）
  const trimmedName = newPackForm.value.name.trim()
  const duplicate = wordPacks.value.find(p => p.name.trim() === trimmedName)
  if (duplicate) {
    ElMessage.warning(`词库包「${trimmedName}」已存在，请换一个名称`)
    return
  }
  try {
    const res = await apiCreateWordPack({
      name: trimmedName,
      description: newPackForm.value.description.trim() || '暂无描述',
    })
    if (res.code === 200 && res.data) {
      const newPack: WordPack = {
          id: res.data.id,
          name: res.data.name,
          description: res.data.description || '',
          _idx: wordPacks.value.length,
          words: (res.data.words || []).map((w: any) => ({ id: w.id, text: w.text, risk: (w.risk || 'medium') as RiskLevel }))
      }
      wordPacks.value.push(newPack)
      activePack.value = newPack
      displayPack.value = newPack
      ElMessage.success('词库包创建成功')
    }
  } catch (e: any) {
    ElMessage.error('创建失败: ' + (e.message || '网络错误'))
  }
  showNewPackModal.value = false
  newPackForm.value = { name: '', description: '' }
}

const editWord = (word: RiskWord) => {
  editingWord.value = word
  wordForm.value = { text: word.text, risk: word.risk }
  showAddWordModal.value = true
}

const closeWordModal = () => {
  showAddWordModal.value = false
  editingWord.value = null
  wordForm.value = { text: '', risk: 'medium' }
}

const saveWord = async () => {
  if (!wordForm.value.text.trim() || !activePack.value) return
  if (editingWord.value) {
    // 编辑模式：先删除旧词，再添加新词
    const newText = wordForm.value.text.trim()
    // 去重检测（排除自身）
    const duplicate = activePack.value.words.find(w => w.id !== editingWord.value!.id && w.text.trim() === newText)
    if (duplicate) {
      ElMessage.warning(`词汇「${newText}」已存在于该词库包中`)
      return
    }
    try {
      await deleteWordFromPack(editingWord.value.id)
      await addWordsToWordPack(activePack.value.id, [{ text: newText, risk: wordForm.value.risk }])
      await loadPacks()
      const updated = wordPacks.value.find(p => p.id === activePack.value?.id)
      if (updated) { activePack.value = updated; displayPack.value = updated }
    } catch (e: any) {
      ElMessage.error('保存失败: ' + (e.message || '网络错误'))
    }
  } else {
    // 新增模式：支持逗号分隔批量添加，去重
    const texts = wordForm.value.text.split(/[,，\n]/).map(t => t.trim()).filter(Boolean)
    const existingTexts = new Set(activePack.value.words.map(w => w.text.trim()))
    const uniqueTexts = [...new Set(texts)] // 输入本身去重
    const newTexts = uniqueTexts.filter(t => !existingTexts.has(t))
    const dupTexts = uniqueTexts.filter(t => existingTexts.has(t))
    if (newTexts.length === 0) {
      if (dupTexts.length === 0) {
        ElMessage.warning('请输入有效词汇')
      } else if (uniqueTexts.length === 1) {
        ElMessage.warning('该词汇已存在于该词库包中')
      } else {
        ElMessage.warning('所有词汇均已存在于该词库包中')
      }
      return
    }
    try {
      const wordsToAdd = newTexts.map(text => ({ text, risk: wordForm.value.risk }))
      await addWordsToWordPack(activePack.value.id, wordsToAdd)
      await loadPacks()
      const updated = wordPacks.value.find(p => p.id === activePack.value?.id)
      if (updated) { activePack.value = updated; displayPack.value = updated }
      if (dupTexts.length > 0) {
        ElMessage.success(`成功添加 ${newTexts.length} 个词汇，${dupTexts.length} 个重复已跳过`)
      } else {
        ElMessage.success(`成功添加 ${newTexts.length} 个词汇`)
      }
    } catch (e: any) {
      ElMessage.error('添加失败: ' + (e.message || '网络错误'))
    }
  }
  closeWordModal()
}

const deleteWord = async (wordId: string) => {
  if (!activePack.value) return
  try {
    await deleteWordFromPack(wordId)
    activePack.value.words = activePack.value.words.filter(w => w.id !== wordId)
    if (displayPack.value?.id === activePack.value.id) {
      displayPack.value = { ...activePack.value }
    }
  } catch (e: any) {
    ElMessage.error('删除失败: ' + (e.message || '网络错误'))
  }
}

const triggerAIDiscover = () => {
  // 如果请求正在进行中，直接重新打开抽屉，不重置状态
  if (aiDrawerLoading.value) {
    showAIDrawer.value = true
    return
  }
  // 否则初始化状态
  aiPromptInput.value = ''
  aiPromptError.value = ''
  aiRecommendList.value = []
  showAIDrawer.value = true
}

const runAIAnalysis = async () => {
  const seedWord = aiPromptInput.value.trim()
  if (!seedWord) {
    aiPromptError.value = '请输入种子词'
    return
  }
  aiPromptError.value = ''
  aiDrawerLoading.value = true
  aiRecommendList.value = []

  const systemPrompt = `你是一名专注于中国高校舆情监控的语言学专家，擅长识别大学生在网络监管压力下使用的隐语、黑话和变体表达。
你的任务是：给定一个"种子词"，从以下维度分析当代大学生如何规避监管来表达该概念：
1. 形态变异：拼音缩写、谐音字、数字替代
2. 亚文化嵌入：二次元/游戏梗、网络流行语
3. 情绪隐喻：丧文化表达、委婉说法、场景化描述

请输出 JSON 格式，结构如下：
{
  "words": [
    {
      "text": "变体词汇",
      "risk": "high|medium|low",
      "suggestedCategories": ["关联分类1", "关联分类2"]
    }
  ]
}

风险等级判断标准：
- high：直接指向自伤/暴力/极端行为
- medium：情绪危机信号或群体性事件苗头
- low：负面情绪表达但无直接危险

每次输出 6-10 个词汇，覆盖不同维度。`

  const userPrompt = `种子词：${seedWord}
请分析当代大学生在受到监管压力下，会如何通过隐喻、黑话、谐音等方式来表达"${seedWord}"这个概念。输出 JSON。`

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('AI 返回内容为空')

    const parsed = JSON.parse(content)
    const words: AIRecommendItem[] = (parsed.words || []).map((item: any, idx: number) => ({
      id: `ai-${Date.now()}-${idx}`,
      text: item.text || '',
      risk: (['high', 'medium', 'low'].includes(item.risk) ? item.risk : 'medium') as RiskLevel,
      checked: true,
      suggestedCategories: Array.isArray(item.suggestedCategories) ? item.suggestedCategories : [],
    })).filter((item: AIRecommendItem) => item.text)

    if (words.length === 0) throw new Error('AI 未返回有效词汇')
    aiRecommendList.value = words
    aiPendingCount.value = words.length
  } catch (e: any) {
    ElMessage.error('AI 分析失败: ' + (e.message || '网络错误'))
  } finally {
    aiDrawerLoading.value = false
  }
}

const closeAIDrawer = () => {
  showAIDrawer.value = false
}

const toggleAllAI = (checked: boolean) => {
  aiRecommendList.value.forEach(item => { item.checked = checked })
}

const handleSelectAll = (e: Event) => {
  toggleAllAI((e.target as HTMLInputElement).checked)
}

const allChecked = computed(() =>
  aiRecommendList.value.length > 0 && aiRecommendList.value.every(i => i.checked)
)

const commitAIWords = async () => {
  if (!activePack.value) return
  const toAdd = aiRecommendList.value.filter(i => i.checked)
  if (toAdd.length === 0) return

  // 去重：过滤掉已存在的词汇
  const existingTexts = new Set(activePack.value.words.map(w => w.text.trim()))
  const uniqueToAdd = toAdd.filter(i => !existingTexts.has(i.text.trim()))
  const dupCount = toAdd.length - uniqueToAdd.length

  try {
    if (uniqueToAdd.length > 0) {
      const wordsToAdd = uniqueToAdd.map(item => ({ text: item.text, risk: item.risk }))
      await addWordsToWordPack(activePack.value.id, wordsToAdd)
    }
    // 重新加载确保数据同步
    await loadPacks()
    const updated = wordPacks.value.find(p => p.id === activePack.value?.id)
    if (updated) { activePack.value = updated; displayPack.value = updated }
  } catch (e: any) {
    ElMessage.error('入库失败: ' + (e.message || '网络错误'))
    return
  }

  aiPendingCount.value = 0
  closeAIDrawer()

  // 显示成功 Toast
  const msg = dupCount > 0
    ? `已将 ${uniqueToAdd.length} 个新词汇导入「${activePack.value.name}」，${dupCount} 个重复已跳过`
    : `已将 ${uniqueToAdd.length} 个新词汇成功导入「${activePack.value.name}」词库包`
  commitToastText.value = msg
  showCommitToast.value = true
  if (commitToastTimer) clearTimeout(commitToastTimer)
  commitToastTimer = setTimeout(() => { showCommitToast.value = false }, 3500)
}

const ignoreAllAI = () => {
  aiPendingCount.value = 0
  closeAIDrawer()
}

// ── 词库包管理 ──
const openEditPackModal = (pack: WordPack | null) => {
  if (!pack) return
  editingPack.value = pack
  editPackForm.value = { name: pack.name, description: pack.description }
  showEditPackModal.value = true
  packMenuVisible.value = false
}

const saveEditPack = async () => {
  if (!editingPack.value || !editPackForm.value.name.trim()) return
  const trimmedName = editPackForm.value.name.trim()
  // 名称去重（排除自身）
  const duplicate = wordPacks.value.find(p => p.id !== editingPack.value!.id && p.name.trim() === trimmedName)
  if (duplicate) {
    ElMessage.warning(`词库包「${trimmedName}」已存在，请换一个名称`)
    return
  }
  try {
    const res = await apiUpdateWordPack(editingPack.value.id, {
      name: trimmedName,
      description: editPackForm.value.description.trim() || '暂无描述',
    })
    if (res.code === 200 && res.data) {
      const idx = wordPacks.value.findIndex(p => p.id === editingPack.value!.id)
      if (idx !== -1) {
        wordPacks.value[idx] = {
          ...wordPacks.value[idx],
          name: res.data.name,
          description: res.data.description || '',
        }
        if (activePack.value?.id === editingPack.value.id) {
          activePack.value = wordPacks.value[idx]
          displayPack.value = wordPacks.value[idx]
        }
      }
      ElMessage.success('词库包已更新')
    }
  } catch (e: any) {
    ElMessage.error('更新失败: ' + (e.message || '网络错误'))
  }
  showEditPackModal.value = false
  editingPack.value = null
}

const confirmDeletePack = async (pack: WordPack | null) => {
  if (!pack) return
  packMenuVisible.value = false
  try {
    await apiDeleteWordPack(pack.id)
    wordPacks.value = wordPacks.value.filter(p => p.id !== pack.id)
    if (activePack.value?.id === pack.id) {
      activePack.value = wordPacks.value[0] ?? null
      displayPack.value = wordPacks.value[0] ?? null
    }
    ElMessage.success('词库包已删除')
  } catch (e: any) {
    ElMessage.error('删除失败: ' + (e.message || '网络错误'))
  }
}

const openPackMenu = (e: MouseEvent, pack: WordPack) => {
  e.stopPropagation()
  packMenuTarget.value = pack
  packMenuPos.value = { x: e.clientX, y: e.clientY }
  packMenuVisible.value = true
}

const closePackMenu = () => {
  packMenuVisible.value = false
}

const openMergeModal = (pack: WordPack | null) => {
  if (!pack) return
  mergingPack.value = pack
  mergeTargetId.value = null
  showMergeModal.value = true
  packMenuVisible.value = false
}

const confirmMerge = async () => {
  if (!mergingPack.value || !mergeTargetId.value) return
  const sourcePack = mergingPack.value
  const targetPack = wordPacks.value.find(p => p.id === mergeTargetId.value)
  if (!targetPack) return

  // 去重：只添加目标包中不存在的词汇
  const existingTexts = new Set(targetPack.words.map(w => w.text.trim()))
  const wordsToAdd = sourcePack.words
    .filter(w => !existingTexts.has(w.text.trim()))
    .map(w => ({ text: w.text, risk: w.risk }))

  try {
    if (wordsToAdd.length > 0) {
      await addWordsToWordPack(targetPack.id, wordsToAdd)
    }
    await apiDeleteWordPack(sourcePack.id)
    await loadPacks()
    // 切换到目标包
    const updated = wordPacks.value.find(p => p.id === targetPack.id)
    if (updated) { activePack.value = updated; displayPack.value = updated }
    ElMessage.success(`已将「${sourcePack.name}」合并到「${targetPack.name}」，新增 ${wordsToAdd.length} 个词汇`)
  } catch (e: any) {
    ElMessage.error('合并失败: ' + (e.message || '网络错误'))
  }
  showMergeModal.value = false
  mergingPack.value = null
  mergeTargetId.value = null
}
</script>

<style lang="scss" scoped>
// ===== 设计令牌（与平台 MainLayout 保持一致）=====
// 平台主色：$purple: #4b70e2，渐变搭档：#7c9df7
// 新拟态底色：$neu-1: #ecf0f3，$neu-2: #d1d9e6
$blue: #4b70e2;
$blue-light: rgba(75, 112, 226, 0.07);
$blue-mid: rgba(75, 112, 226, 0.14);
$border: rgba(0, 0, 0, 0.055);
$text-primary: #181818;
$text-secondary: #64748b;
$text-muted: #a0a5a8;
$radius: 12px;

// ===== 整体布局 =====
// 根容器：透明，让 MainLayout 的全局底色 #ebf0f2 完全透出
// 左侧轻盈导航 + 右侧悬浮工作卡片，两者之间 18px 空气间隙
.risk-word-library {
  display: flex;
  flex: 1;
  height: 100%;
  min-height: 0;
  background: transparent;
  overflow: hidden;
  padding: 0;
  gap: 18px; // 左右之间的空气间隙
  box-sizing: border-box;
  align-items: stretch;
  border-radius: 16px;
}

// ===== 左侧词库包导航栏 — 轻盈透明，飘在背景上 =====
// 参考"记录中心"文件夹树样式：无实色底，无分隔线
.pack-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  // 新拟态风格：与平台侧边栏保持一致
  background: rgba(236, 240, 243, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  // 新拟态投影：凸起感
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    4px 4px 10px rgba(209, 217, 230, 0.8),
    -4px -4px 10px rgba(255, 255, 255, 0.9);
}

.sidebar-search {
  position: relative;
  padding: 20px 12px 8px; // 与 workspace-header 的 padding-top: 20px 对齐
  flex-shrink: 0;

  .search-icon {
    position: absolute;
    left: 24px;
    top: calc(20px + 16px); // padding-top(20px) + input高度一半(32px/2)
    transform: translateY(-50%);
    width: 13px;
    height: 13px;
    color: $text-muted;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    height: 32px;
    padding: 0 28px 0 32px;
    border-radius: 8px;
    // 新拟态内凹输入框
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: #edf0f3;
    font-size: 12.5px;
    color: $text-primary;
    outline: none;
    box-shadow: inset 1px 1px 3px rgba(163, 177, 198, 0.35), inset -1px -1px 3px rgba(255, 255, 255, 0.95);
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;

    &::placeholder { color: $text-muted; }
    &:focus {
      border-color: rgba($blue, 0.4);
      box-shadow: inset 2px 2px 4px rgba(209, 217, 230, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.8), 0 0 0 3px rgba($blue, 0.1);
      background: #e8ecef;
    }
  }


  .search-clear {
    position: absolute;
    right: 20px;
    top: calc(20px + 16px); // padding-top(20px) + input高度一半(32px/2)
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    color: $text-muted;
    padding: 0;
    svg { width: 11px; height: 11px; }
    &:hover { color: $text-secondary; }
  }
}

.pack-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }
}

.pack-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 2px;
  position: relative;
  transition: background 0.18s ease, box-shadow 0.18s ease;
  // 左侧指示线
  border-left: 3px solid transparent;

  .pack-icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: rgba(0,0,0,0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.18s;
    svg {
      width: 14px;
      height: 14px;
      color: $text-muted;
      transition: color 0.18s;
    }
  }

  .pack-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .pack-name {
    font-size: 13px;
    font-weight: 400;
    color: $text-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.18s;
  }

  .pack-meta {
    font-size: 11px;
    color: $text-muted;
    transition: color 0.18s;
  }

  .pack-risk-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    &.risk-high { background: #ef4444; }
    &.risk-medium { background: #f97316; }
    &.risk-low { background: #16a34a; }
  }

  &:hover {
    background: rgba(75, 112, 226, 0.06);
    border-radius: 10px;
    .pack-icon { background: linear-gradient(135deg, rgba(75, 112, 226, 0.12) 0%, rgba(124, 157, 247, 0.12) 100%); svg { color: $blue; } }
    .pack-name { color: $blue; }
  }

  // 胶囊浮动感选中态：白底 + 极轻投影，从背景中"浮出来"
  &.is-active {
    background: #ffffff;
    border-left-color: transparent; // 去掉左侧指示线，改用整体浮起
    border-left-width: 3px;
    // 关键：微弱投影产生视觉差，像从背景中浮出来
    box-shadow:
      0 2px 8px rgba(75, 112, 226, 0.12),
      0 1px 3px rgba(0, 0, 0, 0.06),
      inset 0 0 0 1px rgba(75, 112, 226, 0.12);
    .pack-icon { background: linear-gradient(135deg, rgba(75, 112, 226, 0.12) 0%, rgba(124, 157, 247, 0.12) 100%); svg { color: $blue; } }
    .pack-name { color: $blue; font-weight: 600; }
    .pack-meta { color: rgba($blue, 0.65); }
  }
}

// 侧边栏骨架屏
.pack-skeleton {
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pack-skeleton-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 10px;
}

.pack-sk-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  flex-shrink: 0;
  background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.pack-sk-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pack-sk-line {
  height: 9px;
  border-radius: 5px;
  background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  &.long { width: 70%; }
  &.short { width: 40%; }
}

.pack-empty-search {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: $text-muted;
  svg { width: 28px; height: 28px; opacity: 0.4; }
  span { font-size: 13px; }
}

.sidebar-footer {
  padding: 8px 12px 14px;
  flex-shrink: 0;
  border-top: 1px solid rgba(0,0,0,0.05);
}

.new-pack-btn {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1.5px dashed rgba(75, 112, 226, 0.28);
  border-radius: 8px;
  background: transparent;
  color: rgba($blue, 0.65);
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.2s;
  svg { width: 13px; height: 13px; }

  &:hover {
    border-color: $blue;
    color: $blue;
    background: rgba($blue, 0.05);
  }
}

// ===== 右侧工作区 — 独立悬浮白卡片 =====
// bg-white + rounded-2xl + shadow-sm，与左侧轻盈导航形成视觉层级
.workspace {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  // 新拟态白卡片：与平台 dropdown-menu-inner 风格一致
  background: #f9f9f9;
  border-radius: 20px;
  box-shadow:
    6px 6px 18px rgba(209, 217, 230, 0.85),
    -6px -6px 18px rgba(255, 255, 255, 1),
    0 4px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.workspace-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative; // 为子元素绝对定位提供上下文
}

// workspace-body：filter-bar + 词汇矩阵的容器，用于 fade-in-up 动画
.workspace-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative; // 为离场动画 position:absolute 提供定位上下文
}

// 顶部信息看板 — 对齐记录中心 Header 结构
.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  // padding-left 与 filter-bar、word-matrix 保持垂直对齐
  padding: 20px 24px 16px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(209, 217, 230, 0.5);
  gap: 16px;
}

.header-left {
  min-width: 0;
  flex: 1;
}

.pack-title-block {
  .pack-title {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 4px;
    letter-spacing: -0.3px;
  }
  .pack-desc {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  height: 38px;
}

// AI 智能扩写按钮 — 渐变流光核心焦点（高度对齐记录中心 ctrl-btn: 38px）
.btn-ai-discover {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  // 平台渐变主色：与 Logo、激活态保持一致
  background: linear-gradient(135deg, $blue 0%, #7c9df7 100%);
  border: none;
  box-shadow:
    4px 4px 10px rgba(75, 112, 226, 0.3),
    -2px -2px 6px rgba(255, 255, 255, 0.6),
    0 4px 14px rgba(75, 112, 226, 0.25);
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: box-shadow 0.22s, transform 0.15s;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
    transform: translateX(-100%);
    animation: shimmer 2.8s ease-in-out infinite;
    pointer-events: none;
  }

  .ai-sparkle-icon { font-size: 13px; position: relative; z-index: 1; }
  span { position: relative; z-index: 1; }

  .ai-badge {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
    font-size: 10.5px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    position: relative;
    z-index: 1;
  }

  &:hover {
    box-shadow:
      4px 4px 12px rgba(75, 112, 226, 0.4),
      -2px -2px 6px rgba(255, 255, 255, 0.6),
      0 6px 20px rgba(75, 112, 226, 0.35);
    transform: translateY(-1px);
  }
  &:active { transform: translateY(0); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  60%, 100% { transform: translateX(200%); }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

// 手动添加 — 降权为幽灵按钮（高度对齐记录中心 ctrl-btn: 38px）
.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  // 新拟态凸起风格
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: #ecf0f3;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 3px 3px 6px rgba(209, 217, 230, 0.8), -3px -3px 6px rgba(255, 255, 255, 0.9);
  transition: box-shadow 0.2s, color 0.2s, transform 0.15s;
  svg { width: 13px; height: 13px; }

  &:hover {
    box-shadow: 2px 2px 4px rgba(209, 217, 230, 0.7), -2px -2px 4px rgba(255, 255, 255, 0.8);
    color: $text-primary;
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
    box-shadow: inset 2px 2px 4px rgba(209, 217, 230, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  }
  &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

}

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  border-radius: 10px;
  // 新拟态内凹风格（取消/次要按钮）
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: #ecf0f3;
  color: $text-secondary;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 2px 2px 5px rgba(209, 217, 230, 0.7), -2px -2px 5px rgba(255, 255, 255, 0.8);
  transition: box-shadow 0.2s, color 0.2s;
  &:hover {
    box-shadow: 1px 1px 3px rgba(209, 217, 230, 0.6), -1px -1px 3px rgba(255, 255, 255, 0.7);
    color: $text-primary;
  }
  &:active {
    box-shadow: inset 2px 2px 4px rgba(209, 217, 230, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  }

}

// 筛选 Pill Bar
.filter-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(209, 217, 230, 0.5);
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid $border;
  background: transparent;
  color: $text-secondary;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.2s;

  .pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    &.dot-high { background: #ef4444; }
    &.dot-medium { background: #f97316; }
    &.dot-low { background: #16a34a; }
  }

  .pill-count {
    font-size: 11px;
    color: $text-muted;
    margin-left: 2px;
  }

  &:hover { background: rgba(0,0,0,0.04); color: $text-primary; }

  &.is-active {
    border-color: transparent;
    font-weight: 600;
    .pill-count { color: inherit; opacity: 0.7; }

    &.pill-all { background: rgba(75,112,226,0.1); color: $blue; }
    &.pill-high { background: rgba(239,68,68,0.1); color: #dc2626; }
    &.pill-medium { background: rgba(249,115,22,0.1); color: #ea580c; }
    &.pill-low { background: rgba(22,163,74,0.1); color: #16a34a; }
  }
}
// ===== 词汇矩阵 =====
.word-matrix {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }
}

.word-tags-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
  position: relative; // 为 leave 时的 position:absolute 提供定位上下文
}

.word-tag {
  display: inline-flex;
  align-items: center;
  // 瘦身：更紧凑的 padding
  height: 26px;
  padding: 0 10px;
  border-radius: 7px;
  border: none;
  // text-sm
  font-size: 12.5px;
  font-weight: 500;
  cursor: default;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  max-width: 180px;
  white-space: nowrap;
  position: relative;

  .tag-text {
    flex-shrink: 0;
    transition: margin-right 0.22s ease;
  }

  .tag-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-width 0.22s ease, opacity 0.18s ease, margin-left 0.22s ease;
    margin-left: 0;
  }

  .tag-action-btn {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: rgba(255,255,255,0.55);
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s;
    flex-shrink: 0;
    svg { width: 10px; height: 10px; }
  }

  &.is-hovered {
    .tag-actions {
      max-width: 44px;
      opacity: 1;
      margin-left: 5px;
    }
  }

  // 高风险 — bg-red-50 text-red-600，无边框
  &.tag-high {
    background: #fef2f2;
    color: #dc2626;
    .edit-btn { color: #dc2626; &:hover { background: rgba(239,68,68,0.14); } }
    .delete-btn { color: #dc2626; &:hover { background: rgba(239,68,68,0.14); } }
    &.is-hovered { background: #fee2e2; box-shadow: 0 2px 6px rgba(239,68,68,0.12); }
  }

  // 中风险 — bg-orange-50 text-orange-600
  &.tag-medium {
    background: #fff7ed;
    color: #ea580c;
    .edit-btn { color: #ea580c; &:hover { background: rgba(249,115,22,0.14); } }
    .delete-btn { color: #ea580c; &:hover { background: rgba(249,115,22,0.14); } }
    &.is-hovered { background: #ffedd5; box-shadow: 0 2px 6px rgba(249,115,22,0.12); }
  }

  // 低风险 — bg-blue-50 text-blue-600
  &.tag-low {
    background: #f0fdf4;
    color: #16a34a;
    .edit-btn { color: #16a34a; &:hover { background: rgba(22,163,74,0.12); } }
    .delete-btn { color: #16a34a; &:hover { background: rgba(22,163,74,0.12); } }
    &.is-hovered { background: #dcfce7; box-shadow: 0 2px 6px rgba(22,163,74,0.1); }
  }
}

// ===== 空状态 =====
.empty-state-full {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  gap: 12px;
}

.empty-state-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  gap: 10px;
}

.empty-illustration {
  margin-bottom: 8px;
  .empty-icon-wrap svg { width: 120px; height: 120px; }
}

.empty-illustration-sm {
  margin-bottom: 4px;
  svg { width: 90px; height: 90px; }
}

.empty-svg { width: 64px; height: 64px; opacity: 0.5; }

.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.empty-title-sm {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  margin: 0;
}

.empty-desc {
  font-size: 13.5px;
  color: $text-secondary;
  text-align: center;
  max-width: 380px;
  line-height: 1.6;
  margin: 0;
}

.empty-desc-sm {
  font-size: 13px;
  color: $text-secondary;
  text-align: center;
  max-width: 300px;
  line-height: 1.6;
  margin: 0;
}

.empty-hint {
  font-size: 13px;
  color: $text-muted;
  margin: 0;
}

.empty-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.empty-actions-sm {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.btn-ai-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eaf0ff 0%, #f0f4ff 100%);
  border: none;
  box-shadow: 0 0 0 1.5px rgba(75, 112, 226, 0.28);
  color: #3a5fd4;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  .ai-sparkle { font-size: 14px; }
  &:hover {
    background: linear-gradient(135deg, #d6e4ff 0%, #e8eeff 100%);
    box-shadow: 0 0 0 1.5px rgba(75, 112, 226, 0.45), 0 4px 14px rgba(75, 112, 226, 0.2);
  }
}

.btn-primary-sm {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 16px;
  border-radius: 9px;
  // 新拟态凸起小按钮
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: #ecf0f3;
  color: $text-secondary;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 3px 3px 7px rgba(163, 177, 198, 0.5), -3px -3px 7px rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
  svg { width: 12px; height: 12px; }
  &:hover {
    color: $blue;
    box-shadow: 2px 2px 5px rgba(163, 177, 198, 0.4), -2px -2px 5px rgba(255, 255, 255, 0.7);
  }
  &:active {
    box-shadow: inset 2px 2px 4px rgba(163, 177, 198, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.8);
  }
}

.btn-ai-sm {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #eaf0ff 0%, #f0f4ff 100%);
  border: none;
  box-shadow: 0 0 0 1.5px rgba(75, 112, 226, 0.25);
  color: #3a5fd4;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: linear-gradient(135deg, #d6e4ff 0%, #e8eeff 100%);
    box-shadow: 0 0 0 1.5px rgba(75, 112, 226, 0.4), 0 3px 10px rgba(75, 112, 226, 0.18);
  }
}
// ===== Modal =====
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 420px;
  // 新拟态底色，与平台 $neu-1 保持一致
  background: #ecf0f3;
  border-radius: 20px;
  box-shadow: 8px 8px 20px rgba(163, 177, 198, 0.6), -8px -8px 20px rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 16px;
  border-bottom: 1px solid rgba(209, 217, 230, 0.6);

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  .modal-close {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    color: $text-muted;
    border-radius: 6px;
    transition: all 0.15s;
    svg { width: 14px; height: 14px; }
    &:hover { background: rgba(0,0,0,0.06); color: $text-primary; }
  }
}

.modal-body {
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12.5px;
    font-weight: 500;
    color: $text-secondary;
  }
}

.form-input {
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  // 新拟态内凹输入框
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: #edf0f3;
  font-size: 13.5px;
  color: $text-primary;
  outline: none;
  box-shadow: inset 1px 1px 3px rgba(163, 177, 198, 0.4), inset -1px -1px 3px rgba(255, 255, 255, 0.95);
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  box-sizing: border-box;

  &::placeholder { color: $text-muted; }
  &:focus {
    border-color: rgba($blue, 0.35);
    box-shadow: inset 1px 1px 3px rgba(163, 177, 198, 0.3), inset -1px -1px 3px rgba(255, 255, 255, 0.9), 0 0 0 3px rgba($blue, 0.1);
    background: #eef1f4;
  }
}



.form-hint {
  font-size: 11.5px;
  color: $text-muted;
  margin: 0;
}

// ===== 分段控制器 (Segmented Control) =====
.risk-segmented {
  display: flex;
  align-items: center;
  // 新拟态内凹容器
  background: #e8ecef;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  box-shadow: inset 1px 1px 3px rgba(163, 177, 198, 0.45), inset -1px -1px 3px rgba(255, 255, 255, 0.9);
}

.seg-option {
  flex: 1;
  height: 28px;
  border-radius: 7px;
  border: none;
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  color: $text-secondary;
  transition: background 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              color 0.18s ease,
              box-shadow 0.22s ease,
              transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover:not(.is-selected) {
    background: rgba(255, 255, 255, 0.5);
    color: $text-primary;
  }

  // 选中态：新拟态凸起 + 对应强调色
  &.is-selected {
    transform: scale(1.02);
  }

  &.seg-high.is-selected {
    background: #ecf0f3;
    color: #dc2626;
    box-shadow: 3px 3px 6px rgba(209, 217, 230, 0.8), -3px -3px 6px rgba(255, 255, 255, 0.9), 0 0 0 0.5px rgba(239, 68, 68, 0.2);
  }
  &.seg-medium.is-selected {
    background: #ecf0f3;
    color: #ea580c;
    box-shadow: 3px 3px 6px rgba(209, 217, 230, 0.8), -3px -3px 6px rgba(255, 255, 255, 0.9), 0 0 0 0.5px rgba(249, 115, 22, 0.2);
  }
  &.seg-low.is-selected {
    background: #ecf0f3;
    color: #16a34a;
    box-shadow: 3px 3px 6px rgba(209, 217, 230, 0.8), -3px -3px 6px rgba(255, 255, 255, 0.9), 0 0 0 0.5px rgba(22, 163, 74, 0.2);
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 22px 18px;
  border-top: 1px solid rgba(209, 217, 230, 0.5);

  // 弹窗内确认按钮：实心蓝，覆盖新拟态阴影
  .btn-primary {
    background: linear-gradient(135deg, $blue 0%, #7c9df7 100%);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 4px 14px rgba(75, 112, 226, 0.35);
    &:hover {
      background: linear-gradient(135deg, #3a5fd4 0%, #6b8be8 100%);
      border-color: transparent;
      color: #fff;
      box-shadow: 0 6px 20px rgba(75, 112, 226, 0.45);
      transform: translateY(-1px);
    }
    &:active { transform: translateY(0); }
    &:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; background: rgba(75, 112, 226, 0.4); }
  }
}

// ===== 入库成功 Toast =====
.ai-commit-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #ecf0f3;
  border-radius: 12px;
  box-shadow: 6px 6px 16px rgba(163, 177, 198, 0.5), -6px -6px 16px rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(75,112,226,0.15);
  z-index: 2100;
  white-space: nowrap;

  .ai-commit-toast-icon { font-size: 16px; flex-shrink: 0; }
  .ai-commit-toast-text { font-size: 13.5px; color: $text-primary; font-weight: 500; }
}

// ===== AI Toast =====
.ai-toast {  position: fixed;
  bottom: 28px;
  right: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #ecf0f3;
  border-radius: 12px;
  box-shadow: 6px 6px 16px rgba(163, 177, 198, 0.5), -6px -6px 16px rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(75,112,226,0.15);
  z-index: 2000;
  min-width: 280px;

  .ai-toast-icon { font-size: 20px; flex-shrink: 0; }

  .ai-toast-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    strong { font-size: 13.5px; color: $text-primary; }
    span { font-size: 12px; color: $text-secondary; }
  }

  .ai-toast-close {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    color: $text-muted;
    border-radius: 5px;
    padding: 0;
    svg { width: 12px; height: 12px; }
    &:hover { background: rgba(0,0,0,0.06); color: $text-primary; }
  }
}

// ===== 合并词库包 Modal =====
.merge-desc {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.6;
  margin: 0 0 4px;
  strong { color: $text-primary; }
}

.merge-target-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }
}

.merge-target-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid rgba(0,0,0,0.07);
  cursor: pointer;
  transition: all 0.18s;

  &:hover { border-color: rgba($blue, 0.3); background: rgba($blue, 0.04); }
  &.is-selected {
    border-color: rgba($blue, 0.45);
    background: rgba($blue, 0.07);
    box-shadow: 0 0 0 3px rgba($blue, 0.08);
  }
}

.merge-target-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 14px; height: 14px; color: $text-muted; }
}

.merge-target-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.merge-target-name {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
}

.merge-target-count {
  font-size: 11px;
  color: $text-muted;
}

.merge-target-check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: $blue;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { width: 10px; height: 10px; color: #fff; }
}

.merge-no-target {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: $text-muted;
}

.btn-danger-confirm {
  background: $blue !important;
}

// ===== 搜索高亮 =====
:deep(.search-highlight) {
  background: rgba(75, 112, 226, 0.25);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
  font-style: normal;
}

// ===== Transitions =====
.pack-list-enter-active,
.pack-list-leave-active { transition: all 0.2s ease; }
.pack-list-enter-from { opacity: 0; transform: translateX(-8px); }
.pack-list-leave-to { opacity: 0; transform: translateX(-8px); }

.word-tag-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.word-tag-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  position: absolute; // 脱离文档流，不挤占其他 tag 的位置
  pointer-events: none;
}
.word-tag-enter-from { opacity: 0; transform: scale(0.85); }
.word-tag-leave-to { opacity: 0; transform: scale(0.85); }

.empty-fade-enter-active,
.empty-fade-leave-active { transition: opacity 0.2s ease; }
.empty-fade-enter-from { opacity: 0; }
.empty-fade-leave-to { opacity: 0; }

.title-slide-enter-active,
.title-slide-leave-active { transition: all 0.2s ease; }
.title-slide-enter-from { opacity: 0; transform: translateY(6px); }
.title-slide-leave-to { opacity: 0; transform: translateY(-6px); }

// pack-switch：标题切换动画，纯淡入淡出无位移
.pack-switch-enter-active { transition: opacity 0.18s ease; }
.pack-switch-leave-active { transition: opacity 0.12s ease; }
.pack-switch-enter-from { opacity: 0; }
.pack-switch-leave-to { opacity: 0; }

// workspace-fade 已移除，不再使用

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; .modal-card { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1); } }
.modal-fade-enter-from { opacity: 0; .modal-card { transform: scale(0.94) translateY(8px); } }
.modal-fade-leave-to { opacity: 0; .modal-card { transform: scale(0.96) translateY(4px); } }

// ===== AI 发现抽屉 =====
.ai-drawer-portal {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1100;

  > * { pointer-events: auto; }
}

.ai-drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.12);
  z-index: 0;
  /* 去掉 backdrop-filter，确保背景侧边栏高亮选中项完全可见 */
}

.ai-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.1), -2px 0 8px rgba(0, 0, 0, 0.05);
  border-left: 1px solid rgba(255, 255, 255, 0.7);
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Header
.ai-drawer-header {
  padding: 24px 22px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(235, 240, 250, 0.7) 0%, transparent 100%);
}

.ai-drawer-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ai-drawer-title {
  font-size: 16px;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: -0.2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-drawer-count {
  font-size: 14px;
  font-weight: 600;
  color: $blue;
}

.ai-drawer-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  color: $text-muted;
  border-radius: 7px;
  transition: all 0.15s;
  svg { width: 14px; height: 14px; }
  &:hover { background: rgba(0, 0, 0, 0.07); color: $text-primary; }
}

.ai-drawer-desc {
  font-size: 12.5px;
  color: $text-secondary;
  line-height: 1.6;
  margin: 0;
}

// 目标容器提示行
.ai-drawer-target {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  font-size: 11.5px;
  color: $text-muted;

  .ai-target-icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    color: rgba($blue, 0.6);
  }

  strong {
    color: $blue;
    font-weight: 600;
  }
}

// 抽屉标题图标
.ai-drawer-title-icon {
  width: 15px;
  height: 15px;
  color: $blue;
  flex-shrink: 0;
}

// 建议分类标识
.ai-suggested-cats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}

.ai-suggested-label {
  font-size: 11px;
  color: $text-muted;
  flex-shrink: 0;
}

.ai-cat-tag {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(75, 112, 226, 0.08);
  color: rgba($blue, 0.85);
  border: 1px solid rgba(75, 112, 226, 0.15);
}

// Loading 状态
.ai-drawer-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 22px 0;
  gap: 16px;
}

.ai-loading-pulse {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $blue;
  animation: pulse-bounce 1.2s ease-in-out infinite;

  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes pulse-bounce {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.ai-loading-text {
  font-size: 13px;
  color: $text-secondary;
}

.ai-skeleton-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ai-skeleton-card {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 10px;
  border-radius: 5px;
  background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;

  &.short { width: 30%; }
  &.medium { width: 55%; }
  &.long { width: 90%; }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// 推荐列表区
.ai-drawer-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px 22px 0;
  display: flex;
  flex-direction: column;
  gap: 0;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }
}

// 全选行
.ai-select-all-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.ai-select-all-text {
  font-size: 12.5px;
  font-weight: 500;
  color: $text-secondary;
}

.ai-select-hint {
  font-size: 11.5px;
  color: $text-muted;
}

// 自定义 Checkbox
.ai-checkbox-label {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;

  .ai-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .ai-checkbox-custom {
    width: 16px;
    height: 16px;
    border-radius: 5px;
    border: 1.5px solid rgba(0, 0, 0, 0.18);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;

    &::after {
      content: '';
      width: 9px;
      height: 5px;
      border-left: 2px solid #fff;
      border-bottom: 2px solid #fff;
      transform: rotate(-45deg) scale(0);
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      margin-top: -2px;
    }
  }

  .ai-checkbox:checked + .ai-checkbox-custom {
    background: $blue;
    border-color: $blue;
    box-shadow: 0 2px 6px rgba(75, 112, 226, 0.35);
    &::after { transform: rotate(-45deg) scale(1); }
  }
}

// 推荐卡片
.ai-card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-recommend-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 14px 14px 12px;
  border-radius: 12px;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  background: rgba(249, 249, 249, 0.9);
  transition: all 0.22s ease;
  cursor: default;

  .card-checkbox {
    margin-top: 1px;
    flex-shrink: 0;
  }

  &.is-checked {
    border-color: rgba(75, 112, 226, 0.2);
    background: rgba(238, 242, 255, 0.5);
    box-shadow: 0 2px 8px rgba(75, 112, 226, 0.07);
  }

  &:not(.is-checked) {
    opacity: 0.55;
  }
}

.ai-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-word-text {
  font-size: 15px;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: 0.2px;
}

// 风险 Tag — 严格遵循现有颜色规范
.ai-risk-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;

  &.risk-tag-high {
    background: #fef2f2;
    color: #dc2626;
  }
  &.risk-tag-medium {
    background: #fff7ed;
    color: #ea580c;
  }
  &.risk-tag-low {
    background: #f0fdf4;
    color: #16a34a;
  }
}

// 底部操作区
.ai-drawer-footer {
  padding: 14px 22px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  background: rgba(236, 240, 243, 0.9);
}

.btn-ai-commit {
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #4b70e2 0%, #3a5fd4 100%);
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(75, 112, 226, 0.35);
  svg { width: 15px; height: 15px; }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #3a5fd4 0%, #2d4fc0 100%);
    box-shadow: 0 6px 20px rgba(75, 112, 226, 0.45);
    transform: translateY(-1px);
  }
  &:active:not(:disabled) { transform: translateY(0); }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.btn-ai-ignore {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: transparent;
  color: $text-secondary;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: $text-primary;
    border-color: rgba(0, 0, 0, 0.16);
  }
}

// ===== 骨架屏 =====
.skeleton-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  gap: 16px;
  overflow: hidden;
}

.skeleton-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(209, 217, 230, 0.5);
}

.skeleton-filter-bar {
  display: flex;
  gap: 6px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(209, 217, 230, 0.5);
}

.skeleton-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skeleton-block {
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.06) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;

  &.title-block { width: 160px; height: 28px; border-radius: 6px; }
  &.btn-block { width: 120px; height: 36px; border-radius: 10px; }
  &.pill-block { width: 64px; height: 28px; border-radius: 14px; }
  &.tag-block { height: 26px; border-radius: 7px; }
}

// ===== 词库包更多操作按钮 =====
.pack-more-btn {
  width: 20px;
  height: 20px;
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  color: $text-muted;
  border-radius: 5px;
  padding: 0;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
  svg { width: 12px; height: 12px; }
  &:hover { background: rgba(0,0,0,0.08); color: $text-secondary; }
}

.pack-item:hover .pack-more-btn,
.pack-item.is-active .pack-more-btn {
  display: flex;
}

// 当 more-btn 显示时，隐藏 risk-dot 避免挤压
.pack-item:hover .pack-risk-dot,
.pack-item.is-active .pack-risk-dot {
  display: none;
}

// ===== 右键菜单 =====
.pack-context-menu {
  position: fixed;
  z-index: 3000;
  background: #ecf0f3;
  border-radius: 10px;
  box-shadow: 6px 6px 16px rgba(163, 177, 198, 0.55), -6px -6px 16px rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0,0,0,0.07);
  padding: 4px;
  min-width: 140px;
  transform: translateX(-100%); // 菜单出现在按钮左侧
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: none;
  background: none;
  border-radius: 7px;
  font-size: 13px;
  color: $text-primary;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
  svg { width: 13px; height: 13px; flex-shrink: 0; color: $text-secondary; }
  &:hover { background: rgba(0,0,0,0.05); }
  &.menu-item-danger {
    color: #dc2626;
    svg { color: #dc2626; }
    &:hover { background: rgba(239,68,68,0.07); }
  }
}

.menu-divider {
  height: 1px;
  background: rgba(0,0,0,0.06);
  margin: 3px 6px;
}

// 菜单弹出动画
.menu-pop-enter-active { transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); }
.menu-pop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.menu-pop-enter-from { opacity: 0; transform: translateX(-100%) scale(0.95); }
.menu-pop-leave-to { opacity: 0; transform: translateX(-100%) scale(0.97); }

// ===== 排序栏 =====
.sidebar-sort-bar {
  padding: 0 12px 8px;
  flex-shrink: 0;
}

.sort-bar-inner {
  display: flex;
  align-items: center;
  gap: 4px;
}

// 左侧：排序字段选择按钮
.sort-field-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.sort-field-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 26px;
  padding: 0 8px;
  border: none;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  color: $text-muted;
  font-size: 11.5px;
  transition: background 0.18s, color 0.18s;

  .sort-icon { width: 12px; height: 12px; flex-shrink: 0; }
  .sort-label { flex: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sort-chevron {
    width: 11px;
    height: 11px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
    &.is-open { transform: rotate(180deg); }
  }

  &:hover {
    background: rgba(0,0,0,0.05);
    color: $text-secondary;
  }
}

// 下拉菜单
.sort-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 140px;
  background: #ecf0f3;
  border-radius: 10px;
  box-shadow: 6px 6px 16px rgba(163, 177, 198, 0.55), -6px -6px 16px rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0,0,0,0.07);
  padding: 4px;
  z-index: 500;
}

.sort-drop-item {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 30px;
  padding: 0 9px;
  border: none;
  background: none;
  border-radius: 7px;
  font-size: 12.5px;
  color: $text-primary;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;

  svg { width: 13px; height: 13px; flex-shrink: 0; color: $text-secondary; }

  .drop-check {
    margin-left: auto;
    width: 12px;
    height: 12px;
    color: $blue;
  }

  &:hover { background: rgba(0,0,0,0.05); }
  &.is-active { color: $blue; svg:first-child { color: $blue; } }
}

// 右侧：升降序切换按钮
.sort-order-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  color: $text-muted;
  flex-shrink: 0;
  transition: background 0.18s, color 0.18s;

  .order-icon { width: 14px; height: 14px; }

  &:hover {
    background: rgba(0,0,0,0.05);
    color: $text-secondary;
  }
}

// 下拉动画
.sort-drop-enter-active { transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); }
.sort-drop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.sort-drop-enter-from { opacity: 0; transform: translateY(-4px) scale(0.97); }
.sort-drop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.97); }

// ===== 导出按钮 =====
.btn-export {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  // 新拟态凸起风格
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: #ecf0f3;
  color: $text-secondary;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 3px 3px 6px rgba(209, 217, 230, 0.8), -3px -3px 6px rgba(255, 255, 255, 0.9);
  transition: box-shadow 0.2s, color 0.2s, transform 0.15s;
  svg { width: 13px; height: 13px; }

  &:hover {
    box-shadow: 2px 2px 4px rgba(209, 217, 230, 0.7), -2px -2px 4px rgba(255, 255, 255, 0.8);
    color: $blue;
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
    box-shadow: inset 2px 2px 4px rgba(209, 217, 230, 0.6), inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  }

}

// ===== 导入区域（新建词库包 Modal 内）=====
.import-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  color: $text-muted;
  font-size: 11.5px;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(0,0,0,0.07);
  }
}

.import-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 16px;
  border: 1.5px dashed rgba(75, 112, 226, 0.25);
  border-radius: 10px;
  background: rgba(75, 112, 226, 0.03);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(75, 112, 226, 0.5);
    background: rgba(75, 112, 226, 0.06);
  }

  .import-zone-icon {
    width: 22px;
    height: 22px;
    color: rgba($blue, 0.5);
  }

  .import-zone-text {
    font-size: 12px;
    color: $text-muted;
    text-align: center;
    line-height: 1.5;

    code {
      font-family: monospace;
      background: rgba(75, 112, 226, 0.1);
      color: $blue;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 11px;
    }
  }
}

// ===== AI 提示词输入区 =====
.ai-prompt-area {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-prompt-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 500;
  color: $text-secondary;
}

.ai-prompt-label-icon {
  width: 12px;
  height: 12px;
  color: rgba($blue, 0.6);
  flex-shrink: 0;
}

.ai-prompt-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-prompt-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border-radius: 9px;
  // 新拟态内凹输入框
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: #edf0f3;
  font-size: 13.5px;
  color: $text-primary;
  outline: none;
  box-shadow: inset 1px 1px 3px rgba(163, 177, 198, 0.4), inset -1px -1px 3px rgba(255, 255, 255, 0.95);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &::placeholder { color: $text-muted; }
  &:focus {
    border-color: rgba($blue, 0.4);
    box-shadow: inset 2px 2px 5px rgba(209, 217, 230, 0.6), inset -2px -2px 5px rgba(255, 255, 255, 0.8), 0 0 0 3px rgba($blue, 0.1);
    background: #e8ecef;
  }
  &.has-error {
    border-color: rgba(239, 68, 68, 0.5);
    box-shadow: inset 2px 2px 5px rgba(209, 217, 230, 0.6), inset -2px -2px 5px rgba(255, 255, 255, 0.8), 0 0 0 3px rgba(239, 68, 68, 0.08);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

}

.ai-prompt-run-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9px;
  background: linear-gradient(135deg, #4b70e2 0%, #3a5fd4 100%);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(75, 112, 226, 0.35);
  svg { width: 13px; height: 13px; }

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #3a5fd4 0%, #2d4fc0 100%);
    box-shadow: 0 4px 14px rgba(75, 112, 226, 0.45);
    transform: translateY(-1px);
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; transform: none; }
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-prompt-hint {
  font-size: 11px;
  color: $text-muted;
  margin: 0;
  line-height: 1.5;
}

.ai-prompt-error {
  font-size: 11px;
  color: #dc2626;
  margin: 0;
}

// 空状态（未分析时）
.ai-drawer-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 22px;
}

.ai-empty-svg {
  width: 72px;
  height: 72px;
  opacity: 0.7;
}

.ai-empty-hint {
  font-size: 13px;
  color: $text-muted;
  text-align: center;
  margin: 0;
}

// ===== 抽屉动画 =====
.drawer-mask-enter-active,
.drawer-mask-leave-active { transition: opacity 0.28s ease; }
.drawer-mask-enter-from,
.drawer-mask-leave-to { opacity: 0; }

.drawer-slide-enter-active {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
}
.drawer-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.22s ease;
}
.drawer-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.drawer-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

// AI 卡片列表入场动画
.ai-card-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.ai-card-leave-active {
  transition: all 0.2s ease;
}
.ai-card-enter-from {
  opacity: 0;
  transform: translateX(16px) scale(0.97);
}
.ai-card-leave-to {
  opacity: 0;
  transform: translateX(-8px) scale(0.97);
}
</style>

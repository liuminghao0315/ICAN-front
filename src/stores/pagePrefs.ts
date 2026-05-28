import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type AnalysisViewMode = 'interactive' | 'report'
export type RiskWordSortField = 'date' | 'count'
export type RiskWordSortOrder = 'desc' | 'asc'

export type RecordsPrefs = {
  pageSize: 12 | 24 | 48
  activeStatus: string
  sourceFilter: string
  riskFilter: string
  sortOrder: 'newest' | 'oldest' | 'risk_desc'
  activeFolderId: string
}

export type FavoritesPrefs = {
  pageSize: 12 | 24 | 48
  sourceFilter: string
  riskFilter: string
  sortOrder: 'gmtCreated,desc' | 'gmtCreated,asc' | 'riskLevel,desc'
}

export type AnalysisPrefs = {
  viewMode: AnalysisViewMode
}

export type RiskWordLibraryPrefs = {
  sortField: RiskWordSortField
  sortOrder: RiskWordSortOrder
  activePackId: string
}

export type PagePrefsState = {
  records: RecordsPrefs
  favorites: FavoritesPrefs
  analysis: AnalysisPrefs
  analysisShare: AnalysisPrefs
  riskWordLibrary: RiskWordLibraryPrefs
}

type PersistedPagePrefsPayload = {
  state: PagePrefsState
}

const RECORDS_PAGE_SIZES = [12, 24, 48] as const
const FAVORITES_PAGE_SIZES = [12, 24, 48] as const
const ANALYSIS_VIEW_MODES = ['interactive', 'report'] as const
const RISK_WORD_SORT_FIELDS = ['date', 'count'] as const
const RISK_WORD_SORT_ORDERS = ['desc', 'asc'] as const
const RECORD_SORT_ORDERS = ['newest', 'oldest', 'risk_desc'] as const
const FAVORITES_SORT_ORDERS = ['gmtCreated,desc', 'gmtCreated,asc', 'riskLevel,desc'] as const

const DEFAULT_PAGE_PREFS: PagePrefsState = {
  records: {
    pageSize: 12,
    activeStatus: '',
    sourceFilter: '',
    riskFilter: '',
    sortOrder: 'newest',
    activeFolderId: '__ALL__',
  },
  favorites: {
    pageSize: 12,
    sourceFilter: '',
    riskFilter: '',
    sortOrder: 'gmtCreated,desc',
  },
  analysis: {
    viewMode: 'interactive',
  },
  analysisShare: {
    viewMode: 'interactive',
  },
  riskWordLibrary: {
    sortField: 'date',
    sortOrder: 'desc',
    activePackId: '',
  },
}

export function createDefaultPagePrefs(): PagePrefsState {
  return JSON.parse(JSON.stringify(DEFAULT_PAGE_PREFS)) as PagePrefsState
}

function isOneOf<T extends readonly string[] | readonly number[]>(
  value: unknown,
  candidates: T,
): value is T[number] {
  return (candidates as readonly (string | number)[]).includes(value as string | number)
}

export function normalizePagePrefs(raw: Record<string, unknown> | null | undefined): PagePrefsState {
  const defaults = createDefaultPagePrefs()
  if (!raw || typeof raw !== 'object') return defaults

  const records = (raw.records && typeof raw.records === 'object' ? raw.records : {}) as Record<string, unknown>
  const favorites = (raw.favorites && typeof raw.favorites === 'object' ? raw.favorites : {}) as Record<string, unknown>
  const analysis = (raw.analysis && typeof raw.analysis === 'object' ? raw.analysis : {}) as Record<string, unknown>
  const analysisShare = (raw.analysisShare && typeof raw.analysisShare === 'object' ? raw.analysisShare : {}) as Record<string, unknown>
  const riskWordLibrary = (raw.riskWordLibrary && typeof raw.riskWordLibrary === 'object'
    ? raw.riskWordLibrary
    : {}) as Record<string, unknown>

  return {
    records: {
      pageSize: isOneOf(records.pageSize, RECORDS_PAGE_SIZES) ? records.pageSize : defaults.records.pageSize,
      activeStatus: typeof records.activeStatus === 'string' ? records.activeStatus : defaults.records.activeStatus,
      sourceFilter: typeof records.sourceFilter === 'string' ? records.sourceFilter : defaults.records.sourceFilter,
      riskFilter: typeof records.riskFilter === 'string' ? records.riskFilter : defaults.records.riskFilter,
      sortOrder: isOneOf(records.sortOrder, RECORD_SORT_ORDERS) ? records.sortOrder : defaults.records.sortOrder,
      activeFolderId: typeof records.activeFolderId === 'string' && records.activeFolderId.trim()
        ? records.activeFolderId
        : defaults.records.activeFolderId,
    },
    favorites: {
      pageSize: isOneOf(favorites.pageSize, FAVORITES_PAGE_SIZES) ? favorites.pageSize : defaults.favorites.pageSize,
      sourceFilter: typeof favorites.sourceFilter === 'string' ? favorites.sourceFilter : defaults.favorites.sourceFilter,
      riskFilter: typeof favorites.riskFilter === 'string' ? favorites.riskFilter : defaults.favorites.riskFilter,
      sortOrder: isOneOf(favorites.sortOrder, FAVORITES_SORT_ORDERS) ? favorites.sortOrder : defaults.favorites.sortOrder,
    },
    analysis: {
      viewMode: isOneOf(analysis.viewMode, ANALYSIS_VIEW_MODES) ? analysis.viewMode : defaults.analysis.viewMode,
    },
    analysisShare: {
      viewMode: isOneOf(analysisShare.viewMode, ANALYSIS_VIEW_MODES) ? analysisShare.viewMode : defaults.analysisShare.viewMode,
    },
    riskWordLibrary: {
      sortField: isOneOf(riskWordLibrary.sortField, RISK_WORD_SORT_FIELDS)
        ? riskWordLibrary.sortField
        : defaults.riskWordLibrary.sortField,
      sortOrder: isOneOf(riskWordLibrary.sortOrder, RISK_WORD_SORT_ORDERS)
        ? riskWordLibrary.sortOrder
        : defaults.riskWordLibrary.sortOrder,
      activePackId: typeof riskWordLibrary.activePackId === 'string' ? riskWordLibrary.activePackId : defaults.riskWordLibrary.activePackId,
    },
  }
}

export function normalizePagePrefsPayload(
  raw: Record<string, unknown> | null | undefined,
): PersistedPagePrefsPayload {
  const maybeState = raw && typeof raw === 'object' && raw.state && typeof raw.state === 'object'
    ? raw.state as Record<string, unknown>
    : raw

  return {
    state: normalizePagePrefs(maybeState as Record<string, unknown> | null | undefined),
  }
}

const safeStorage = typeof window !== 'undefined' ? localStorage : undefined

export const usePagePrefsStore = defineStore('pagePrefs', () => {
  const state = ref<PagePrefsState>(createDefaultPagePrefs())

  const records = computed(() => state.value.records)
  const favorites = computed(() => state.value.favorites)
  const analysis = computed(() => state.value.analysis)
  const analysisShare = computed(() => state.value.analysisShare)
  const riskWordLibrary = computed(() => state.value.riskWordLibrary)

  function setRecordsPrefs(patch: Partial<RecordsPrefs>) {
    state.value.records = { ...state.value.records, ...patch }
  }

  function setFavoritesPrefs(patch: Partial<FavoritesPrefs>) {
    state.value.favorites = { ...state.value.favorites, ...patch }
  }

  function setAnalysisPrefs(patch: Partial<AnalysisPrefs>) {
    state.value.analysis = { ...state.value.analysis, ...patch }
  }

  function setAnalysisSharePrefs(patch: Partial<AnalysisPrefs>) {
    state.value.analysisShare = { ...state.value.analysisShare, ...patch }
  }

  function setRiskWordLibraryPrefs(patch: Partial<RiskWordLibraryPrefs>) {
    state.value.riskWordLibrary = { ...state.value.riskWordLibrary, ...patch }
  }

  function init() {
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('page-prefs')
    if (!raw) return
    try {
      state.value = normalizePagePrefsPayload(JSON.parse(raw) as Record<string, unknown>).state
    } catch {
      state.value = createDefaultPagePrefs()
    }
  }

  return {
    state,
    records,
    favorites,
    analysis,
    analysisShare,
    riskWordLibrary,
    init,
    setRecordsPrefs,
    setFavoritesPrefs,
    setAnalysisPrefs,
    setAnalysisSharePrefs,
    setRiskWordLibraryPrefs,
  }
}, {
  persist: {
    key: 'page-prefs',
    storage: safeStorage,
    serializer: {
      serialize: (value) => JSON.stringify(normalizePagePrefsPayload(value as Record<string, unknown>)),
      deserialize: (value) => normalizePagePrefsPayload(JSON.parse(value) as Record<string, unknown>),
    },
    pick: ['state'],
  },
})

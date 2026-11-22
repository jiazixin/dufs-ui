import { computed, onWatcherCleanup, ref, watch } from 'vue'
import { api, logoutRequest } from '../../app/api'
import { openConfirm, openPrompt } from '../../app/dialog'
import { errorText } from '../../app/errors'
import { showToast } from '../../app/toast'
import { ensureTrailingSlash, getBaseUrl, joinRelativeUrl } from '../../lib/url'
import { demoContentStore, loadInitialDufsData, normalizePathItems } from './dufs-data'
import { FILE_ERROR_MESSAGES } from './file-errors'
import { isDirItem } from './file-types'
import type { DufsData, PathItem, SortField, SortOrder, ViewMode } from './types'

const VIEW_STORAGE_KEY = 'dufs_ui_view'

function readQueryParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? ''
}

function parseInitialSort(): { field: SortField; order: SortOrder } {
  const rawSort = readQueryParam('sort')
  const rawOrder = readQueryParam('order')
  const field: SortField =
    rawSort === 'mtime' || rawSort === 'size' || rawSort === 'name' ? rawSort : 'name'
  const order: SortOrder = rawOrder === 'desc' ? 'desc' : 'asc'
  return { field, order }
}

function compareItems(a: PathItem, b: PathItem, field: SortField, order: SortOrder): number {
  const aIsDir = isDirItem(a)
  const bIsDir = isDirItem(b)
  if (aIsDir !== bIsDir) {
    return aIsDir ? -1 : 1
  }

  let diff = 0
  switch (field) {
    case 'mtime':
      diff = a.mtime - b.mtime
      break
    case 'size':
      diff = a.size - b.size
      break
    case 'name':
      diff = a.name.localeCompare(b.name, 'zh-CN', { numeric: true, sensitivity: 'base' })
      break
  }
  return order === 'desc' ? -diff : diff
}

export function useFileBrowser() {
  const initial = loadInitialDufsData()
  const initialSort = parseInitialSort()

  const isDemo = initial.isDemo
  const data = ref<DufsData>(initial.data)
  const paths = ref<PathItem[]>([...initial.data.paths])
  const user = ref<string>(initial.data.user)
  const searchQuery = ref<string>(readQueryParam('q'))
  const sortField = ref<SortField>(initialSort.field)
  const sortOrder = ref<SortOrder>(initialSort.order)
  const viewMode = ref<ViewMode>(
    window.localStorage.getItem(VIEW_STORAGE_KEY) === 'grid' ? 'grid' : 'list',
  )
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  const currentBaseUrl = computed(() => (isDemo ? 'https://drop.example.com/' : getBaseUrl()))

  const visiblePaths = computed<PathItem[]>(() => {
    const q = searchQuery.value.trim().toLowerCase()
    const filtered =
      isDemo && q.length > 0
        ? paths.value.filter((item) => item.name.toLowerCase().includes(q))
        : paths.value
    return [...filtered].sort((a, b) => compareItems(a, b, sortField.value, sortOrder.value))
  })

  const statsSummary = computed(() => {
    const items = visiblePaths.value
    const dirCount = items.filter(isDirItem).length
    const fileCount = items.length - dirCount
    const totalSize = items.reduce((acc, item) => acc + (isDirItem(item) ? 0 : item.size), 0)
    return { total: items.length, dirCount, fileCount, totalSize }
  })

  function getItemUrl(item: PathItem): string {
    const url = joinRelativeUrl(currentBaseUrl.value, item.name)
    return isDirItem(item) ? ensureTrailingSlash(url) : url
  }

  function getRelativeUrl(relativePath: string): string {
    return joinRelativeUrl(currentBaseUrl.value, relativePath)
  }

  function syncUrlQuery(): void {
    if (isDemo) return
    const next = new URLSearchParams(window.location.search)
    if (searchQuery.value.trim()) {
      next.set('q', searchQuery.value.trim())
    } else {
      next.delete('q')
    }
    next.set('sort', sortField.value)
    next.set('order', sortOrder.value)
    const qs = next.toString()
    const nextUrl = qs ? `${getBaseUrl()}?${qs}` : getBaseUrl()
    window.history.replaceState(null, '', nextUrl)
  }

  function setViewMode(mode: ViewMode): void {
    viewMode.value = mode
    window.localStorage.setItem(VIEW_STORAGE_KEY, mode)
  }

  function toggleSort(field: SortField): void {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = field === 'name' ? 'asc' : 'desc'
    }
    syncUrlQuery()
  }

  async function refreshList(signal?: AbortSignal): Promise<void> {
    if (isDemo) return
    isLoading.value = true
    loadError.value = null
    try {
      const qs = new URLSearchParams()
      if (searchQuery.value.trim()) {
        qs.set('q', searchQuery.value.trim())
      }
      qs.set('sort', sortField.value)
      qs.set('order', sortOrder.value)
      qs.set('json', '')
      const result = await api<{
        paths?: unknown
        dir_exists?: boolean
        allow_upload?: boolean
        allow_delete?: boolean
      }>(`${getBaseUrl()}?${qs.toString()}`, { signal })
      const nextAllowUpload =
        typeof result.allow_upload === 'boolean' ? result.allow_upload : data.value.allow_upload
      const nextAllowDelete =
        typeof result.allow_delete === 'boolean' ? result.allow_delete : data.value.allow_delete
      if (Array.isArray(result.paths)) {
        paths.value = normalizePathItems(result.paths, {
          allowUpload: nextAllowUpload,
          allowDelete: nextAllowDelete,
        })
      }
      if (
        typeof result.dir_exists === 'boolean' ||
        typeof result.allow_upload === 'boolean' ||
        typeof result.allow_delete === 'boolean'
      ) {
        data.value = {
          ...data.value,
          dir_exists:
            typeof result.dir_exists === 'boolean' ? result.dir_exists : data.value.dir_exists,
          allow_upload: nextAllowUpload,
          allow_delete: nextAllowDelete,
        }
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      loadError.value = errorText(error, FILE_ERROR_MESSAGES)
    } finally {
      isLoading.value = false
    }
  }

  // Cancel superseded search requests automatically
  let searchTimer: number | null = null
  watch(searchQuery, (value) => {
    syncUrlQuery()
    if (isDemo) return
    const controller = new AbortController()
    onWatcherCleanup(() => {
      controller.abort()
      if (searchTimer !== null) {
        window.clearTimeout(searchTimer)
        searchTimer = null
      }
    })
    searchTimer = window.setTimeout(
      () => {
        void refreshList(controller.signal)
      },
      value.trim() ? 240 : 0,
    )
  })

  async function checkAuth(variant?: 'login'): Promise<void> {
    if (!data.value.auth || isDemo) return
    const qs = variant ? `?${variant}` : ''
    const username = await api<string>(`${getBaseUrl()}${qs}`, {
      method: 'CHECKAUTH',
      responseType: 'text',
    })
    if (username) {
      user.value = username
    }
  }

  async function login(): Promise<void> {
    try {
      await checkAuth('login')
      window.location.reload()
    } catch (error: unknown) {
      showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
    }
  }

  async function logout(): Promise<void> {
    if (!data.value.auth || isDemo) return
    await logoutRequest(getBaseUrl(), user.value)
    window.location.href = getBaseUrl()
  }

  async function createFolder(): Promise<void> {
    const name = await openPrompt({
      title: '新建文件夹',
      placeholder: '输入文件夹名称',
      confirmText: '创建',
    })
    if (!name) return

    if (isDemo) {
      paths.value = [
        {
          path_type: 'Dir',
          name,
          mtime: Date.now(),
          size: 0,
          allow_upload: true,
          allow_delete: true,
        },
        ...paths.value,
      ]
      showToast(`已创建文件夹「${name}」`, 'success')
      return
    }

    try {
      await checkAuth()
      await api<undefined>(getRelativeUrl(name), { method: 'MKCOL', responseType: 'void' })
      await refreshList()
      showToast(`已创建文件夹「${name}」`, 'success')
    } catch (error: unknown) {
      showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
    }
  }

  async function saveTextFile(
    rawName: string,
    content: string,
    options: { checkOverwrite?: boolean } = {},
  ): Promise<boolean> {
    const name = rawName.trim()
    if (!name) return false

    const shouldCheckOverwrite = options.checkOverwrite ?? true

    if (isDemo) {
      const exists = paths.value.some((entry) => entry.name === name)
      if (exists && shouldCheckOverwrite) {
        const confirmed = await openConfirm({
          title: '覆盖确认',
          message: `文件「${name}」已存在，是否覆盖？`,
          confirmText: '覆盖',
          isDanger: true,
        })
        if (!confirmed) return false
      }

      const byteSize = new TextEncoder().encode(content).byteLength
      const now = Date.now()
      if (exists) {
        paths.value = paths.value.map((entry) =>
          entry.name === name ? { ...entry, mtime: now, size: byteSize } : entry,
        )
      } else {
        const created: PathItem = {
          path_type: 'File',
          name,
          mtime: now,
          size: byteSize,
          allow_upload: true,
          allow_delete: true,
        }
        paths.value = [created, ...paths.value]
      }
      demoContentStore.set(name, { text: content })
      showToast(`已保存「${name}」`, 'success')
      return true
    }

    try {
      await checkAuth()
      const url = getRelativeUrl(name)
      if (shouldCheckOverwrite) {
        let exists = false
        try {
          await api<Headers>(url, { method: 'HEAD', responseType: 'headers' })
          exists = true
        } catch {
          exists = false
        }
        if (exists) {
          const confirmed = await openConfirm({
            title: '覆盖确认',
            message: `文件「${name}」已存在，是否覆盖？`,
            confirmText: '覆盖',
            isDanger: true,
          })
          if (!confirmed) return false
        }
      }

      await api<undefined>(url, { method: 'PUT', body: content, responseType: 'void' })
      await refreshList()
      showToast(`已保存「${name}」`, 'success')
      return true
    } catch (error: unknown) {
      showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
      return false
    }
  }

  async function moveItem(item: PathItem): Promise<void> {
    const fileUrl = getRelativeUrl(item.name)
    const urlObj = new URL(fileUrl)
    const prefix = data.value.uri_prefix.slice(0, -1)
    const currentPath = decodeURIComponent(urlObj.pathname.slice(prefix.length))

    const rawNext = await openPrompt({
      title: '重命名 / 移动',
      message: '修改名称或输入目标路径：',
      initialValue: currentPath,
      confirmText: '保存',
    })
    if (!rawNext) return

    const nextPath = rawNext.startsWith('/') ? rawNext : `/${rawNext}`
    if (nextPath === currentPath) return

    if (isDemo) {
      const nextName = nextPath.split('/').filter(Boolean).pop() ?? item.name
      paths.value = paths.value.map((entry) =>
        entry.name === item.name ? { ...entry, name: nextName } : entry,
      )
      showToast('已重命名', 'success')
      return
    }

    const nextUrl = `${urlObj.origin}${prefix}${nextPath.split('/').map(encodeURIComponent).join('/')}`
    try {
      await checkAuth()
      let exists = false
      try {
        await api<Headers>(nextUrl, { method: 'HEAD', responseType: 'headers' })
        exists = true
      } catch {
        exists = false
      }
      if (exists) {
        const confirmed = await openConfirm({
          title: '覆盖确认',
          message: `目标「${nextPath}」已存在，是否覆盖？`,
          confirmText: '覆盖',
          isDanger: true,
        })
        if (!confirmed) return
      }
      await api<undefined>(fileUrl, {
        method: 'MOVE',
        headers: { Destination: nextUrl },
        responseType: 'void',
      })
      await refreshList()
      showToast('移动/重命名成功', 'success')
    } catch (error: unknown) {
      showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
    }
  }

  async function deleteItem(item: PathItem): Promise<void> {
    const confirmed = await openConfirm({
      title: '确认删除',
      message: `确定要永久删除「${item.name}」吗？此操作无法撤销。`,
      confirmText: '删除',
      isDanger: true,
    })
    if (!confirmed) return

    if (isDemo) {
      paths.value = paths.value.filter((entry) => entry.name !== item.name)
      showToast(`已删除「${item.name}」`, 'success')
      return
    }

    try {
      await checkAuth()
      await api<undefined>(getRelativeUrl(item.name), { method: 'DELETE', responseType: 'void' })
      paths.value = paths.value.filter((entry) => entry.name !== item.name)
      showToast(`已删除「${item.name}」`, 'success')
    } catch (error: unknown) {
      showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
    }
  }

  async function generateTokenUrl(rawUrl: string): Promise<string> {
    const tokenReqUrl = new URL(rawUrl, window.location.href)
    tokenReqUrl.searchParams.set('tokengen', '')
    const token = await api<string>(tokenReqUrl.toString(), { responseType: 'text' })
    const finalUrl = new URL(rawUrl, window.location.href)
    finalUrl.searchParams.set('token', token)
    return finalUrl.toString()
  }

  async function triggerDownload(rawUrl: string, filename = ''): Promise<void> {
    try {
      const targetUrl = user.value && !isDemo ? await generateTokenUrl(rawUrl) : rawUrl
      const link = document.createElement('a')
      link.href = targetUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error: unknown) {
      showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
    }
  }

  function addDemoUploadedItem(relPath: string, file: File): void {
    const topName = relPath.split('/')[0] ?? file.name
    const isSubPath = relPath.includes('/')
    if (!paths.value.some((entry) => entry.name === topName)) {
      paths.value = [
        {
          path_type: isSubPath ? 'Dir' : 'File',
          name: topName,
          mtime: Date.now(),
          size: isSubPath ? 1 : file.size,
          allow_upload: true,
          allow_delete: true,
        },
        ...paths.value,
      ]
      if (!isSubPath) {
        demoContentStore.set(topName, { url: URL.createObjectURL(file), file })
      }
    }
  }

  return {
    isDemo,
    data,
    paths,
    user,
    searchQuery,
    sortField,
    sortOrder,
    viewMode,
    isLoading,
    loadError,
    currentBaseUrl,
    visiblePaths,
    statsSummary,
    getItemUrl,
    getRelativeUrl,
    setViewMode,
    toggleSort,
    refreshList,
    checkAuth,
    login,
    logout,
    createFolder,
    saveTextFile,
    moveItem,
    deleteItem,
    generateTokenUrl,
    triggerDownload,
    addDemoUploadedItem,
  }
}

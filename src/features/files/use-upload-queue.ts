import { computed, onScopeDispose, ref, watch } from 'vue'
import { api, uploadFileRequest } from '../../app/api'
import type { UploadHandle } from '../../app/api'
import { errorText } from '../../app/errors'
import { showToast } from '../../app/toast'
import { FILE_ERROR_MESSAGES } from './file-errors'
import type { UploadTask } from './types'

const MAX_CONCURRENT = 2

type SpeedSample = {
  readonly time: number
  readonly bytes: number
}

export type UseUploadQueueOptions = {
  readonly isDemo: boolean
  readonly canUpload: () => boolean
  readonly resolveUrl: (relativePath: string) => string
  readonly ensureAuth: () => Promise<void>
  readonly onUploaded: (relativePath: string, file: File) => void
}

export function useUploadQueue(options: UseUploadQueueOptions) {
  const tasks = ref<UploadTask[]>([])
  const isPanelCollapsed = ref(false)
  const isDragOver = ref(false)

  let taskIdSeq = 0
  let hasCheckedAuth = false
  let dragDepth = 0
  const handles = new Map<number, UploadHandle>()
  const demoTimers = new Map<number, number>()

  const activeCount = computed(
    () => tasks.value.filter((t) => t.state === 'uploading' || t.state === 'queued').length,
  )
  const doneCount = computed(() => tasks.value.filter((t) => t.state === 'done').length)
  const overallPercent = computed(() => {
    if (tasks.value.length === 0) return 0
    const total = tasks.value.reduce((sum, t) => sum + t.total, 0)
    const loaded = tasks.value.reduce(
      (sum, t) => sum + (t.state === 'done' ? t.total : t.loaded),
      0,
    )
    if (total === 0) return activeCount.value === 0 ? 100 : 0
    return Math.min(100, Math.round((loaded / total) * 100))
  })

  function enqueue(file: File, dirParts: readonly string[]): void {
    const relativePath = [...dirParts, file.name].join('/')
    const task: UploadTask = {
      id: ++taskIdSeq,
      file,
      name: relativePath,
      url: options.resolveUrl(relativePath),
      state: 'queued',
      loaded: 0,
      total: file.size,
      offset: 0,
      speed: 0,
      eta: Infinity,
      errorText: '',
    }
    tasks.value = [task, ...tasks.value]
    isPanelCollapsed.value = false
    void pumpQueue()
  }

  async function pumpQueue(): Promise<void> {
    const running = tasks.value.filter((t) => t.state === 'uploading').length
    if (running >= MAX_CONCURRENT) return

    const next = [...tasks.value].reverse().find((t) => t.state === 'queued')
    if (!next) return

    next.state = 'uploading'

    if (options.isDemo) {
      runDemoUpload(next)
      void pumpQueue()
      return
    }

    if (!hasCheckedAuth) {
      hasCheckedAuth = true
      try {
        await options.ensureAuth()
      } catch {
        hasCheckedAuth = false
      }
    }

    runRealUpload(next)
    void pumpQueue()
  }

  function runRealUpload(task: UploadTask): void {
    const speedSamples: SpeedSample[] = [{ time: Date.now(), bytes: 0 }]
    const handle = uploadFileRequest({
      url: task.url,
      file: task.file,
      offset: task.offset,
      onProgress: (event) => {
        const now = Date.now()
        speedSamples.push({ time: now, bytes: event.loaded })
        while (speedSamples.length > 2 && now - (speedSamples[0]?.time ?? now) > 4000) {
          speedSamples.shift()
        }
        const oldest = speedSamples[0]
        const dt = oldest ? (now - oldest.time) / 1000 : 0
        task.speed = oldest && dt > 0.1 ? (event.loaded - oldest.bytes) / dt : 0
        task.loaded = task.offset + event.loaded
        task.total = Math.max(task.file.size, task.loaded)
        const remaining = Math.max(0, task.total - task.loaded)
        task.eta = task.speed > 0 ? remaining / task.speed : Infinity
      },
    })
    handles.set(task.id, handle)

    handle.promise
      .then(() => {
        handles.delete(task.id)
        if (task.state === 'canceled') return
        task.state = 'done'
        task.loaded = task.total
        task.speed = 0
        task.eta = 0
        options.onUploaded(task.name, task.file)
      })
      .catch((error: unknown) => {
        handles.delete(task.id)
        if (task.state === 'canceled') return
        if (error instanceof DOMException && error.name === 'AbortError') {
          task.state = 'canceled'
          return
        }
        task.state = 'error'
        task.speed = 0
        task.errorText = errorText(error, FILE_ERROR_MESSAGES)
      })
      .finally(() => {
        void pumpQueue()
      })
  }

  function runDemoUpload(task: UploadTask): void {
    const total = Math.max(task.file.size, 256 * 1024)
    task.total = total
    let current = 0
    const timer = window.setInterval(() => {
      if (task.state === 'canceled') {
        window.clearInterval(timer)
        demoTimers.delete(task.id)
        void pumpQueue()
        return
      }
      current = Math.min(total, current + Math.max(total / 12, 65_536))
      task.loaded = current
      task.speed = total / 1.2
      task.eta = (total - current) / task.speed

      if (current >= total) {
        window.clearInterval(timer)
        demoTimers.delete(task.id)
        task.state = 'done'
        task.speed = 0
        options.onUploaded(task.name, task.file)
        showToast(`演示上传完成：${task.name}`, 'success')
        void pumpQueue()
      }
    }, 100)
    demoTimers.set(task.id, timer)
  }

  function cancelTask(taskId: number): void {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return
    task.state = 'canceled'
    handles.get(taskId)?.abort()
    handles.delete(taskId)
    const timer = demoTimers.get(taskId)
    if (timer !== undefined) {
      window.clearInterval(timer)
      demoTimers.delete(taskId)
    }
    void pumpQueue()
  }

  async function retryTask(taskId: number): Promise<void> {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return
    task.errorText = ''
    task.state = 'queued'
    if (!options.isDemo) {
      try {
        const headers = await api<Headers>(task.url, { method: 'HEAD', responseType: 'headers' })
        const len = Number(headers.get('content-length') ?? '0')
        task.offset = Number.isFinite(len) && len > 0 && len < task.file.size ? len : 0
        task.loaded = task.offset
      } catch {
        task.offset = 0
        task.loaded = 0
      }
    }
    void pumpQueue()
  }

  function clearCompleted(): void {
    tasks.value = tasks.value.filter((t) => t.state === 'uploading' || t.state === 'queued')
  }

  function closePanel(): void {
    if (activeCount.value > 0) {
      isPanelCollapsed.value = true
      showToast('仍有文件上传中，已收起进度面板')
      return
    }
    tasks.value = []
  }

  function toggleCollapse(): void {
    isPanelCollapsed.value = !isPanelCollapsed.value
  }

  async function traverseEntry(entry: FileSystemEntry, dirs: readonly string[]): Promise<void> {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry
      await new Promise<void>((resolve) => {
        fileEntry.file(
          (file) => {
            enqueue(file, dirs)
            resolve()
          },
          () => {
            resolve()
          },
        )
      })
      return
    }
    if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry
      const reader = dirEntry.createReader()
      const children = await new Promise<FileSystemEntry[]>((resolve) => {
        const collected: FileSystemEntry[] = []
        const readBatch = (): void => {
          reader.readEntries(
            (batch) => {
              if (batch.length === 0) {
                resolve(collected)
              } else {
                collected.push(...batch)
                readBatch()
              }
            },
            () => {
              resolve(collected)
            },
          )
        }
        readBatch()
      })
      for (const child of children) {
        await traverseEntry(child, [...dirs, entry.name])
      }
    }
  }

  function hasFilePayload(event: DragEvent): boolean {
    const types = event.dataTransfer?.types
    return types ? Array.from(types).includes('Files') : false
  }

  const onDragEnter = (event: DragEvent): void => {
    if (!options.canUpload() || !hasFilePayload(event)) return
    event.preventDefault()
    dragDepth++
    isDragOver.value = true
  }

  const onDragOver = (event: DragEvent): void => {
    if (!options.canUpload() || !hasFilePayload(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  const onDragLeave = (event: DragEvent): void => {
    if (!options.canUpload() || !hasFilePayload(event)) return
    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) isDragOver.value = false
  }

  const onDrop = (event: DragEvent): void => {
    if (!options.canUpload()) return
    event.preventDefault()
    dragDepth = 0
    isDragOver.value = false
    const dt = event.dataTransfer
    if (!dt) return

    const items = dt.items
    if (items.length > 0 && typeof items[0]?.webkitGetAsEntry === 'function') {
      const entries: FileSystemEntry[] = []
      for (let i = 0; i < items.length; i++) {
        const entry = items[i]?.webkitGetAsEntry()
        if (entry) entries.push(entry)
      }
      void (async () => {
        for (const entry of entries) {
          await traverseEntry(entry, [])
        }
      })()
      return
    }

    for (const file of Array.from(dt.files)) {
      enqueue(file, [])
    }
  }

  const onPaste = (event: ClipboardEvent): void => {
    if (!options.canUpload()) return
    const tag = document.activeElement?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    const files = Array.from(event.clipboardData?.files ?? [])
    if (files.length === 0) return
    event.preventDefault()
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    files.forEach((file, index) => {
      let uploadFile = file
      if (!file.name || file.name === 'image.png') {
        const sub = file.type.split('/')[1]
        const ext = sub ? `.${sub}` : '.png'
        const suffix = index > 0 ? `-${String(index)}` : ''
        uploadFile = new File([file], `paste-${stamp}${suffix}${ext}`, { type: file.type })
      }
      enqueue(uploadFile, [])
    })
    showToast(`已从剪贴板添加 ${String(files.length)} 个文件`)
  }

  const onBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (activeCount.value > 0) {
      event.preventDefault()
    }
  }

  window.addEventListener('dragenter', onDragEnter)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('dragleave', onDragLeave)
  window.addEventListener('drop', onDrop)
  document.addEventListener('paste', onPaste)

  // Only register beforeunload while uploads are active so bfcache stays enabled
  watch(
    () => activeCount.value > 0,
    (hasActive) => {
      if (hasActive) {
        window.addEventListener('beforeunload', onBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', onBeforeUnload)
      }
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    window.removeEventListener('dragenter', onDragEnter)
    window.removeEventListener('dragover', onDragOver)
    window.removeEventListener('dragleave', onDragLeave)
    window.removeEventListener('drop', onDrop)
    document.removeEventListener('paste', onPaste)
    window.removeEventListener('beforeunload', onBeforeUnload)
    for (const handle of handles.values()) handle.abort()
    handles.clear()
    for (const timer of demoTimers.values()) window.clearInterval(timer)
    demoTimers.clear()
  })

  return {
    tasks,
    isPanelCollapsed,
    isDragOver,
    activeCount,
    doneCount,
    overallPercent,
    enqueue,
    cancelTask,
    retryTask,
    clearCompleted,
    closePanel,
    toggleCollapse,
  }
}

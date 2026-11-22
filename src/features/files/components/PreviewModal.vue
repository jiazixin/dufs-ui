<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onWatcherCleanup, ref, watch } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Link2,
  Minus,
  Plus,
  QrCode,
  RotateCw,
  X,
} from '@lucide/vue'
import { api } from '../../../app/api'
import { errorText } from '../../../app/errors'
import { useScrollLock } from '../../../app/scroll-lock'
import { showToast } from '../../../app/toast'
import { formatBytes } from '../../../lib/format/format-bytes'
import { formatDateTime } from '../../../lib/format/format-date'
import { copyToClipboard } from '../clipboard'
import { demoContentStore } from '../dufs-data'
import { FILE_ERROR_MESSAGES } from '../file-errors'
import { detectFileKind } from '../file-types'
import type { PathItem } from '../types'
import FileIcon from './FileIcon.vue'

const { item, siblings, isDemo, getItemUrl } = defineProps<{
  item: PathItem | null
  siblings: readonly PathItem[]
  isDemo: boolean
  getItemUrl: (target: PathItem) => string
}>()

const emit = defineEmits<{
  close: []
  select: [target: PathItem]
  download: [target: PathItem]
  qr: [target: PathItem]
  saved: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const zoom = ref(1)
const rotation = ref(0)
const isLoadingText = ref(false)
const textError = ref<string | null>(null)
const textContent = ref('')
const isEditing = ref(false)
const editDraft = ref('')
const isSaving = ref(false)

let triggerElement: HTMLElement | null = null

useScrollLock(() => item !== null)

const kind = computed(() => (item ? detectFileKind(item) : 'file'))
const itemUrl = computed(() => (item ? getItemUrl(item) : ''))
const mediaSrc = computed(() => {
  if (!item) return ''
  if (isDemo) {
    return demoContentStore.get(item.name)?.url ?? ''
  }
  return itemUrl.value
})
const hasRealMedia = computed(() => !isDemo || (item !== null && demoContentStore.has(item.name)))
const canEditText = computed(
  () =>
    item !== null &&
    item.allow_upload &&
    (item.allow_delete || item.size === 0) &&
    (kind.value === 'code' || kind.value === 'text') &&
    item.size <= 2 * 1024 * 1024,
)
const currentIndex = computed(() =>
  item ? siblings.findIndex((entry) => entry.name === item.name) : -1,
)
const canNavigate = computed(() => siblings.length > 1 && currentIndex.value >= 0)

watch(
  () => item,
  async (current) => {
    const dialog = dialogRef.value
    if (!current) {
      if (dialog?.open) dialog.close()
      triggerElement?.focus()
      triggerElement = null
      return
    }

    if (!dialog?.open) {
      triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog?.showModal()
    }

    zoom.value = 1
    rotation.value = 0
    isEditing.value = false
    textError.value = null
    textContent.value = ''

    const currentKind = detectFileKind(current)
    if ((currentKind === 'code' || currentKind === 'text') && current.size <= 2 * 1024 * 1024) {
      const controller = new AbortController()
      onWatcherCleanup(() => {
        controller.abort()
      })
      isLoadingText.value = true
      try {
        if (isDemo) {
          const demoEntry = demoContentStore.get(current.name)
          if (typeof demoEntry?.text === 'string') {
            textContent.value = demoEntry.text
          } else if (demoEntry?.file) {
            textContent.value = await demoEntry.file.text()
          }
        } else {
          textContent.value = await api<string>(getItemUrl(current), {
            responseType: 'text',
            signal: controller.signal,
          })
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        textError.value = errorText(error, FILE_ERROR_MESSAGES)
      } finally {
        isLoadingText.value = false
      }
    }
  },
)

function step(delta: number): void {
  if (!canNavigate.value) return
  const nextIdx = (currentIndex.value + delta + siblings.length) % siblings.length
  const next = siblings[nextIdx]
  if (next) emit('select', next)
}

function adjustZoom(delta: number): void {
  zoom.value = Math.min(4, Math.max(0.25, Number((zoom.value + delta).toFixed(2))))
}

function rotateImage(): void {
  rotation.value = (rotation.value + 90) % 360
}

function toggleImageDoubleZoom(): void {
  zoom.value = zoom.value === 1 ? 1.75 : 1
}

function toggleEdit(): void {
  if (!isEditing.value) {
    editDraft.value = textContent.value
    isEditing.value = true
  } else {
    isEditing.value = false
  }
}

async function saveText(): Promise<void> {
  if (!item || isSaving.value) return
  isSaving.value = true
  try {
    if (isDemo) {
      textContent.value = editDraft.value
      demoContentStore.set(item.name, { text: editDraft.value })
      isEditing.value = false
      showToast('演示模式：已保存修改', 'success')
      return
    }
    await api<undefined>(getItemUrl(item), {
      method: 'PUT',
      body: editDraft.value,
      responseType: 'void',
    })
    textContent.value = editDraft.value
    isEditing.value = false
    emit('saved')
    showToast('文件已保存', 'success')
  } catch (error: unknown) {
    showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
  } finally {
    isSaving.value = false
  }
}

function handleCancel(event: Event): void {
  event.preventDefault()
  emit('close')
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === dialogRef.value) {
    emit('close')
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!item) return
  if (isEditing.value && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    void saveText()
    return
  }
  const tag = document.activeElement?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    step(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    step(1)
  } else if (kind.value === 'image') {
    if (event.key === '+' || event.key === '=') adjustZoom(0.25)
    else if (event.key === '-') adjustZoom(-0.25)
    else if (event.key === '0') {
      zoom.value = 1
      rotation.value = 0
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="preview-dialog"
    aria-labelledby="preview-modal-title"
    @cancel="handleCancel"
    @click="handleBackdropClick"
  >
    <div v-if="item" class="preview-shell">
      <div class="preview-header">
        <div class="preview-meta">
          <FileIcon :item="item" :size="20" />
          <div class="preview-title-wrap">
            <h2 id="preview-modal-title" class="preview-title">{{ item.name }}</h2>
            <div class="preview-sub">
              {{ formatBytes(item.size) }} · {{ formatDateTime(item.mtime) }}
            </div>
          </div>
        </div>

        <div class="preview-actions">
          <div v-if="kind === 'image'" class="tool-group">
            <button
              type="button"
              class="icon-btn-sm"
              aria-label="缩小"
              title="缩小 (-)"
              @click="adjustZoom(-0.25)"
            >
              <Minus :size="15" :stroke-width="1.8" />
            </button>
            <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
            <button
              type="button"
              class="icon-btn-sm"
              aria-label="放大"
              title="放大 (+)"
              @click="adjustZoom(0.25)"
            >
              <Plus :size="15" :stroke-width="1.8" />
            </button>
            <button
              type="button"
              class="icon-btn-sm"
              aria-label="旋转 90 度"
              title="旋转 90°"
              @click="rotateImage"
            >
              <RotateCw :size="14" :stroke-width="1.8" />
            </button>
          </div>

          <div v-if="(kind === 'code' || kind === 'text') && !textError" class="tool-group">
            <button
              type="button"
              class="btn btn-secondary btn-xs"
              @click="void copyToClipboard(textContent, '文件内容已复制')"
            >
              复制内容
            </button>
            <button
              v-if="canEditText"
              type="button"
              class="btn btn-secondary btn-xs"
              @click="toggleEdit"
            >
              {{ isEditing ? '取消' : '编辑' }}
            </button>
            <button
              v-if="isEditing"
              type="button"
              class="btn btn-primary btn-xs"
              :disabled="isSaving"
              @click="void saveText()"
            >
              {{ isSaving ? '保存中…' : '保存' }}
            </button>
          </div>

          <button
            type="button"
            class="icon-btn-sm"
            aria-label="二维码分享"
            title="二维码分享"
            @click="emit('qr', item)"
          >
            <QrCode :size="15" :stroke-width="1.8" />
          </button>

          <button
            type="button"
            class="icon-btn-sm"
            aria-label="复制直链"
            title="复制直链"
            @click="void copyToClipboard(itemUrl, '下载链接已复制')"
          >
            <Link2 :size="15" :stroke-width="1.8" />
          </button>

          <button type="button" class="btn btn-primary btn-xs" @click="emit('download', item)">
            <Download :size="13" :stroke-width="2" />
            <span>下载</span>
          </button>

          <a
            class="icon-btn-sm"
            :href="itemUrl"
            target="_blank"
            rel="noopener"
            aria-label="新标签页打开"
            title="新标签页打开"
          >
            <ExternalLink :size="15" :stroke-width="1.8" />
          </a>

          <button
            type="button"
            class="icon-btn-sm"
            aria-label="关闭预览"
            title="关闭 (Esc)"
            @click="emit('close')"
          >
            <X :size="16" :stroke-width="1.8" />
          </button>
        </div>
      </div>

      <div class="preview-stage">
        <button
          v-if="canNavigate"
          type="button"
          class="nav-btn is-prev"
          aria-label="上一个文件"
          title="上一个 (←)"
          @click="step(-1)"
        >
          <ChevronLeft :size="20" :stroke-width="1.8" />
        </button>

        <div
          class="preview-content"
          :class="{
            'is-full': kind === 'pdf' || kind === 'code' || kind === 'text',
            'is-media': kind === 'image' || kind === 'video',
          }"
        >
          <img
            v-if="kind === 'image' && mediaSrc"
            class="preview-img"
            :src="mediaSrc"
            :alt="item.name"
            :style="{ transform: `scale(${String(zoom)}) rotate(${String(rotation)}deg)` }"
            @dblclick="toggleImageDoubleZoom"
          />

          <video
            v-else-if="kind === 'video' && hasRealMedia"
            class="preview-video"
            :src="mediaSrc"
            controls
            playsinline
          />

          <div v-else-if="kind === 'audio' && hasRealMedia" class="audio-card">
            <FileIcon :item="item" :size="40" />
            <div class="audio-name">{{ item.name }}</div>
            <audio :src="mediaSrc" controls />
          </div>

          <iframe
            v-else-if="kind === 'pdf' && hasRealMedia"
            class="preview-iframe"
            :src="mediaSrc"
            :title="item.name"
          />

          <template v-else-if="kind === 'code' || kind === 'text'">
            <div v-if="item.size > 2 * 1024 * 1024" class="fallback-box">
              <div>文本体积超过 2 MiB，已跳过内联预览</div>
              <button type="button" class="btn btn-primary" @click="emit('download', item)">
                直接下载 ({{ formatBytes(item.size) }})
              </button>
            </div>
            <div v-else-if="isLoadingText" class="fallback-box">加载文件内容中…</div>
            <div v-else-if="textError" class="fallback-box" role="alert">{{ textError }}</div>
            <textarea
              v-else-if="isEditing"
              v-model="editDraft"
              class="preview-editor"
              spellcheck="false"
              aria-label="编辑文件内容"
            />
            <pre v-else class="preview-code">{{ textContent }}</pre>
          </template>

          <div v-else class="fallback-box">
            <FileIcon :item="item" :size="44" />
            <div class="fallback-name">{{ item.name }}</div>
            <div class="fallback-sub">
              {{
                isDemo
                  ? '演示占位文件（拖入本地图片、视频或 PDF 即可实时预览）'
                  : `暂不支持在线预览此格式（${formatBytes(item.size)}）`
              }}
            </div>
            <div class="fallback-actions">
              <button type="button" class="btn btn-primary" @click="emit('download', item)">
                下载文件
              </button>
              <button type="button" class="btn btn-secondary" @click="emit('qr', item)">
                二维码分享
              </button>
            </div>
          </div>
        </div>

        <button
          v-if="canNavigate"
          type="button"
          class="nav-btn is-next"
          aria-label="下一个文件"
          title="下一个 (→)"
          @click="step(1)"
        >
          <ChevronRight :size="20" :stroke-width="1.8" />
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.preview-dialog {
  padding: 0;
  border: none;
  background: transparent;
  width: min(1040px, 96vw);
  height: min(86vh, 820px);
  max-width: 96vw;
  max-height: 92vh;
  color: var(--text);
}

.preview-dialog::backdrop {
  background: var(--overlay-bg);
  backdrop-filter: blur(8px);
}

.preview-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-subtle);
  flex-shrink: 0;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.preview-title-wrap {
  min-width: 0;
}

.preview-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tool-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-right: 6px;
  margin-right: 4px;
  border-right: 1px solid var(--border);
}

.zoom-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.preview-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  overflow: hidden;
}

.preview-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 20px;
}

.preview-content.is-media {
  padding: 12px;
}

.preview-content.is-full {
  padding: 0;
}

.preview-img {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  transition: transform var(--duration-fast) ease;
}

.preview-video {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-md);
  background: var(--media-bg);
}

.audio-card {
  width: min(420px, 100%);
  padding: 28px 24px;
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.audio-name {
  font-weight: 600;
  word-break: break-all;
}

.audio-card audio {
  width: 100%;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--iframe-bg);
}

.preview-code,
.preview-editor {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 20px 24px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.65;
  background: var(--bg-elevated);
  color: var(--text);
}

.preview-code {
  overflow: auto;
  overscroll-behavior: contain;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.preview-editor {
  border: none;
  outline: none;
  resize: none;
  overscroll-behavior: contain;
}

.fallback-box {
  text-align: center;
  padding: 32px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.fallback-name {
  font-weight: 600;
  color: var(--text);
}

.fallback-sub {
  font-size: 13px;
}

.fallback-actions {
  display: flex;
  gap: 8px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border);
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.nav-btn:hover {
  background: var(--bg-elevated);
}

.is-prev {
  left: 14px;
}

.is-next {
  right: 14px;
}

@media (width <= 640px) {
  .preview-dialog {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
  }

  .preview-shell {
    border-radius: 0;
  }

  .preview-header {
    flex-wrap: wrap;
  }
}
</style>

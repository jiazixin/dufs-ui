<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '../../../app/api'
import { errorText } from '../../../app/errors'
import { showToast } from '../../../app/toast'
import { detectCodeLanguage } from '../../../lib/highlight/highlight-code'
import { getBaseName, getBaseUrl } from '../../../lib/url'
import { FILE_ERROR_MESSAGES } from '../file-errors'
import { detectFileKind, isCodeFileName } from '../file-types'
import type { DufsData } from '../types'
import CodeViewer from './CodeViewer.vue'

const { data, ensureAuth = async () => {} } = defineProps<{
  data: DufsData
  ensureAuth?: () => Promise<void>
}>()

const emit = defineEmits<{
  openQr: [title: string, url: string]
  download: [url: string, filename: string]
  move: []
  delete: []
}>()

const fileUrl = getBaseUrl()
const fileName = getBaseName(fileUrl)
const content = ref('')
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const isSaving = ref(false)

const canSave = data.kind === 'Edit' && data.editable && data.allow_upload
const canMove = data.kind === 'Edit' && data.allow_upload && data.allow_delete
const canDelete = data.kind === 'Edit' && data.allow_delete
const isCodeFile = isCodeFileName(fileName)
const codeLanguageLabel = isCodeFile ? detectCodeLanguage(fileName).label : ''
const mediaKind = detectFileKind({
  path_type: 'File',
  name: fileName,
  mtime: 0,
  size: 0,
  allow_upload: false,
  allow_delete: false,
})

async function loadFile(): Promise<void> {
  if (!data.editable) return
  isLoading.value = true
  loadError.value = null
  try {
    content.value = await api<string>(fileUrl, { responseType: 'text' })
  } catch (error: unknown) {
    loadError.value = errorText(error, FILE_ERROR_MESSAGES)
  } finally {
    isLoading.value = false
  }
}

async function saveFile(): Promise<void> {
  if (!canSave || isSaving.value) return
  isSaving.value = true
  try {
    await ensureAuth()
    await api<undefined>(fileUrl, { method: 'PUT', body: content.value, responseType: 'void' })
    showToast('文件已保存', 'success')
  } catch (error: unknown) {
    showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
  } finally {
    isSaving.value = false
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (canSave && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    void saveFile()
  }
}

onMounted(() => {
  void loadFile()
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <section class="editor-page">
    <div class="editor-toolbar surface">
      <div class="editor-info">
        <span class="editor-name">{{ fileName }}</span>
        <span class="mode-badge">{{ data.kind === 'Edit' ? '编辑模式' : '只读查看' }}</span>
        <span v-if="isCodeFile" class="lang-badge">{{ codeLanguageLabel }}</span>
      </div>
      <div class="editor-actions">
        <button type="button" class="btn btn-secondary" @click="emit('openQr', fileName, fileUrl)">
          二维码
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="emit('download', fileUrl, fileName)"
        >
          下载
        </button>
        <button v-if="canMove" type="button" class="btn btn-secondary" @click="emit('move')">
          重命名 / 移动
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="btn btn-secondary is-danger-btn"
          @click="emit('delete')"
        >
          删除
        </button>
        <button
          v-if="canSave"
          type="button"
          class="btn btn-primary"
          :disabled="isSaving"
          @click="void saveFile()"
        >
          {{ isSaving ? '保存中…' : '保存 (Ctrl+S)' }}
        </button>
      </div>
    </div>

    <div class="editor-body surface">
      <template v-if="!data.editable">
        <div v-if="mediaKind === 'image'" class="editor-media">
          <img class="editor-media-img" :src="fileUrl" :alt="fileName" />
        </div>
        <div v-else-if="mediaKind === 'video'" class="editor-media">
          <video class="editor-media-video" :src="fileUrl" controls playsinline />
        </div>
        <div v-else-if="mediaKind === 'audio'" class="editor-media">
          <audio class="editor-media-audio" :src="fileUrl" controls />
        </div>
        <iframe
          v-else-if="mediaKind === 'pdf'"
          class="editor-media-iframe"
          :src="fileUrl"
          :title="fileName"
        />
        <div v-else class="editor-state">
          <div>该文件为二进制或体积过大，无法在线编辑</div>
          <button
            type="button"
            class="btn btn-primary"
            @click="emit('download', fileUrl, fileName)"
          >
            下载文件
          </button>
        </div>
      </template>
      <div v-else-if="isLoading" class="editor-state">正在加载文件…</div>
      <div v-else-if="loadError" class="editor-state" role="alert">
        <div>{{ loadError }}</div>
        <button type="button" class="btn btn-secondary" @click="void loadFile()">重试</button>
      </div>
      <CodeViewer
        v-else-if="!canSave && isCodeFile"
        class="editor-code-viewer"
        :code="content"
        :filename="fileName"
      />
      <textarea
        v-else
        v-model="content"
        class="editor-textarea"
        :class="{ 'is-code': isCodeFile }"
        :readonly="!canSave"
        spellcheck="false"
        aria-label="文本编辑器"
      />
    </div>
  </section>
</template>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-toolbar {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.editor-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-name {
  font-weight: 600;
}

.mode-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 500;
}

.lang-badge {
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--code-border);
  background: var(--code-bg);
  color: var(--code-badge-text);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.is-danger-btn:hover {
  background: var(--danger-soft);
  border-color: var(--danger);
  color: var(--danger);
}

.editor-media {
  flex: 1;
  min-height: calc(100vh - 170px);
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-media-img {
  max-width: 100%;
  max-height: calc(100vh - 220px);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
}

.editor-media-video {
  max-width: 100%;
  max-height: calc(100vh - 220px);
  border-radius: var(--radius-md);
  background: var(--media-bg);
}

.editor-media-audio {
  width: min(440px, 100%);
}

.editor-media-iframe {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 170px);
  border: none;
  background: var(--iframe-bg);
}

.editor-body {
  min-height: calc(100vh - 170px);
  display: flex;
  flex-direction: column;
}

.editor-code-viewer {
  flex: 1;
  min-height: calc(100vh - 170px);
}

.editor-state {
  padding: 64px 24px;
  text-align: center;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 170px);
  border: none;
  outline: none;
  resize: vertical;
  padding: 20px 24px;
  font-family: var(--font-mono);
  font-size: 13.5px;
  line-height: 1.65;
  background: transparent;
  color: var(--text);
}

.editor-textarea.is-code {
  background: var(--code-bg);
  color: var(--code-text);
  caret-color: var(--code-caret);
}

.editor-textarea.is-code::selection {
  background: var(--code-selection);
}
</style>

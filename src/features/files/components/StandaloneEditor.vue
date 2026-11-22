<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '../../../app/api'
import { errorText } from '../../../app/errors'
import { showToast } from '../../../app/toast'
import { getBaseName, getBaseUrl } from '../../../lib/url'
import { FILE_ERROR_MESSAGES } from '../file-errors'
import type { DufsData } from '../types'

const { data } = defineProps<{
  data: DufsData
}>()

const emit = defineEmits<{
  openQr: [title: string, url: string]
  download: [url: string, filename: string]
}>()

const fileUrl = getBaseUrl()
const fileName = getBaseName(fileUrl)
const content = ref('')
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const isSaving = ref(false)

const canSave = data.kind === 'Edit' && data.editable && data.allow_upload

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
      <div v-if="!data.editable" class="editor-state">该文件为二进制或体积过大，无法在线编辑</div>
      <div v-else-if="isLoading" class="editor-state">正在加载文件…</div>
      <div v-else-if="loadError" class="editor-state" role="alert">
        <div>{{ loadError }}</div>
        <button type="button" class="btn btn-secondary" @click="void loadFile()">重试</button>
      </div>
      <textarea
        v-else
        v-model="content"
        class="editor-textarea"
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

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-body {
  min-height: calc(100vh - 170px);
  display: flex;
  flex-direction: column;
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
</style>

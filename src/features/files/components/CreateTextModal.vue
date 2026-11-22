<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FilePlus, Save, X } from '@lucide/vue'
import { openConfirm } from '../../../app/dialog'
import { formatBytes } from '../../../lib/format/format-bytes'

const { isOpen, saveFile } = defineProps<{
  isOpen: boolean
  saveFile: (
    name: string,
    content: string,
    options?: { checkOverwrite?: boolean },
  ) => Promise<boolean>
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const contentInputRef = ref<HTMLTextAreaElement | null>(null)

const fileName = ref('')
const content = ref('')
const savedFileName = ref<string | null>(null)
const savedContent = ref('')
const validationError = ref<string | null>(null)
const isSaving = ref(false)
const isConfirmingClose = ref(false)

let triggerElement: HTMLElement | null = null

const trimmedName = computed(() => fileName.value.trim())

const hasUnsavedChanges = computed(() => {
  if (savedFileName.value === null) {
    return trimmedName.value.length > 0 || content.value.length > 0
  }
  return trimmedName.value !== savedFileName.value || content.value !== savedContent.value
})

const saveState = computed<'unsaved' | 'dirty' | 'saved'>(() => {
  if (savedFileName.value === null) return 'unsaved'
  return hasUnsavedChanges.value ? 'dirty' : 'saved'
})

const statusLabel = computed(() => {
  switch (saveState.value) {
    case 'saved':
      return '已保存'
    case 'dirty':
      return '有未保存修改'
    case 'unsaved':
      return '未保存'
  }
})

const lineCount = computed(() =>
  content.value.length === 0 ? 0 : content.value.split('\n').length,
)

const byteSize = computed(() => new TextEncoder().encode(content.value).byteLength)

function validateFileName(raw: string): string | null {
  const name = raw.trim()
  if (!name) return '请输入文件名，例如 notes.md'
  if (name.startsWith('/') || name.endsWith('/')) return '文件名不能以 / 开头或结尾'
  if (name.includes('\\')) return '文件名不能包含反斜杠'
  const segments = name.split('/')
  for (const segment of segments) {
    if (!segment || segment === '.' || segment === '..') {
      return '文件名包含无效路径片段'
    }
  }
  return null
}

function resetForm(): void {
  fileName.value = ''
  content.value = ''
  savedFileName.value = null
  savedContent.value = ''
  validationError.value = null
  isSaving.value = false
}

watch(
  () => isOpen,
  async (open) => {
    const dialog = dialogRef.value
    if (open) {
      triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
      resetForm()
      if (dialog && !dialog.open) {
        dialog.showModal()
      }
      await nextTick()
      nameInputRef.value?.focus()
    } else {
      if (dialog?.open) {
        dialog.close()
      }
      triggerElement?.focus()
      triggerElement = null
    }
  },
)

watch(fileName, () => {
  if (validationError.value) {
    validationError.value = null
  }
})

function focusEditor(): void {
  contentInputRef.value?.focus()
}

async function handleSave(): Promise<void> {
  if (isSaving.value) return
  const error = validateFileName(fileName.value)
  if (error) {
    validationError.value = error
    nameInputRef.value?.focus()
    return
  }

  const targetName = trimmedName.value
  const targetContent = content.value
  const shouldCheckOverwrite = savedFileName.value !== targetName

  isSaving.value = true
  try {
    const ok = await saveFile(targetName, targetContent, { checkOverwrite: shouldCheckOverwrite })
    if (ok) {
      fileName.value = targetName
      savedFileName.value = targetName
      savedContent.value = targetContent
    }
  } finally {
    isSaving.value = false
  }
}

async function requestClose(): Promise<void> {
  if (isSaving.value || isConfirmingClose.value) return
  if (!hasUnsavedChanges.value) {
    emit('close')
    return
  }
  isConfirmingClose.value = true
  try {
    const confirmed = await openConfirm({
      title: '放弃未保存的内容？',
      message: '当前文本尚未保存，关闭后修改将会丢失。',
      confirmText: '放弃并关闭',
      isDanger: true,
    })
    if (confirmed) {
      emit('close')
    }
  } finally {
    isConfirmingClose.value = false
  }
}

function handleCancel(event: Event): void {
  event.preventDefault()
  void requestClose()
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === dialogRef.value) {
    void requestClose()
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!isOpen) return
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    void handleSave()
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
    class="text-modal-dialog"
    aria-labelledby="create-text-modal-title"
    @cancel="handleCancel"
    @click="handleBackdropClick"
  >
    <div v-if="isOpen" class="text-modal-card">
      <div class="text-modal-header">
        <div class="text-modal-title-group">
          <FilePlus :size="18" :stroke-width="1.8" class="title-icon" aria-hidden="true" />
          <h2 id="create-text-modal-title" class="text-modal-title">新建文本文件</h2>
          <span
            class="status-badge"
            :class="{
              'is-saved': saveState === 'saved',
              'is-dirty': saveState === 'dirty',
            }"
          >
            {{ statusLabel }}
          </span>
        </div>
        <button
          type="button"
          class="icon-btn-sm"
          aria-label="关闭新建文本弹窗"
          title="关闭 (Esc)"
          @click="void requestClose()"
        >
          <X :size="16" :stroke-width="1.8" />
        </button>
      </div>

      <div class="text-modal-name-row">
        <label class="name-label" for="create-text-filename">文件名</label>
        <div class="name-input-wrap">
          <input
            id="create-text-filename"
            ref="nameInputRef"
            v-model="fileName"
            type="text"
            class="input-field"
            :class="{ 'is-invalid': Boolean(validationError) }"
            placeholder="例如：notes.md、config.json"
            autocomplete="off"
            @keydown.enter.prevent="focusEditor"
          />
          <p v-if="validationError" class="field-error" role="alert">{{ validationError }}</p>
        </div>
      </div>

      <div class="text-modal-body">
        <label class="sr-only" for="create-text-content">文件内容</label>
        <textarea
          id="create-text-content"
          ref="contentInputRef"
          v-model="content"
          class="text-modal-editor"
          placeholder="在此输入文件内容…"
          spellcheck="false"
        />
      </div>

      <div class="text-modal-footer">
        <div class="footer-meta">
          <span>{{ lineCount }} 行 · {{ formatBytes(byteSize) }}</span>
          <span class="shortcut-hint">Ctrl+S 保存</span>
        </div>
        <div class="footer-actions">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="isSaving"
            @click="void requestClose()"
          >
            {{ saveState === 'saved' ? '关闭' : '取消' }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="isSaving"
            @click="void handleSave()"
          >
            <Save :size="14" :stroke-width="1.9" aria-hidden="true" />
            <span>{{ isSaving ? '保存中…' : '保存' }}</span>
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.text-modal-dialog {
  padding: 0;
  border: none;
  background: transparent;
  width: min(720px, calc(100vw - 32px));
  height: min(74vh, 600px);
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 32px);
  color: var(--text);
}

.text-modal-dialog::backdrop {
  background: var(--overlay-bg);
  backdrop-filter: blur(8px);
}

.text-modal-card {
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

.text-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-subtle);
  flex-shrink: 0;
}

.text-modal-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.title-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.text-modal-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.status-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.status-badge.is-saved {
  border-color: var(--success);
  color: var(--success);
}

.status-badge.is-dirty {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

.text-modal-name-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-elevated);
  flex-shrink: 0;
}

.name-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 36px;
  flex-shrink: 0;
}

.name-input-wrap {
  flex: 1;
  min-width: 0;
}

.input-field.is-invalid {
  border-color: var(--danger);
}

.field-error {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--danger);
}

.text-modal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  background: var(--bg);
}

.text-modal-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px 18px;
  background: var(--bg-elevated);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13.5px;
  line-height: 1.65;
}

.text-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-top: 1px solid var(--border);
  background: var(--bg-subtle);
  flex-shrink: 0;
}

.footer-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.shortcut-hint {
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  font-family: var(--font-mono);
  font-size: 11px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (width <= 640px) {
  .text-modal-dialog {
    width: calc(100vw - 24px);
    height: min(80vh, 560px);
  }

  .text-modal-name-row {
    flex-direction: column;
    gap: 4px;
    padding: 10px 14px;
  }

  .name-label {
    line-height: 1.4;
  }

  .name-input-wrap {
    width: 100%;
  }

  .shortcut-hint {
    display: none;
  }

  .text-modal-header,
  .text-modal-footer {
    padding: 12px 14px;
  }
}
</style>

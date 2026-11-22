<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import { useDialog } from '../app/dialog'
import { useScrollLock } from '../app/scroll-lock'

const { activeDialog, resolveDialog } = useDialog()
useScrollLock(() => activeDialog.value !== null)
const dialogRef = ref<HTMLDialogElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const draftValue = ref('')

let triggerElement: HTMLElement | null = null

watch(activeDialog, async (req) => {
  const el = dialogRef.value
  if (req) {
    triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    draftValue.value = req.initialValue ?? ''
    if (el && !el.open) {
      el.showModal()
    }
    await nextTick()
    if (req.mode === 'prompt') {
      inputRef.value?.focus()
      inputRef.value?.select()
    }
  } else {
    if (el?.open) {
      el.close()
    }
    triggerElement?.focus()
    triggerElement = null
  }
})

function handleCancel(event: Event): void {
  event.preventDefault()
  resolveDialog(null)
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === dialogRef.value) {
    resolveDialog(null)
  }
}

function handleSubmit(): void {
  const req = activeDialog.value
  if (!req) return
  if (req.mode === 'prompt') {
    resolveDialog(draftValue.value.trim())
  } else {
    resolveDialog(true)
  }
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="native-dialog"
    aria-labelledby="app-dialog-title"
    @cancel="handleCancel"
    @click="handleBackdropClick"
  >
    <div v-if="activeDialog" class="dialog-card">
      <div class="dialog-header">
        <h3 id="app-dialog-title" class="dialog-title">{{ activeDialog.title }}</h3>
        <button
          type="button"
          class="icon-btn-sm"
          aria-label="关闭对话框"
          @click="resolveDialog(null)"
        >
          <X :size="16" :stroke-width="1.8" />
        </button>
      </div>

      <form class="dialog-body" @submit.prevent="handleSubmit">
        <p v-if="activeDialog.message" class="dialog-message">{{ activeDialog.message }}</p>
        <input
          v-if="activeDialog.mode === 'prompt'"
          ref="inputRef"
          v-model="draftValue"
          type="text"
          class="input-field"
          :placeholder="activeDialog.placeholder"
          autocomplete="off"
        />
        <div class="dialog-footer">
          <button type="button" class="btn btn-secondary" @click="resolveDialog(null)">取消</button>
          <button
            type="submit"
            class="btn"
            :class="activeDialog.isDanger ? 'btn-danger' : 'btn-primary'"
          >
            {{ activeDialog.confirmText ?? '确定' }}
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>

<style scoped>
.native-dialog {
  padding: 0;
  border: none;
  background: transparent;
  max-width: min(420px, calc(100vw - 32px));
  width: 100%;
  color: var(--text);
}

.native-dialog::backdrop {
  background: var(--overlay-bg);
  backdrop-filter: blur(6px);
}

.dialog-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 18px;
  border-bottom: 1px solid var(--border);
}

.dialog-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.dialog-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dialog-message {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

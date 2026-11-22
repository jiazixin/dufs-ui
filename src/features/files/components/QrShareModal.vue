<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { X } from '@lucide/vue'
import { errorText } from '../../../app/errors'
import { useScrollLock } from '../../../app/scroll-lock'
import { showToast } from '../../../app/toast'
import { encodeQr, qrToPngDataUrl } from '../../../lib/qr/encode-qr'
import { copyToClipboard } from '../clipboard'
import { FILE_ERROR_MESSAGES } from '../file-errors'
import type { QrTarget } from '../types'

const { target, hasUser, isDemo, generateTokenUrl } = defineProps<{
  target: QrTarget | null
  hasUser: boolean
  isDemo: boolean
  generateTokenUrl: (rawUrl: string) => Promise<string>
}>()

const emit = defineEmits<{
  close: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const displayUrl = ref('')
const isGeneratingToken = ref(false)

let triggerElement: HTMLElement | null = null

useScrollLock(() => target !== null)

watch(
  () => target,
  (next) => {
    const dialog = dialogRef.value
    if (next) {
      triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
      displayUrl.value = next.url
      if (dialog && !dialog.open) dialog.showModal()
    } else {
      if (dialog?.open) dialog.close()
      triggerElement?.focus()
      triggerElement = null
    }
  },
)

const qrResult = computed(() => {
  if (!displayUrl.value) return { matrix: null, error: '' }
  try {
    return { matrix: encodeQr(displayUrl.value, 2), error: '' }
  } catch (error: unknown) {
    return {
      matrix: null,
      error: error instanceof Error ? error.message : '二维码生成失败',
    }
  }
})

const canCreateToken = computed(() => Boolean(target?.allowToken && hasUser && !isDemo))

async function createTokenLink(): Promise<void> {
  if (!target || isGeneratingToken.value) return
  isGeneratingToken.value = true
  try {
    displayUrl.value = await generateTokenUrl(target.url)
    showToast('已生成免密临时下载链接', 'success')
  } catch (error: unknown) {
    showToast(errorText(error, FILE_ERROR_MESSAGES), 'error')
  } finally {
    isGeneratingToken.value = false
  }
}

function downloadPng(): void {
  if (!displayUrl.value || !target) return
  try {
    const link = document.createElement('a')
    link.href = qrToPngDataUrl(displayUrl.value, 512, 4)
    const safeName = target.title.replace(/[^\w\u4e00-\u9fa5.-]/g, '_')
    link.download = `qr-${safeName}.png`
    link.click()
    showToast('二维码 PNG 已保存', 'success')
  } catch {
    showToast('导出二维码失败', 'error')
  }
}

function handleCancel(event: Event): void {
  event.preventDefault()
  emit('close')
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === dialogRef.value) emit('close')
}
</script>

<template>
  <dialog
    ref="dialogRef"
    class="qr-dialog"
    aria-labelledby="qr-modal-title"
    @cancel="handleCancel"
    @click="handleBackdropClick"
  >
    <div v-if="target" class="qr-card">
      <div class="qr-header">
        <div>
          <h3 id="qr-modal-title" class="qr-title">二维码分享</h3>
          <p class="qr-sub">{{ target.title }}</p>
        </div>
        <button
          type="button"
          class="icon-btn-sm"
          aria-label="关闭二维码弹窗"
          @click="emit('close')"
        >
          <X :size="16" :stroke-width="1.8" />
        </button>
      </div>

      <div class="qr-body">
        <div class="qr-frame">
          <svg
            v-if="qrResult.matrix"
            class="qr-svg"
            :viewBox="qrResult.matrix.viewBox"
            shape-rendering="crispEdges"
            role="img"
            :aria-label="`${target.title} 二维码`"
          >
            <rect width="100%" height="100%" class="qr-bg" />
            <path :d="qrResult.matrix.path" class="qr-fg" />
          </svg>
          <div v-else class="qr-error" role="alert">{{ qrResult.error }}</div>
        </div>

        <div class="qr-url-row">
          <label class="sr-only" for="qr-url-input">分享链接</label>
          <input id="qr-url-input" class="input-field" type="text" :value="displayUrl" readonly />
          <button
            type="button"
            class="btn btn-primary"
            @click="void copyToClipboard(displayUrl, '分享链接已复制')"
          >
            复制链接
          </button>
        </div>

        <div class="qr-actions">
          <button
            v-if="canCreateToken"
            type="button"
            class="btn btn-secondary"
            :disabled="isGeneratingToken"
            @click="void createTokenLink()"
          >
            {{ isGeneratingToken ? '生成中…' : '生成免密临时链接' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="downloadPng">
            保存二维码 PNG
          </button>
          <a class="btn btn-ghost" :href="displayUrl" target="_blank" rel="noopener">新窗口打开</a>
        </div>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.qr-dialog {
  padding: 0;
  border: none;
  background: transparent;
  width: min(420px, calc(100vw - 32px));
  color: var(--text);
}

.qr-dialog::backdrop {
  background: var(--overlay-bg);
  backdrop-filter: blur(6px);
}

.qr-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.qr-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 18px;
  border-bottom: 1px solid var(--border);
}

.qr-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
}

.qr-sub {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--text-muted);
  word-break: break-all;
}

.qr-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow-y: auto;
}

.qr-frame {
  padding: 14px;
  background: var(--qr-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--qr-border);
}

.qr-svg {
  width: 220px;
  height: 220px;
  display: block;
}

.qr-bg {
  fill: var(--qr-bg);
}

.qr-fg {
  fill: var(--qr-fg);
}

.qr-error {
  padding: 16px;
  color: var(--danger);
  font-size: 13px;
}

.qr-url-row {
  width: 100%;
  display: flex;
  gap: 8px;
}

.qr-actions {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>

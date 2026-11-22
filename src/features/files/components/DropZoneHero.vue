<script setup lang="ts">
import { computed } from 'vue'
import { CloudUpload } from '@lucide/vue'
import { encodeQr } from '../../../lib/qr/encode-qr'

const { shareUrl } = defineProps<{
  shareUrl: string
}>()

const emit = defineEmits<{
  pickFile: []
  pickFolder: []
  openQr: []
}>()

const miniQr = computed(() => {
  try {
    return encodeQr(shareUrl, 1)
  } catch {
    return null
  }
})

function onAreaClick(event: MouseEvent): void {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('button')) return
  emit('pickFile')
}
</script>

<template>
  <div class="bento-hero">
    <div
      class="dropzone-card"
      role="button"
      tabindex="0"
      aria-label="拖拽或点击选择文件上传"
      @click="onAreaClick"
      @keydown.enter.self="emit('pickFile')"
      @keydown.space.self.prevent="emit('pickFile')"
    >
      <div class="dropzone-left">
        <span class="dropzone-badge" aria-hidden="true">
          <CloudUpload :size="22" :stroke-width="1.6" />
        </span>
        <div class="dropzone-text">
          <div class="dropzone-title">拖入文件或文件夹上传，或按 <kbd>Ctrl+V</kbd> 粘贴</div>
          <div class="dropzone-sub">直传当前目录 · 实时显示进度与速率 · 断网可续传</div>
        </div>
      </div>

      <div class="dropzone-btns">
        <button type="button" class="btn btn-primary" @click="emit('pickFile')">选择文件</button>
        <button type="button" class="btn btn-secondary" @click="emit('pickFolder')">
          传文件夹
        </button>
      </div>
    </div>

    <button
      type="button"
      class="qr-hero-card"
      aria-label="放大当前目录二维码"
      @click="emit('openQr')"
    >
      <span v-if="miniQr" class="mini-qr" aria-hidden="true">
        <svg :viewBox="miniQr.viewBox" shape-rendering="crispEdges">
          <rect width="100%" height="100%" class="qr-bg" />
          <path :d="miniQr.path" class="qr-fg" />
        </svg>
      </span>
      <span class="qr-hero-info">
        <span class="qr-hero-title">扫码打开目录</span>
        <span class="qr-hero-sub">手机直连互传</span>
        <span class="qr-hero-link">放大 / 复制 &rarr;</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.bento-hero {
  display: grid;
  grid-template-columns: 1fr 224px;
  gap: 14px;
  margin-bottom: 16px;
}

.dropzone-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-radius: var(--radius-lg);
  border: 1.5px dashed var(--border-strong);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    border-color var(--duration-base) var(--ease-standard),
    box-shadow var(--duration-base) var(--ease-standard),
    background-color var(--duration-base) var(--ease-standard);
}

.dropzone-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
}

.dropzone-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.dropzone-badge {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--duration-base) var(--ease-out);
}

.dropzone-card:hover .dropzone-badge {
  transform: translateY(-2px);
}

.dropzone-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}

.dropzone-title kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  padding: 1px 5px;
  border-radius: var(--radius-xs);
}

.dropzone-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 3px;
}

.dropzone-btns {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.qr-hero-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
  text-align: left;
  transition:
    border-color var(--duration-base) var(--ease-standard),
    transform var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-standard);
}

.qr-hero-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.qr-hero-card:active {
  transform: translateY(0) scale(0.99);
}

.mini-qr {
  width: 60px;
  height: 60px;
  padding: 4px;
  background: var(--qr-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--qr-border);
  flex-shrink: 0;
  transition: transform var(--duration-base) var(--ease-out);
}

.qr-hero-card:hover .mini-qr {
  transform: scale(1.03);
}

.mini-qr svg {
  width: 100%;
  height: 100%;
  display: block;
}

.qr-bg {
  fill: var(--qr-bg);
}

.qr-fg {
  fill: var(--qr-fg);
}

.qr-hero-info {
  display: flex;
  flex-direction: column;
}

.qr-hero-title {
  font-weight: 650;
  font-size: 13px;
  color: var(--text);
}

.qr-hero-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 1px;
}

.qr-hero-link {
  font-size: 11.5px;
  color: var(--accent);
  font-weight: 500;
  margin-top: 4px;
}

@media (width <= 900px) {
  .bento-hero {
    grid-template-columns: 1fr;
  }

  .qr-hero-card {
    display: none;
  }
}

@media (width <= 640px) {
  .dropzone-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }
}
</style>

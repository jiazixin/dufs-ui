<script setup lang="ts">
import { Download, Pencil, QrCode, Trash2 } from '@lucide/vue'
import { formatBytes, formatDirCount } from '../../../lib/format/format-bytes'
import { formatShortDate } from '../../../lib/format/format-date'
import { demoContentStore } from '../dufs-data'
import { detectFileKind, isDirItem } from '../file-types'
import type { PathItem } from '../types'
import FileIcon from './FileIcon.vue'

const { items, allowArchive, isDemo, getItemUrl } = defineProps<{
  items: readonly PathItem[]
  allowArchive: boolean
  isDemo: boolean
  getItemUrl: (item: PathItem) => string
}>()

const emit = defineEmits<{
  preview: [item: PathItem]
  download: [item: PathItem]
  qr: [item: PathItem]
  move: [item: PathItem]
  delete: [item: PathItem]
  demoDirClick: [item: PathItem]
}>()

function getThumbUrl(item: PathItem): string | null {
  if (isDirItem(item) || detectFileKind(item) !== 'image') return null
  if (isDemo) {
    return demoContentStore.get(item.name)?.url ?? null
  }
  return getItemUrl(item)
}

function handleCardOpen(item: PathItem): void {
  if (isDirItem(item)) {
    if (isDemo) {
      emit('demoDirClick', item)
    } else {
      window.location.href = getItemUrl(item)
    }
    return
  }
  emit('preview', item)
}
</script>

<template>
  <div class="grid-view">
    <div v-for="item in items" :key="item.name" class="grid-card">
      <div
        class="grid-thumb"
        role="button"
        tabindex="0"
        :aria-label="`打开 ${item.name}`"
        @click="handleCardOpen(item)"
        @keydown.enter="handleCardOpen(item)"
      >
        <img
          v-if="getThumbUrl(item)"
          :src="getThumbUrl(item) ?? ''"
          :alt="item.name"
          loading="lazy"
        />
        <FileIcon v-else :item="item" :size="34" />

        <div class="grid-overlay-actions" @click.stop>
          <button
            type="button"
            class="icon-btn-sm overlay-btn"
            :aria-label="`二维码分享 ${item.name}`"
            title="二维码分享"
            @click="emit('qr', item)"
          >
            <QrCode :size="14" :stroke-width="1.7" />
          </button>
          <button
            v-if="!isDirItem(item) || allowArchive"
            type="button"
            class="icon-btn-sm overlay-btn"
            :aria-label="`下载 ${item.name}`"
            title="下载"
            @click="emit('download', item)"
          >
            <Download :size="14" :stroke-width="1.7" />
          </button>
          <button
            v-if="item.allow_upload && item.allow_delete"
            type="button"
            class="icon-btn-sm overlay-btn"
            :aria-label="`重命名或移动 ${item.name}`"
            title="重命名 / 移动"
            @click="emit('move', item)"
          >
            <Pencil :size="14" :stroke-width="1.7" />
          </button>
          <button
            v-if="item.allow_delete"
            type="button"
            class="icon-btn-sm overlay-btn is-danger"
            :aria-label="`删除 ${item.name}`"
            title="删除"
            @click="emit('delete', item)"
          >
            <Trash2 :size="14" :stroke-width="1.7" />
          </button>
        </div>
      </div>

      <div class="grid-info">
        <button type="button" class="grid-name" :title="item.name" @click="handleCardOpen(item)">
          {{ item.name }}
        </button>
        <div class="grid-meta">
          <span>{{ isDirItem(item) ? formatDirCount(item.size) : formatBytes(item.size) }}</span>
          <span>{{ formatShortDate(item.mtime) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(172px, 1fr));
  gap: 14px;
  padding: 16px 16px 24px;
}

.grid-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform var(--duration-base) var(--ease-out),
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-base) var(--ease-standard);
}

.grid-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.grid-card:active {
  transform: translateY(-1px) scale(0.99);
}

.grid-thumb {
  height: 118px;
  background: var(--bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.grid-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform var(--duration-slow) var(--ease-out);
}

.grid-card:hover .grid-thumb img {
  transform: scale(1.03);
}

.grid-thumb :deep(.file-icon-thin) {
  transition: transform var(--duration-base) var(--ease-out);
}

.grid-card:hover .grid-thumb :deep(.file-icon-thin) {
  transform: scale(1.07);
}

.grid-overlay-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateY(-2px);
  transition:
    opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-out);
}

.grid-card:hover .grid-overlay-actions,
.grid-card:focus-within .grid-overlay-actions {
  opacity: 1;
  transform: translateY(0);
}

.overlay-btn {
  width: 28px;
  height: 28px;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
}

.grid-info {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.grid-name {
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  font-weight: 500;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-meta {
  font-size: 11.5px;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
}

@media (width <= 640px) {
  .grid-view {
    grid-template-columns: repeat(auto-fill, minmax(144px, 1fr));
    gap: 10px;
    padding: 12px 12px 20px;
  }

  .grid-overlay-actions {
    top: 6px;
    right: 6px;
    gap: 3px;
    opacity: 1;
    transform: translateY(0);
  }

  .overlay-btn {
    width: 26px;
    height: 26px;
  }
}
</style>

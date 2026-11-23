<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Link2,
  Pencil,
  QrCode,
  Trash2,
} from '@lucide/vue'
import { formatBytes, formatDirCount } from '../../../lib/format/format-bytes'
import { formatDateTime } from '../../../lib/format/format-date'
import { isDirItem } from '../file-types'
import type { PathItem, SortField, SortOrder } from '../types'
import FileIcon from './FileIcon.vue'

const { items, sortField, sortOrder, allowArchive, isDemo, getItemUrl } = defineProps<{
  items: readonly PathItem[]
  sortField: SortField
  sortOrder: SortOrder
  allowArchive: boolean
  isDemo: boolean
  getItemUrl: (item: PathItem) => string
}>()

const emit = defineEmits<{
  sort: [field: SortField]
  preview: [item: PathItem]
  download: [item: PathItem]
  qr: [item: PathItem]
  copyLink: [item: PathItem]
  move: [item: PathItem]
  delete: [item: PathItem]
  demoDirClick: [item: PathItem]
}>()

function ariaSortFor(field: SortField): 'ascending' | 'descending' | 'none' {
  if (sortField !== field) return 'none'
  return sortOrder === 'asc' ? 'ascending' : 'descending'
}

function handleNameClick(event: MouseEvent, item: PathItem): void {
  if (isDirItem(item)) {
    if (isDemo) {
      event.preventDefault()
      emit('demoDirClick', item)
    }
    return
  }
  event.preventDefault()
  emit('preview', item)
}
</script>

<template>
  <div class="list-view" role="table" aria-label="文件列表">
    <div class="list-head" role="row">
      <div class="col-name" role="columnheader" :aria-sort="ariaSortFor('name')">
        <button
          type="button"
          class="sort-btn"
          :class="{ 'is-active': sortField === 'name' }"
          @click="emit('sort', 'name')"
        >
          <span>名称</span>
          <ArrowUp
            v-if="sortField === 'name' && sortOrder === 'asc'"
            :size="13"
            :stroke-width="2"
            aria-hidden="true"
          />
          <ArrowDown
            v-else-if="sortField === 'name' && sortOrder === 'desc'"
            :size="13"
            :stroke-width="2"
            aria-hidden="true"
          />
          <ArrowUpDown v-else :size="13" :stroke-width="1.7" class="sort-idle" aria-hidden="true" />
        </button>
      </div>

      <div class="col-mtime" role="columnheader" :aria-sort="ariaSortFor('mtime')">
        <button
          type="button"
          class="sort-btn"
          :class="{ 'is-active': sortField === 'mtime' }"
          @click="emit('sort', 'mtime')"
        >
          <span>修改时间</span>
          <ArrowUp
            v-if="sortField === 'mtime' && sortOrder === 'asc'"
            :size="13"
            :stroke-width="2"
            aria-hidden="true"
          />
          <ArrowDown
            v-else-if="sortField === 'mtime' && sortOrder === 'desc'"
            :size="13"
            :stroke-width="2"
            aria-hidden="true"
          />
          <ArrowUpDown v-else :size="13" :stroke-width="1.7" class="sort-idle" aria-hidden="true" />
        </button>
      </div>

      <div class="col-size" role="columnheader" :aria-sort="ariaSortFor('size')">
        <button
          type="button"
          class="sort-btn"
          :class="{ 'is-active': sortField === 'size' }"
          @click="emit('sort', 'size')"
        >
          <span>大小</span>
          <ArrowUp
            v-if="sortField === 'size' && sortOrder === 'asc'"
            :size="13"
            :stroke-width="2"
            aria-hidden="true"
          />
          <ArrowDown
            v-else-if="sortField === 'size' && sortOrder === 'desc'"
            :size="13"
            :stroke-width="2"
            aria-hidden="true"
          />
          <ArrowUpDown v-else :size="13" :stroke-width="1.7" class="sort-idle" aria-hidden="true" />
        </button>
      </div>

      <div class="col-actions" role="columnheader">操作</div>
    </div>

    <div class="list-body" role="rowgroup">
      <div v-for="item in items" :key="item.name" class="file-row" role="row">
        <div class="file-main" role="cell">
          <FileIcon :item="item" :size="20" />
          <div class="file-name-wrap">
            <a
              class="file-name"
              :href="getItemUrl(item)"
              :title="item.name"
              @click="handleNameClick($event, item)"
            >
              {{ item.name }}
            </a>
            <span v-if="item.path_type.startsWith('Symlink')" class="symlink-tag">链接</span>
          </div>
        </div>

        <div class="file-mtime" role="cell">{{ formatDateTime(item.mtime) }}</div>

        <div class="file-size" role="cell">
          {{ isDirItem(item) ? formatDirCount(item.size) : formatBytes(item.size) }}
        </div>

        <div class="file-actions" role="cell">
          <button
            v-if="!isDirItem(item) || allowArchive"
            type="button"
            class="icon-btn-sm"
            :aria-label="`下载 ${item.name}`"
            :title="isDirItem(item) ? '打包下载 ZIP' : '下载文件'"
            @click="emit('download', item)"
          >
            <Download :size="15" :stroke-width="1.7" />
          </button>

          <button
            type="button"
            class="icon-btn-sm"
            :aria-label="`二维码分享 ${item.name}`"
            title="二维码分享"
            @click="emit('qr', item)"
          >
            <QrCode :size="15" :stroke-width="1.7" />
          </button>

          <button
            type="button"
            class="icon-btn-sm"
            :aria-label="`复制 ${item.name} 链接`"
            title="复制直链"
            @click="emit('copyLink', item)"
          >
            <Link2 :size="15" :stroke-width="1.7" />
          </button>

          <button
            v-if="item.allow_upload && item.allow_delete"
            type="button"
            class="icon-btn-sm"
            :aria-label="`重命名或移动 ${item.name}`"
            title="重命名 / 移动"
            @click="emit('move', item)"
          >
            <Pencil :size="15" :stroke-width="1.7" />
          </button>

          <button
            v-if="item.allow_delete"
            type="button"
            class="icon-btn-sm is-danger"
            :aria-label="`删除 ${item.name}`"
            title="删除"
            @click="emit('delete', item)"
          >
            <Trash2 :size="15" :stroke-width="1.7" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Compact Name column brings mtime / size / actions forward; all 3 centered */
.list-head,
.file-row {
  display: grid;
  grid-template-columns: minmax(190px, 420px) 168px 112px minmax(168px, 1fr);
  align-items: center;
  padding: 10px 18px;
}

.list-head {
  border-bottom: 1px solid var(--border);
  background: var(--bg-subtle);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  user-select: none;
}

.col-name {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.col-mtime,
.col-size,
.col-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  margin: -4px -8px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  transition:
    background-color var(--duration-fast) ease,
    color var(--duration-fast) ease;
}

.sort-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.sort-btn.is-active {
  color: var(--text);
}

.sort-idle {
  opacity: 0.5;
}

.file-row {
  padding-top: 11px;
  padding-bottom: 11px;
  border-bottom: 1px solid var(--border);
  transition: background-color var(--duration-fast) var(--ease-standard);
}

.file-row:last-child {
  border-bottom: none;
}

.file-row:hover {
  background: var(--bg-hover);
}

.file-main {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  padding-right: 12px;
}

.file-main :deep(.file-icon-thin) {
  transition: transform var(--duration-fast) var(--ease-out);
}

.file-row:hover .file-main :deep(.file-icon-thin) {
  transform: scale(1.06);
}

.file-name-wrap {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-name {
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-name:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.symlink-tag {
  font-size: 10.5px;
  padding: 1px 5px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.file-mtime {
  font-size: 12.5px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  text-align: center;
  white-space: nowrap;
}

.file-size {
  font-size: 12.5px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  text-align: center;
  white-space: nowrap;
}

.file-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  opacity: 0.72;
  transition: opacity var(--duration-fast) var(--ease-standard);
}

.file-row:hover .file-actions {
  opacity: 1;
}

@media (width <= 900px) {
  .list-head,
  .file-row {
    grid-template-columns: minmax(140px, 1fr) 84px 168px;
  }

  .col-mtime,
  .file-mtime {
    display: none;
  }
}

@media (width <= 640px) {
  .list-head {
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 9px 12px;
  }

  .col-actions {
    display: none;
  }

  .file-row {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 4px 10px;
    padding: 10px 12px;
  }

  .file-main {
    grid-column: 1;
    grid-row: 1 / 3;
    align-self: center;
    padding-right: 0;
  }

  .file-size {
    grid-column: 2;
    grid-row: 1;
    text-align: right;
  }

  .file-actions {
    grid-column: 2;
    grid-row: 2;
    justify-content: flex-end;
    gap: 2px;
    margin-right: -6px;
    opacity: 1;
  }
}
</style>

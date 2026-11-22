<script setup lang="ts">
import { ChevronDown, X } from '@lucide/vue'
import { formatBytes } from '../../../lib/format/format-bytes'
import { formatDuration } from '../../../lib/format/format-date'
import type { UploadTask } from '../types'

const { tasks, isCollapsed, activeCount, doneCount, overallPercent } = defineProps<{
  tasks: readonly UploadTask[]
  isCollapsed: boolean
  activeCount: number
  doneCount: number
  overallPercent: number
}>()

const emit = defineEmits<{
  toggleCollapse: []
  clearCompleted: []
  close: []
  cancel: [taskId: number]
  retry: [taskId: number]
  qr: [task: UploadTask]
  copyLink: [task: UploadTask]
}>()

function taskPercent(task: UploadTask): number {
  if (task.state === 'done') return 100
  if (task.total <= 0) return 0
  return Math.min(100, Math.round((task.loaded / task.total) * 100))
}

function taskLeftText(task: UploadTask): string {
  switch (task.state) {
    case 'queued':
      return '等待队列中…'
    case 'done':
      return `已完成 · ${formatBytes(task.total)}`
    case 'canceled':
      return '已取消'
    case 'error':
      return task.errorText || '上传失败'
    case 'uploading':
      return `${formatBytes(task.loaded)} / ${formatBytes(task.total)}`
  }
}

function taskRightText(task: UploadTask): string {
  if (task.state === 'done') return '100%'
  if (task.state !== 'uploading') return ''
  const pct = `${String(taskPercent(task))}%`
  const speed = task.speed > 0 ? `${formatBytes(task.speed)}/s` : '计算中'
  const eta = Number.isFinite(task.eta) && task.eta > 0 ? ` · ${formatDuration(task.eta)}` : ''
  return `${pct} · ${speed}${eta}`
}
</script>

<template>
  <Transition name="panel-slide">
    <aside
      v-if="tasks.length > 0"
      class="upload-panel"
      :class="{ 'is-collapsed': isCollapsed }"
      aria-label="上传队列"
    >
      <div class="panel-header">
        <button
          type="button"
          class="panel-title-btn"
          :aria-expanded="!isCollapsed"
          @click="emit('toggleCollapse')"
        >
          <span class="spinner" :class="{ 'is-done': activeCount === 0 }" aria-hidden="true" />
          <span class="panel-title">
            {{ activeCount > 0 ? `正在上传 (${String(activeCount)})` : '上传完成' }}
          </span>
          <span class="panel-summary">
            {{ doneCount }}/{{ tasks.length }} · {{ overallPercent }}%
          </span>
        </button>

        <div class="panel-controls">
          <button
            v-if="doneCount > 0"
            type="button"
            class="text-btn"
            @click="emit('clearCompleted')"
          >
            清除
          </button>
          <button
            type="button"
            class="mini-icon-btn"
            aria-label="展开或收起上传队列"
            @click="emit('toggleCollapse')"
          >
            <ChevronDown :size="14" :stroke-width="2" class="chevron" />
          </button>
          <button
            type="button"
            class="mini-icon-btn"
            aria-label="关闭上传面板"
            @click="emit('close')"
          >
            <X :size="14" :stroke-width="2" />
          </button>
        </div>
      </div>

      <div class="overall-bar">
        <div class="overall-fill" :style="{ width: `${String(overallPercent)}%` }" />
      </div>

      <div
        class="upload-list-collapse"
        :class="{ 'is-open': !isCollapsed }"
        :aria-hidden="isCollapsed"
      >
        <div class="upload-list-collapse-inner">
          <TransitionGroup name="queue-item" tag="div" class="upload-list">
            <div v-for="task in tasks" :key="task.id" class="upload-item">
              <div class="item-top">
                <span class="item-name" :title="task.name">{{ task.name }}</span>
                <div class="item-actions">
                  <button
                    v-if="task.state === 'uploading' || task.state === 'queued'"
                    type="button"
                    class="text-btn"
                    @click="emit('cancel', task.id)"
                  >
                    取消
                  </button>
                  <button
                    v-if="task.state === 'error' || task.state === 'canceled'"
                    type="button"
                    class="text-btn"
                    @click="emit('retry', task.id)"
                  >
                    续传重试
                  </button>
                  <template v-if="task.state === 'done'">
                    <button type="button" class="text-btn" @click="emit('qr', task)">二维码</button>
                    <button type="button" class="text-btn" @click="emit('copyLink', task)">
                      复制
                    </button>
                  </template>
                </div>
              </div>

              <div class="item-bar">
                <div
                  class="item-bar-fill"
                  :class="`is-${task.state}`"
                  :style="{ width: `${String(taskPercent(task))}%` }"
                />
              </div>

              <div class="item-meta">
                <span :class="{ 'is-error': task.state === 'error' }">{{
                  taskLeftText(task)
                }}</span>
                <span>{{ taskRightText(task) }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.upload-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: min(410px, calc(100vw - 24px));
  z-index: 55;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border);
}

.panel-title-btn {
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  text-align: left;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--border-strong);
  border-top-color: var(--accent);
  border-radius: var(--radius-pill);
  animation: upload-spin 0.75s linear infinite;
  flex-shrink: 0;
  transition:
    background-color var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard);
}

.spinner.is-done {
  animation: none;
  border-color: var(--success);
  background: var(--success);
}

@keyframes upload-spin {
  to {
    transform: rotate(360deg);
  }
}

.panel-title {
  font-weight: 600;
  font-size: 13px;
}

.panel-summary {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.panel-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-btn,
.mini-icon-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

.text-btn:hover,
.mini-icon-btn:hover {
  background: var(--hover-tint);
  color: var(--text);
}

.chevron {
  transition: transform var(--duration-base) var(--ease-out);
}

.is-collapsed .chevron {
  transform: rotate(180deg);
}

.overall-bar {
  height: 3px;
  background: var(--border);
}

.overall-fill {
  height: 100%;
  background: var(--accent);
  transition: width var(--duration-base) var(--ease-standard);
}

.upload-list-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  visibility: hidden;
  transition:
    grid-template-rows var(--duration-base) var(--ease-out),
    opacity var(--duration-fast) var(--ease-standard),
    visibility 0s linear var(--duration-base);
}

.upload-list-collapse.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  visibility: visible;
  transition:
    grid-template-rows var(--duration-base) var(--ease-out),
    opacity var(--duration-fast) var(--ease-standard),
    visibility 0s linear 0s;
}

.upload-list-collapse-inner {
  overflow: hidden;
  min-height: 0;
}

.upload-list {
  max-height: 290px;
  overflow-y: auto;
}

.upload-item {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-item:last-child {
  border-bottom: none;
}

.item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-name {
  font-size: 12.5px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.item-bar {
  height: 5px;
  border-radius: var(--radius-pill);
  background: var(--bg-subtle);
  overflow: hidden;
}

.item-bar-fill {
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--accent);
  transition:
    width var(--duration-fast) linear,
    background-color var(--duration-base) var(--ease-standard);
}

.item-bar-fill.is-done {
  background: var(--success);
}

.item-bar-fill.is-error {
  background: var(--danger);
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.is-error {
  color: var(--danger);
}

.panel-slide-enter-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.panel-slide-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-in),
    transform var(--duration-fast) var(--ease-in);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.98);
}

.queue-item-enter-active,
.queue-item-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-out);
}

.queue-item-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.queue-item-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.queue-item-move {
  transition: transform var(--duration-base) var(--ease-out);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ChevronUp,
  CloudUpload,
  Download,
  FilePlus,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
} from '@lucide/vue'
import { showToast } from './app/toast'
import AppDialog from './components/AppDialog.vue'
import AppHeader from './components/AppHeader.vue'
import AppToast from './components/AppToast.vue'
import { copyToClipboard } from './features/files/clipboard'
import DropZoneHero from './features/files/components/DropZoneHero.vue'
import FileGridView from './features/files/components/FileGridView.vue'
import FileListTable from './features/files/components/FileListTable.vue'
import PreviewModal from './features/files/components/PreviewModal.vue'
import QrShareModal from './features/files/components/QrShareModal.vue'
import StandaloneEditor from './features/files/components/StandaloneEditor.vue'
import UploadQueuePanel from './features/files/components/UploadQueuePanel.vue'
import { isDirItem } from './features/files/file-types'
import type { PathItem, QrTarget, UploadTask } from './features/files/types'
import { useFileBrowser } from './features/files/use-file-browser'
import { useUploadQueue } from './features/files/use-upload-queue'
import { formatBytes } from './lib/format/format-bytes'
import { ensureTrailingSlash, getBaseName } from './lib/url'

const DROPZONE_KEY = 'dufs_ui_dropzone'

const browser = useFileBrowser()
const {
  isDemo,
  data,
  user,
  searchQuery,
  sortField,
  sortOrder,
  viewMode,
  isLoading,
  loadError,
  currentBaseUrl,
  visiblePaths,
  statsSummary,
  getItemUrl,
  getRelativeUrl,
} = browser

const isDropzoneOpen = ref(window.localStorage.getItem(DROPZONE_KEY) !== '0')
const fileInputRef = ref<HTMLInputElement | null>(null)
const folderInputRef = ref<HTMLInputElement | null>(null)
const previewItem = ref<PathItem | null>(null)
const qrTarget = ref<QrTarget | null>(null)

const upload = useUploadQueue({
  isDemo,
  canUpload: () => data.value.kind === 'Index' && data.value.allow_upload,
  resolveUrl: (rel) => getRelativeUrl(rel),
  ensureAuth: () => browser.checkAuth(),
  onUploaded: (relPath, file) => {
    if (isDemo) {
      browser.addDemoUploadedItem(relPath, file)
    } else {
      void browser.refreshList()
    }
  },
})

const previewSiblings = computed(() => visiblePaths.value.filter((item) => !isDirItem(item)))

const statsLabel = computed(() => {
  const { total, dirCount, fileCount, totalSize } = statsSummary.value
  if (total === 0) return '0 项'
  const parts: string[] = []
  if (dirCount > 0) parts.push(`${String(dirCount)} 文件夹`)
  parts.push(`${String(fileCount)} 文件`)
  if (totalSize > 0) parts.push(formatBytes(totalSize))
  return parts.join(' · ')
})

const emptyTitle = computed(() => {
  if (searchQuery.value.trim()) return '没有找到匹配的文件'
  return data.value.dir_exists ? '当前目录为空' : '上传文件后将自动创建此目录'
})

function toggleDropzone(): void {
  isDropzoneOpen.value = !isDropzoneOpen.value
  window.localStorage.setItem(DROPZONE_KEY, isDropzoneOpen.value ? '1' : '0')
}

function triggerFilePick(): void {
  const input = fileInputRef.value
  if (!input) return
  input.value = ''
  input.click()
}

function triggerFolderPick(): void {
  const input = folderInputRef.value
  if (!input) return
  input.value = ''
  input.click()
}

function handleFileInputChange(event: Event): void {
  const input = event.target as HTMLInputElement
  for (const file of Array.from(input.files ?? [])) {
    upload.enqueue(file, [])
  }
}

function handleFolderInputChange(event: Event): void {
  const input = event.target as HTMLInputElement
  for (const file of Array.from(input.files ?? [])) {
    const rel = file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(0, -1) : []
    upload.enqueue(file, rel)
  }
}

async function handleCreateFile(): Promise<void> {
  const created = await browser.createFile()
  if (created) {
    previewItem.value = created
  }
}

function handleDownloadItem(item: PathItem): void {
  const url = getItemUrl(item)
  if (isDirItem(item)) {
    void browser.triggerDownload(`${ensureTrailingSlash(url)}?zip`, `${item.name}.zip`)
    return
  }
  void browser.triggerDownload(url, item.name)
}

function handleDownloadFolderZip(): void {
  const folderName = getBaseName(currentBaseUrl.value)
  const zipName = folderName === '/' ? 'archive.zip' : `${folderName}.zip`
  void browser.triggerDownload(`${ensureTrailingSlash(currentBaseUrl.value)}?zip`, zipName)
}

function openItemQr(item: PathItem): void {
  qrTarget.value = {
    title: item.name,
    url: getItemUrl(item),
    allowToken: !isDirItem(item),
  }
}

function openFolderQr(): void {
  qrTarget.value = {
    title: data.value.href === '/' ? '根目录' : getBaseName(data.value.href),
    url: currentBaseUrl.value,
    allowToken: false,
  }
}

function openUploadTaskQr(task: UploadTask): void {
  qrTarget.value = {
    title: task.name,
    url: task.url,
    allowToken: true,
  }
}

function handleDemoDirClick(item: PathItem): void {
  showToast(`演示模式：文件夹「${item.name}」（连接 dufs 后可直接进入）`)
}
</script>

<template>
  <div v-if="upload.isDragOver.value" class="drag-overlay" aria-hidden="true">
    <div class="drag-card">
      <div class="drag-icon">
        <CloudUpload :size="38" :stroke-width="1.6" />
      </div>
      <div class="drag-title">松开鼠标即可上传到当前目录</div>
      <div class="drag-sub">支持多文件与整个文件夹，自动保留目录结构</div>
    </div>
  </div>

  <AppHeader
    v-model:search-query="searchQuery"
    :href="data.href"
    :uri-prefix="data.uri_prefix"
    :allow-search="data.allow_search && data.kind === 'Index'"
    :auth="data.auth"
    :user="user"
    :is-demo="isDemo"
    @open-folder-qr="openFolderQr"
    @login="void browser.login()"
    @logout="void browser.logout()"
  />

  <main class="container">
    <section v-if="data.kind === 'Index'">
      <DropZoneHero
        v-if="data.allow_upload && isDropzoneOpen"
        :share-url="currentBaseUrl"
        @pick-file="triggerFilePick"
        @pick-folder="triggerFolderPick"
        @open-qr="openFolderQr"
      />

      <input ref="fileInputRef" type="file" multiple hidden @change="handleFileInputChange" />
      <input
        ref="folderInputRef"
        type="file"
        webkitdirectory
        directory
        multiple
        hidden
        @change="handleFolderInputChange"
      />

      <div class="action-bar">
        <div class="action-group">
          <span class="stats-pill">{{ statsLabel }}</span>
          <template v-if="data.allow_upload">
            <button type="button" class="btn btn-secondary" @click="void browser.createFolder()">
              <FolderPlus :size="14" :stroke-width="1.8" />
              <span>新建文件夹</span>
            </button>
            <button type="button" class="btn btn-secondary" @click="void handleCreateFile()">
              <FilePlus :size="14" :stroke-width="1.8" />
              <span class="hide-sm">新建文本</span>
            </button>
          </template>
        </div>

        <div class="action-group">
          <button
            v-if="data.allow_archive"
            type="button"
            class="btn btn-secondary"
            @click="handleDownloadFolderZip"
          >
            <Download :size="14" :stroke-width="1.8" />
            <span class="hide-sm">打包下载</span>
          </button>

          <button
            v-if="data.allow_upload"
            type="button"
            class="icon-btn"
            :class="{ 'is-rotated': !isDropzoneOpen }"
            :aria-label="isDropzoneOpen ? '收起顶部上传区' : '展开顶部上传区'"
            :title="isDropzoneOpen ? '收起顶部上传区' : '展开顶部上传区'"
            @click="toggleDropzone"
          >
            <ChevronUp :size="15" :stroke-width="1.8" />
          </button>

          <div class="segmented" role="group" aria-label="视图模式">
            <button
              type="button"
              class="seg-btn"
              :class="{ 'is-active': viewMode === 'list' }"
              aria-label="列表视图"
              title="列表视图"
              @click="browser.setViewMode('list')"
            >
              <List :size="15" :stroke-width="1.8" />
            </button>
            <button
              type="button"
              class="seg-btn"
              :class="{ 'is-active': viewMode === 'grid' }"
              aria-label="网格视图"
              title="网格视图"
              @click="browser.setViewMode('grid')"
            >
              <LayoutGrid :size="15" :stroke-width="1.8" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="loadError" class="alert-banner" role="alert">
        <span>{{ loadError }}</span>
        <button type="button" class="btn btn-secondary btn-xs" @click="void browser.refreshList()">
          重试
        </button>
      </div>

      <div class="surface">
        <div v-if="isLoading && visiblePaths.length === 0" class="state-box">正在加载目录…</div>

        <div v-else-if="visiblePaths.length === 0" class="state-box">
          <FolderOpen :size="40" :stroke-width="1.3" class="state-icon" aria-hidden="true" />
          <div class="state-title">{{ emptyTitle }}</div>
          <div class="state-sub">
            {{
              data.allow_upload ? '拖拽文件到页面或按 Ctrl+V 粘贴即可上传' : '此目录暂无可访问内容'
            }}
          </div>
        </div>

        <FileListTable
          v-else-if="viewMode === 'list'"
          :items="visiblePaths"
          :sort-field="sortField"
          :sort-order="sortOrder"
          :allow-archive="data.allow_archive"
          :is-demo="isDemo"
          :get-item-url="getItemUrl"
          @sort="browser.toggleSort"
          @preview="previewItem = $event"
          @download="handleDownloadItem"
          @qr="openItemQr"
          @copy-link="void copyToClipboard(getItemUrl($event), '下载链接已复制')"
          @move="void browser.moveItem($event)"
          @delete="void browser.deleteItem($event)"
          @demo-dir-click="handleDemoDirClick"
        />

        <FileGridView
          v-else
          :items="visiblePaths"
          :allow-archive="data.allow_archive"
          :is-demo="isDemo"
          :get-item-url="getItemUrl"
          @preview="previewItem = $event"
          @download="handleDownloadItem"
          @qr="openItemQr"
          @delete="void browser.deleteItem($event)"
          @demo-dir-click="handleDemoDirClick"
        />
      </div>
    </section>

    <StandaloneEditor
      v-else
      :data="data"
      @open-qr="(title, url) => (qrTarget = { title, url, allowToken: true })"
      @download="(url, name) => void browser.triggerDownload(url, name)"
    />
  </main>

  <UploadQueuePanel
    :tasks="upload.tasks.value"
    :is-collapsed="upload.isPanelCollapsed.value"
    :active-count="upload.activeCount.value"
    :done-count="upload.doneCount.value"
    :overall-percent="upload.overallPercent.value"
    @toggle-collapse="upload.toggleCollapse"
    @clear-completed="upload.clearCompleted"
    @close="upload.closePanel"
    @cancel="upload.cancelTask"
    @retry="void upload.retryTask($event)"
    @qr="openUploadTaskQr"
    @copy-link="void copyToClipboard($event.url, '文件直链已复制')"
  />

  <PreviewModal
    :item="previewItem"
    :siblings="previewSiblings"
    :is-demo="isDemo"
    :get-item-url="getItemUrl"
    @close="previewItem = null"
    @select="previewItem = $event"
    @download="handleDownloadItem"
    @qr="openItemQr"
    @saved="void browser.refreshList()"
  />

  <QrShareModal
    :target="qrTarget"
    :has-user="Boolean(user)"
    :is-demo="isDemo"
    :generate-token-url="browser.generateTokenUrl"
    @close="qrTarget = null"
  />

  <AppDialog />
  <AppToast />
</template>

<style scoped>
.container {
  max-width: 1040px;
  margin: 0 auto;
  padding: 18px 20px 72px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stats-pill {
  font-size: 12.5px;
  color: var(--text-muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-variant-numeric: tabular-nums;
}

.is-rotated svg {
  transform: rotate(180deg);
}

.segmented {
  display: inline-flex;
  align-items: center;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.seg-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  width: 30px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.seg-btn:hover {
  color: var(--text);
}

.seg-btn.is-active {
  background: var(--bg-elevated);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.alert-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 13px;
}

.state-box {
  padding: 68px 24px;
  text-align: center;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.state-icon {
  opacity: 0.45;
  margin-bottom: 4px;
}

.state-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.state-sub {
  font-size: 13px;
}

.drag-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: var(--overlay-bg);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.drag-card {
  width: min(460px, 100%);
  padding: 44px 32px;
  border-radius: var(--radius-xl);
  background: var(--bg-elevated);
  border: 2px dashed var(--accent);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.drag-icon {
  width: 66px;
  height: 66px;
  margin: 0 auto 14px;
  border-radius: var(--radius-lg);
  background: var(--accent-soft);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-title {
  font-size: 17px;
  font-weight: 650;
  margin-bottom: 6px;
}

.drag-sub {
  font-size: 13px;
  color: var(--text-muted);
}

@media (width <= 640px) {
  .container {
    padding: 12px 12px 80px;
  }

  .hide-sm {
    display: none;
  }
}
</style>

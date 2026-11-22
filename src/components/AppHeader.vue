<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Moon, QrCode, Search, Sun, X } from '@lucide/vue'
import { useTheme } from '../app/theme'
import BrandLogo from './BrandLogo.vue'

const {
  href,
  uriPrefix,
  allowSearch,
  auth,
  user,
  isDemo,
  qrLabel = '当前目录二维码分享',
} = defineProps<{
  href: string
  uriPrefix: string
  allowSearch: boolean
  auth: boolean
  user: string
  isDemo: boolean
  qrLabel?: string
}>()

const emit = defineEmits<{
  openFolderQr: []
  login: []
  logout: []
}>()

const searchQuery = defineModel<string>('searchQuery', { default: '' })

const { theme, toggleTheme } = useTheme()
const searchInputRef = ref<HTMLInputElement | null>(null)

type Crumb = {
  readonly label: string
  readonly path: string
  readonly isLast: boolean
}

const crumbs = computed<Crumb[]>(() => {
  if (href === '/') return []
  const parts = href.split('/').filter((segment) => segment.length > 0)
  let acc = uriPrefix || '/'
  return parts.map((label, index) => {
    if (!acc.endsWith('/')) acc += '/'
    acc += encodeURIComponent(label)
    return {
      label,
      path: `${acc}/`,
      isLast: index === parts.length - 1,
    }
  })
})

const hasSearchText = computed(() => searchQuery.value.trim().length > 0)

function clearSearch(): void {
  searchQuery.value = ''
  searchInputRef.value?.focus()
}

function handleKeydown(event: KeyboardEvent): void {
  if (!allowSearch) return
  const tag = document.activeElement?.tagName
  const isInInput = tag === 'INPUT' || tag === 'TEXTAREA'
  const isMetaK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
  const isSlash = event.key === '/' && !isInInput
  if (isMetaK || isSlash) {
    event.preventDefault()
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
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
  <header class="topbar">
    <div class="topbar-inner">
      <div class="topbar-left">
        <a :href="uriPrefix || '/'" class="brand" title="回到根目录">
          <BrandLogo :size="30" />
          <span class="brand-name">DropHub</span>
          <span v-if="isDemo" class="demo-tag">演示</span>
        </a>

        <nav v-if="crumbs.length > 0" class="breadcrumb" aria-label="路径导航">
          <span class="crumb-sep" aria-hidden="true">/</span>
          <template v-for="crumb in crumbs" :key="crumb.path">
            <span v-if="crumb.isLast" class="crumb-current" :title="crumb.label">
              {{ crumb.label }}
            </span>
            <a v-else class="crumb-item" :href="crumb.path" :title="crumb.label">
              {{ crumb.label }}
            </a>
            <span v-if="!crumb.isLast" class="crumb-sep" aria-hidden="true">/</span>
          </template>
        </nav>
      </div>

      <div v-if="allowSearch" class="topbar-center">
        <div class="search-box" role="search">
          <Search class="search-icon" :size="15" :stroke-width="1.8" aria-hidden="true" />
          <label class="sr-only" for="global-search">搜索当前目录文件</label>
          <input
            id="global-search"
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="搜索文件或文件夹…"
            autocomplete="off"
            maxlength="128"
          />
          <Transition name="search-tail" mode="out-in">
            <kbd v-if="!hasSearchText" key="kbd" class="search-kbd" aria-hidden="true">/</kbd>
            <button
              v-else
              key="clear"
              type="button"
              class="search-clear"
              aria-label="清除搜索"
              title="清除搜索"
              @click="clearSearch"
            >
              <X :size="14" :stroke-width="2" />
            </button>
          </Transition>
        </div>
      </div>

      <div class="topbar-right">
        <button
          type="button"
          class="icon-btn"
          :aria-label="theme === 'dark' ? '切换浅色模式' : '切换深色模式'"
          :title="theme === 'dark' ? '切换浅色模式' : '切换深色模式'"
          @click="toggleTheme"
        >
          <Transition name="theme-icon" mode="out-in">
            <Sun v-if="theme === 'dark'" key="sun" :size="16" :stroke-width="1.7" />
            <Moon v-else key="moon" :size="16" :stroke-width="1.7" />
          </Transition>
        </button>

        <button
          type="button"
          class="icon-btn"
          :aria-label="qrLabel"
          :title="qrLabel"
          @click="emit('openFolderQr')"
        >
          <QrCode :size="16" :stroke-width="1.7" />
        </button>

        <button v-if="auth && !user" type="button" class="btn btn-ghost" @click="emit('login')">
          登录
        </button>
        <button
          v-if="auth && user"
          type="button"
          class="btn btn-ghost"
          title="点击退出登录"
          @click="emit('logout')"
        >
          <span class="user-dot" aria-hidden="true" />
          <span>{{ user }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--bg-glass);
  backdrop-filter: blur(16px) saturate(160%);
  border-bottom: 1px solid var(--border);
  transition:
    background-color var(--duration-base) var(--ease-standard),
    border-color var(--duration-base) var(--ease-standard);
}

.topbar-inner {
  max-width: 1040px;
  margin: 0 auto;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  transition: opacity var(--duration-fast) var(--ease-standard);
}

.brand:hover {
  opacity: 0.84;
}

.brand-name {
  font-size: 15px;
}

.demo-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
  background: var(--bg-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 4px 2px;
  margin: -4px -2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.breadcrumb::-webkit-scrollbar {
  display: none;
}

.crumb-sep {
  color: var(--text-muted);
  font-size: 12px;
  flex-shrink: 0;
}

.crumb-item {
  color: var(--text-secondary);
  padding: 3px 7px;
  border-radius: var(--radius-xs);
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard);
}

.crumb-item:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.crumb-current {
  color: var(--text);
  font-weight: 600;
  padding: 3px 7px;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-center {
  flex: 0 1 280px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 11px;
  color: var(--text-muted);
  pointer-events: none;
  transition: color var(--duration-fast) var(--ease-standard);
}

.search-box:focus-within .search-icon {
  color: var(--text);
}

.search-box input {
  width: 100%;
  height: 34px;
  padding: 0 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  font-size: 13px;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard),
    background-color var(--duration-fast) var(--ease-standard);
}

.search-box input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
  outline: none;
}

.search-kbd {
  position: absolute;
  right: 9px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  padding: 0 5px;
  border-radius: var(--radius-xs);
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 5px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-out);
}

.search-clear:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.search-clear:active {
  transform: scale(0.9);
}

.search-tail-enter-active,
.search-tail-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-out);
}

.search-tail-enter-from,
.search-tail-leave-to {
  opacity: 0;
  transform: scale(0.84);
}

.theme-icon-enter-active,
.theme-icon-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-out);
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-24deg) scale(0.82);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(24deg) scale(0.82);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.user-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--success);
}

@media (width <= 900px) {
  .topbar-inner {
    flex-wrap: wrap;
    padding: 10px 14px;
  }

  .topbar-center {
    order: 3;
    flex: 1 0 100%;
  }
}
</style>

import { readonly, ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'dufs_ui_theme'

function detectInitialTheme(): ThemeMode {
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') {
    return saved
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<ThemeMode>(detectInitialTheme())

function syncDomTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', mode)
}

syncDomTheme(theme.value)

export function toggleTheme(): void {
  const next: ThemeMode = theme.value === 'dark' ? 'light' : 'dark'
  theme.value = next
  window.localStorage.setItem(STORAGE_KEY, next)
  syncDomTheme(next)
}

export function useTheme() {
  return {
    theme: readonly(theme),
    toggleTheme,
  }
}

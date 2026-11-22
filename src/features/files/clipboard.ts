import { showToast } from '../../app/toast'

function getAsyncClipboard(): Clipboard | undefined {
  const value: unknown = Reflect.get(navigator, 'clipboard')
  if (typeof value === 'object' && value !== null && 'writeText' in value) {
    return value as Clipboard
  }
  return undefined
}

export async function copyToClipboard(text: string, successMessage = '已复制'): Promise<void> {
  try {
    const clipboard = window.isSecureContext ? getAsyncClipboard() : undefined
    if (clipboard && typeof clipboard.writeText === 'function') {
      await clipboard.writeText(text)
    } else {
      const openDialogs = document.querySelectorAll('dialog[open]')
      const container = openDialogs[openDialogs.length - 1] ?? document.body
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      textarea.style.pointerEvents = 'none'
      container.appendChild(textarea)
      textarea.focus()
      textarea.select()
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- non-HTTPS LAN fallback when navigator.clipboard is unavailable
      const ok = document.execCommand('copy')
      textarea.remove()
      if (!ok) {
        throw new Error('execCommand copy failed')
      }
    }
    showToast(successMessage, 'success')
  } catch {
    showToast('复制失败，请手动复制', 'error')
  }
}

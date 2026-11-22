import { showToast } from '../../app/toast'

export async function copyToClipboard(text: string, successMessage = '已复制'): Promise<void> {
  try {
    if (window.isSecureContext && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- non-HTTPS LAN fallback when navigator.clipboard is unavailable
      document.execCommand('copy')
      textarea.remove()
    }
    showToast(successMessage, 'success')
  } catch {
    showToast('复制失败，请手动复制', 'error')
  }
}

import { readonly, ref } from 'vue'

export type ToastTone = 'default' | 'success' | 'error'

export type ToastItem = {
  readonly id: number
  readonly message: string
  readonly tone: ToastTone
}

const items = ref<ToastItem[]>([])
let seq = 0

export function showToast(message: string, tone: ToastTone = 'default'): void {
  const id = ++seq
  items.value = [...items.value, { id, message, tone }]
  window.setTimeout(() => {
    items.value = items.value.filter((item) => item.id !== id)
  }, 2600)
}

export function useToast() {
  return {
    items: readonly(items),
    showToast,
  }
}

import { readonly, ref } from 'vue'

export type DialogRequest = {
  readonly title: string
  readonly message?: string
  readonly mode: 'confirm' | 'prompt'
  readonly initialValue?: string
  readonly placeholder?: string
  readonly confirmText?: string
  readonly isDanger?: boolean
}

type ActiveDialog = DialogRequest & {
  readonly resolve: (value: string | boolean | null) => void
}

const activeDialog = ref<ActiveDialog | null>(null)

export function openConfirm(options: {
  title: string
  message: string
  confirmText?: string
  isDanger?: boolean
}): Promise<boolean> {
  return new Promise((resolve) => {
    activeDialog.value = {
      title: options.title,
      message: options.message,
      mode: 'confirm',
      confirmText: options.confirmText ?? '确定',
      isDanger: options.isDanger ?? false,
      resolve: (val) => {
        resolve(val === true)
      },
    }
  })
}

export function openPrompt(options: {
  title: string
  message?: string
  initialValue?: string
  placeholder?: string
  confirmText?: string
}): Promise<string | null> {
  return new Promise((resolve) => {
    activeDialog.value = {
      title: options.title,
      message: options.message,
      mode: 'prompt',
      initialValue: options.initialValue ?? '',
      placeholder: options.placeholder ?? '',
      confirmText: options.confirmText ?? '确定',
      isDanger: false,
      resolve: (val) => {
        resolve(typeof val === 'string' ? val : null)
      },
    }
  })
}

export function resolveDialog(value: string | boolean | null): void {
  const current = activeDialog.value
  activeDialog.value = null
  if (current) {
    current.resolve(value)
  }
}

export function useDialog() {
  return {
    activeDialog: readonly(activeDialog),
    openConfirm,
    openPrompt,
    resolveDialog,
  }
}

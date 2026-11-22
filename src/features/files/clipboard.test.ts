import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from './clipboard'

describe('copyToClipboard', () => {
  const originalSecureContext = Object.getOwnPropertyDescriptor(window, 'isSecureContext')
  const originalExecCommand = Object.getOwnPropertyDescriptor(document, 'execCommand')

  afterEach(() => {
    if (originalSecureContext) {
      Object.defineProperty(window, 'isSecureContext', originalSecureContext)
    }
    if (originalExecCommand) {
      Object.defineProperty(document, 'execCommand', originalExecCommand)
    } else {
      Reflect.deleteProperty(document, 'execCommand')
    }
    document.querySelectorAll('dialog').forEach((el) => {
      el.remove()
    })
    vi.restoreAllMocks()
  })

  it('falls back to execCommand inside open dialog on non-HTTPS HTTP origins', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true })

    const dialog = document.createElement('dialog')
    dialog.setAttribute('open', '')
    document.body.appendChild(dialog)

    let appendedInsideDialog = false
    const execCommand = vi.fn(() => {
      appendedInsideDialog = dialog.querySelector('textarea') !== null
      return true
    })
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
      writable: true,
    })

    await copyToClipboard('http://192.168.1.10:5000/notes.md')

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(appendedInsideDialog).toBe(true)
    expect(dialog.querySelector('textarea')).toBeNull()
  })
})

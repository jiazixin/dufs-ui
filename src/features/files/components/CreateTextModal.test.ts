import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import CreateTextModal from './CreateTextModal.vue'

beforeAll(() => {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '')
    }
  }
  if (typeof HTMLDialogElement.prototype.close !== 'function') {
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open')
    }
  }
})

describe('CreateTextModal', () => {
  it('validates filename and saves content via dedicated Save button', async () => {
    const user = userEvent.setup()
    const saveFile = vi.fn().mockResolvedValue(true)

    const view = render(CreateTextModal, {
      props: {
        isOpen: false,
        saveFile,
      },
    })

    await view.rerender({ isOpen: true, saveFile })

    // Saving with empty filename shows inline alert and does not call saveFile
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByRole('alert')).toHaveTextContent('请输入文件名')
    expect(saveFile).not.toHaveBeenCalled()

    // Enter filename and file content, then click Save
    await user.type(screen.getByLabelText('文件名'), '  notes.md  ')
    await user.type(screen.getByLabelText('文件内容'), 'hello dufs')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(saveFile).toHaveBeenCalledTimes(1)
    expect(saveFile).toHaveBeenCalledWith('notes.md', 'hello dufs', { checkOverwrite: true })
    expect(screen.getByText('已保存')).toBeInTheDocument()

    // Subsequent save on the same file skips overwrite prompt
    await user.type(screen.getByLabelText('文件内容'), '\nline 2')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(saveFile).toHaveBeenLastCalledWith('notes.md', 'hello dufs\nline 2', {
      checkOverwrite: false,
    })

    // Once saved, clicking 关闭 emits close directly
    await user.click(screen.getByRole('button', { name: '关闭' }))
    expect(view.emitted().close).toHaveLength(1)
  })

  it('rejects invalid path segments in filename', async () => {
    const user = userEvent.setup()
    const saveFile = vi.fn().mockResolvedValue(true)

    const view = render(CreateTextModal, {
      props: {
        isOpen: false,
        saveFile,
      },
    })

    await view.rerender({ isOpen: true, saveFile })
    await user.type(screen.getByLabelText('文件名'), '../escape.txt')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByRole('alert')).toHaveTextContent('无效路径片段')
    expect(saveFile).not.toHaveBeenCalled()
  })
})

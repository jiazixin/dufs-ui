import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import AppDialog from '../../../components/AppDialog.vue'
import type { PathItem } from '../types'
import PreviewModal from './PreviewModal.vue'

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

const UNKNOWN_TEXT_ITEM: PathItem = {
  path_type: 'File',
  name: 'Caddyfile',
  mtime: Date.now(),
  size: 256,
  allow_upload: true,
  allow_delete: true,
}

const READONLY_UNKNOWN_ITEM: PathItem = {
  path_type: 'File',
  name: 'hosts',
  mtime: Date.now(),
  size: 128,
  allow_upload: false,
  allow_delete: false,
}

const EDITABLE_TEXT_ITEM: PathItem = {
  path_type: 'File',
  name: 'notes.txt',
  mtime: Date.now(),
  size: 12,
  allow_upload: true,
  allow_delete: true,
}

describe('PreviewModal', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('offers standalone ?edit / ?view fallback links for unrecognized file types', async () => {
    const editableView = render(PreviewModal, {
      props: {
        item: null,
        siblings: [UNKNOWN_TEXT_ITEM],
        isDemo: false,
        getItemUrl: (target: PathItem) => `https://drop.example.com/${target.name}`,
      },
    })
    await editableView.rerender({
      item: UNKNOWN_TEXT_ITEM,
      siblings: [UNKNOWN_TEXT_ITEM],
      isDemo: false,
      getItemUrl: (target: PathItem) => `https://drop.example.com/${target.name}`,
    })

    expect(screen.getByRole('link', { name: '在线编辑打开' })).toHaveAttribute(
      'href',
      'https://drop.example.com/Caddyfile?edit',
    )
    editableView.unmount()

    const readonlyView = render(PreviewModal, {
      props: {
        item: null,
        siblings: [READONLY_UNKNOWN_ITEM],
        isDemo: false,
        getItemUrl: (target: PathItem) => `https://drop.example.com/${target.name}`,
      },
    })
    await readonlyView.rerender({
      item: READONLY_UNKNOWN_ITEM,
      siblings: [READONLY_UNKNOWN_ITEM],
      isDemo: false,
      getItemUrl: (target: PathItem) => `https://drop.example.com/${target.name}`,
    })

    expect(screen.getByRole('link', { name: '按文本打开' })).toHaveAttribute(
      'href',
      'https://drop.example.com/hosts?view',
    )
  })

  it('confirms before discarding unsaved edits and calls ensureAuth on save', async () => {
    const fetchMock = vi.fn().mockImplementation((_input: unknown, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return Promise.resolve(new Response(null, { status: 201 }))
      }
      return Promise.resolve(
        new Response('initial', {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const ensureAuth = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    const Host = {
      components: { PreviewModal, AppDialog },
      props: ['item', 'ensureAuth'],
      emits: ['close'],
      template: `
        <div>
          <PreviewModal
            :item="item"
            :siblings="item ? [item] : []"
            :is-demo="false"
            :get-item-url="(target) => 'https://drop.example.com/' + target.name"
            :ensure-auth="ensureAuth"
            @close="$emit('close')"
          />
          <AppDialog />
        </div>
      `,
    }

    const view = render(Host, {
      props: {
        item: null,
        ensureAuth,
      },
    })

    await view.rerender({ item: EDITABLE_TEXT_ITEM, ensureAuth })
    await screen.findByText('initial')

    await user.click(screen.getByRole('button', { name: '编辑' }))
    const editor = screen.getByLabelText('编辑文件内容')
    await user.type(editor, ' updated')

    await user.click(screen.getByRole('button', { name: '关闭预览' }))
    expect(await screen.findByText('放弃未保存的修改？')).toBeInTheDocument()
    expect(view.emitted().close).toBeUndefined()

    await user.click(screen.getByRole('button', { name: '关闭对话框' }))
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(ensureAuth).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://drop.example.com/notes.txt',
      expect.objectContaining({ method: 'PUT', body: 'initial updated' }),
    )
  })
})

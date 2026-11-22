import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DufsData } from '../types'
import StandaloneEditor from './StandaloneEditor.vue'

function makeEditorData(overrides: Partial<DufsData> = {}): DufsData {
  return {
    href: '/notes.txt',
    uri_prefix: '/',
    kind: 'Edit',
    paths: [],
    allow_upload: true,
    allow_delete: true,
    allow_search: true,
    allow_archive: true,
    auth: false,
    user: '',
    dir_exists: true,
    editable: true,
    ...overrides,
  }
}

describe('StandaloneEditor', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState(null, '', '/')
  })

  it('shows move, delete, and save actions in Edit mode and calls ensureAuth before saving', async () => {
    window.history.replaceState(null, '', '/notes.txt?edit')
    const fetchMock = vi.fn().mockImplementation((_input: unknown, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return Promise.resolve(new Response(null, { status: 201 }))
      }
      return Promise.resolve(
        new Response('hello', {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const ensureAuth = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    const view = render(StandaloneEditor, {
      props: {
        data: makeEditorData(),
        ensureAuth,
      },
    })

    await waitFor(() => {
      expect(screen.getByLabelText('文本编辑器')).toHaveValue('hello')
    })

    await user.click(screen.getByRole('button', { name: '重命名 / 移动' }))
    await user.click(screen.getByRole('button', { name: '删除' }))
    expect(view.emitted().move).toHaveLength(1)
    expect(view.emitted().delete).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '保存 (Ctrl+S)' }))
    expect(ensureAuth).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/notes.txt'),
      expect.objectContaining({ method: 'PUT', body: 'hello' }),
    )
  })

  it('hides write actions in View mode', async () => {
    window.history.replaceState(null, '', '/notes.txt?view')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('readonly', {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
      ),
    )

    render(StandaloneEditor, {
      props: {
        data: makeEditorData({ kind: 'View' }),
      },
    })

    await screen.findByLabelText('文本编辑器')
    expect(screen.queryByRole('button', { name: '重命名 / 移动' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '删除' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /保存/ })).not.toBeInTheDocument()
  })

  it('renders inline media preview when file is not editable', () => {
    window.history.replaceState(null, '', '/banner.png?view')
    render(StandaloneEditor, {
      props: {
        data: makeEditorData({ href: '/banner.png', kind: 'View', editable: false }),
      },
    })

    const img = screen.getByRole('img', { name: 'banner.png' })
    expect(img).toHaveAttribute('src', expect.stringContaining('/banner.png'))
  })
})

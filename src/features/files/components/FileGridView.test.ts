import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { PathItem } from '../types'
import FileGridView from './FileGridView.vue'

const EDITABLE_FILE: PathItem = {
  path_type: 'File',
  name: 'poster.png',
  mtime: new Date(2026, 10, 22, 13, 30).getTime(),
  size: 4096,
  allow_upload: true,
  allow_delete: true,
}

const DELETE_ONLY_FILE: PathItem = {
  path_type: 'File',
  name: 'readonly-name.txt',
  mtime: new Date(2026, 10, 22, 14, 0).getTime(),
  size: 512,
  allow_upload: false,
  allow_delete: true,
}

const READONLY_DIR: PathItem = {
  path_type: 'Dir',
  name: '归档',
  mtime: new Date(2026, 10, 22, 15, 0).getTime(),
  size: 3,
  allow_upload: false,
  allow_delete: false,
}

describe('FileGridView', () => {
  it('emits move when rename button is clicked without opening preview', async () => {
    const user = userEvent.setup()
    const view = render(FileGridView, {
      props: {
        items: [EDITABLE_FILE],
        allowArchive: true,
        isDemo: true,
        getItemUrl: (item: PathItem) => `https://drop.example.com/${item.name}`,
      },
    })

    const renameButton = screen.getByRole('button', { name: '重命名或移动 poster.png' })
    await user.click(renameButton)

    expect(view.emitted().move).toEqual([[EDITABLE_FILE]])
    expect(view.emitted().preview).toBeUndefined()
  })

  it('hides rename button unless both allow_upload and allow_delete are granted', () => {
    render(FileGridView, {
      props: {
        items: [EDITABLE_FILE, DELETE_ONLY_FILE, READONLY_DIR],
        allowArchive: true,
        isDemo: true,
        getItemUrl: (item: PathItem) => `https://drop.example.com/${item.name}`,
      },
    })

    expect(screen.getByRole('button', { name: '重命名或移动 poster.png' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '重命名或移动 readonly-name.txt' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '删除 readonly-name.txt' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '重命名或移动 归档' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '删除 归档' })).not.toBeInTheDocument()
  })

  it('renders overlay action buttons in consistent order with delete last', () => {
    const { container } = render(FileGridView, {
      props: {
        items: [EDITABLE_FILE],
        allowArchive: true,
        isDemo: true,
        getItemUrl: (item: PathItem) => `https://drop.example.com/${item.name}`,
      },
    })

    const labels = Array.from(container.querySelectorAll('.grid-overlay-actions button')).map(
      (btn) => btn.getAttribute('aria-label'),
    )
    expect(labels).toEqual([
      '二维码分享 poster.png',
      '下载 poster.png',
      '重命名或移动 poster.png',
      '删除 poster.png',
    ])
  })
})

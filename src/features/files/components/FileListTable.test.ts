import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { PathItem } from '../types'
import FileListTable from './FileListTable.vue'

const SAMPLE_ITEMS: readonly PathItem[] = [
  {
    path_type: 'Dir',
    name: '设计资料',
    mtime: new Date(2026, 10, 22, 12, 0).getTime(),
    size: 5,
    allow_upload: true,
    allow_delete: true,
  },
  {
    path_type: 'File',
    name: 'README.md',
    mtime: new Date(2026, 10, 22, 13, 30).getTime(),
    size: 2048,
    allow_upload: true,
    allow_delete: true,
  },
]

describe('FileListTable', () => {
  it('renders rows and emits sort events from column sort buttons', async () => {
    const user = userEvent.setup()
    const view = render(FileListTable, {
      props: {
        items: SAMPLE_ITEMS,
        sortField: 'name',
        sortOrder: 'asc',
        allowArchive: true,
        isDemo: true,
        getItemUrl: (item: PathItem) => `https://drop.example.com/${item.name}`,
      },
    })

    expect(screen.getByText('设计资料')).toBeInTheDocument()
    expect(screen.getByText('2.0 KiB')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '修改时间' }))
    await user.click(screen.getByRole('button', { name: '大小' }))

    expect(view.emitted().sort).toEqual([['mtime'], ['size']])
  })

  it('previews files by clicking the filename and omits the redundant preview icon button', async () => {
    const user = userEvent.setup()
    const view = render(FileListTable, {
      props: {
        items: SAMPLE_ITEMS,
        sortField: 'name',
        sortOrder: 'asc',
        allowArchive: true,
        isDemo: true,
        getItemUrl: (item: PathItem) => `https://drop.example.com/${item.name}`,
      },
    })

    expect(screen.queryByRole('button', { name: '预览 README.md' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'README.md' }))
    await user.click(screen.getByRole('button', { name: '二维码分享 README.md' }))

    expect(view.emitted().preview).toEqual([[SAMPLE_ITEMS[1]]])
    expect(view.emitted().qr).toEqual([[SAMPLE_ITEMS[1]]])

    const rows = view.container.querySelectorAll('.file-row')
    const fileActionLabels = Array.from(
      rows[1]?.querySelectorAll('.file-actions button') ?? [],
    ).map((btn) => btn.getAttribute('aria-label'))
    expect(fileActionLabels).toEqual([
      '下载 README.md',
      '二维码分享 README.md',
      '复制 README.md 链接',
      '重命名或移动 README.md',
      '删除 README.md',
    ])
  })
})

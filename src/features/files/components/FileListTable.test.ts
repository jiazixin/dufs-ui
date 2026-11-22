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

  it('emits preview and qr events for files', async () => {
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

    await user.click(screen.getByRole('button', { name: '预览 README.md' }))
    await user.click(screen.getByRole('button', { name: '二维码分享 README.md' }))

    expect(view.emitted().preview).toHaveLength(1)
    expect(view.emitted().qr).toHaveLength(1)
  })
})

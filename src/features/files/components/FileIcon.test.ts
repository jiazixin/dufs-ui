import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import type { PathItem } from '../types'
import FileIcon from './FileIcon.vue'

function makeItem(name: string, pathType: PathItem['path_type'] = 'File'): PathItem {
  return {
    path_type: pathType,
    name,
    mtime: 0,
    size: 1024,
    allow_upload: true,
    allow_delete: true,
  }
}

describe('FileIcon', () => {
  it('renders brand logos for Python, Go, Java, and Dockerfile code files', () => {
    const cases: readonly (readonly [string, string])[] = [
      ['train.py', 'python'],
      ['server.go', 'go'],
      ['Application.java', 'java'],
      ['Dockerfile.prod', 'docker'],
    ]

    for (const [name, expectedLang] of cases) {
      const view = render(FileIcon, {
        props: { item: makeItem(name), size: 34 },
      })
      const svg = view.container.querySelector('svg[data-lang]')
      expect(svg).not.toBeNull()
      expect(svg?.getAttribute('data-lang')).toBe(expectedLang)
      expect(svg?.getAttribute('width')).toBe('34')
      view.unmount()
    }
  })

  it('falls back to generic FileCode icon for unmapped code formats', () => {
    const { container } = render(FileIcon, {
      props: { item: makeItem('Cargo.toml') },
    })
    expect(container.querySelector('svg[data-lang]')).toBeNull()
    expect(container.querySelector('.is-code svg')).not.toBeNull()
  })

  it('renders folder icon even when a directory name ends with a code extension', () => {
    const { container } = render(FileIcon, {
      props: { item: makeItem('scripts.py', 'Dir') },
    })
    expect(container.querySelector('svg[data-lang]')).toBeNull()
    expect(container.querySelector('.is-dir svg')).not.toBeNull()
  })
})

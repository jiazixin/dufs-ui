import { describe, expect, it } from 'vitest'
import { detectFileKind, isCodeFileName } from './file-types'
import type { PathItem } from './types'

function fileItem(name: string): PathItem {
  return {
    path_type: 'File',
    name,
    mtime: 0,
    size: 128,
    allow_upload: true,
    allow_delete: true,
  }
}

describe('file-types', () => {
  it('treats go.mod, go.sum, go.work, and go.work.sum as plain text files', () => {
    expect(detectFileKind(fileItem('go.mod'))).toBe('text')
    expect(detectFileKind(fileItem('go.sum'))).toBe('text')
    expect(detectFileKind(fileItem('go.work'))).toBe('text')
    expect(detectFileKind(fileItem('go.work.sum'))).toBe('text')
    expect(detectFileKind(fileItem('README'))).toBe('text')
    expect(detectFileKind(fileItem('LICENSE'))).toBe('text')
  })

  it('distinguishes code files from plain text and unknown files', () => {
    expect(detectFileKind(fileItem('main.go'))).toBe('code')
    expect(detectFileKind(fileItem('dufs.toml'))).toBe('code')
    expect(detectFileKind(fileItem('.env.local'))).toBe('code')
    expect(isCodeFileName('Dockerfile')).toBe(true)
    expect(isCodeFileName('Dockerfile.prod')).toBe(true)
    expect(isCodeFileName('GNUmakefile')).toBe(true)
    expect(detectFileKind(fileItem('Dockerfile.prod'))).toBe('code')
    expect(detectFileKind(fileItem('GNUmakefile'))).toBe('code')
    expect(isCodeFileName('go.mod')).toBe(false)
    expect(detectFileKind(fileItem('archive.bin'))).toBe('file')
  })
})

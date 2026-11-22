import { describe, expect, it } from 'vitest'
import { detectCodeIconLang, detectFileKind, isCodeFileName } from './file-types'
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

function dirItem(name: string): PathItem {
  return {
    path_type: 'Dir',
    name,
    mtime: 0,
    size: 4,
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

  it('maps recognizable code files to brand icon languages and falls back safely', () => {
    expect(detectCodeIconLang(fileItem('train.py'))).toBe('python')
    expect(detectCodeIconLang(fileItem('SERVER.GO'))).toBe('go')
    expect(detectCodeIconLang(fileItem('OrderService.java'))).toBe('java')
    expect(detectCodeIconLang(fileItem('use-file-browser.ts'))).toBe('ts')
    expect(detectCodeIconLang(fileItem('vite.config.mjs'))).toBe('js')
    expect(detectCodeIconLang(fileItem('lib.rs'))).toBe('rust')
    expect(detectCodeIconLang(fileItem('FileIcon.vue'))).toBe('vue')
    expect(detectCodeIconLang(fileItem('main.c'))).toBe('c')
    expect(detectCodeIconLang(fileItem('codec.cpp'))).toBe('cpp')
    expect(detectCodeIconLang(fileItem('Dockerfile'))).toBe('docker')
    expect(detectCodeIconLang(fileItem('Dockerfile.prod'))).toBe('docker')
    expect(detectCodeIconLang(fileItem('deploy.sh'))).toBe('sh')
    expect(detectCodeIconLang(fileItem('dufs.toml'))).toBeNull()
    expect(detectCodeIconLang(fileItem('Makefile'))).toBeNull()
    expect(detectCodeIconLang(dirItem('main.py'))).toBeNull()
  })

  it('recognizes basenames and extensions inside nested search result paths', () => {
    expect(detectFileKind(fileItem('编程语言/golang/go.mod'))).toBe('text')
    expect(detectFileKind(fileItem('v1.0/README'))).toBe('text')
    expect(detectFileKind(fileItem('services/api/Dockerfile.prod'))).toBe('code')
    expect(detectFileKind(fileItem('app/.env.local'))).toBe('code')
    expect(isCodeFileName('services/api/Dockerfile.prod')).toBe(true)
    expect(detectCodeIconLang(fileItem('services/api/Dockerfile.prod'))).toBe('docker')
    expect(detectCodeIconLang(fileItem('v1.0/README'))).toBeNull()
  })
})

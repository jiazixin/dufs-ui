import { afterEach, describe, expect, it } from 'vitest'
import { loadInitialDufsData, normalizeDufsData } from './dufs-data'

function encodeBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

describe('dufs-data normalization', () => {
  afterEach(() => {
    document.getElementById('index-data')?.remove()
  })

  it('normalizes dufs EditData without paths and with null user', () => {
    const normalized = normalizeDufsData({
      href: '/notes.md',
      kind: 'Edit',
      uri_prefix: '/',
      allow_upload: true,
      allow_delete: true,
      auth: false,
      user: null,
      editable: true,
    })

    expect(normalized).toEqual({
      href: '/notes.md',
      uri_prefix: '/',
      kind: 'Edit',
      paths: [],
      allow_upload: true,
      allow_delete: true,
      allow_search: false,
      allow_archive: false,
      auth: false,
      user: '',
      dir_exists: true,
      editable: true,
    })
  })

  it('loads base64-encoded EditData from #index-data without crashing', () => {
    const payload = {
      href: '/文档/新建.md',
      kind: 'Edit',
      uri_prefix: '/',
      allow_upload: true,
      allow_delete: false,
      auth: false,
      user: null,
      editable: true,
    }
    const tpl = document.createElement('template')
    tpl.id = 'index-data'
    tpl.innerHTML = encodeBase64Utf8(JSON.stringify(payload))
    document.body.appendChild(tpl)

    const loaded = loadInitialDufsData()
    expect(loaded.isDemo).toBe(false)
    expect(loaded.data.kind).toBe('Edit')
    expect(loaded.data.href).toBe('/文档/新建.md')
    expect(loaded.data.paths).toEqual([])
    expect(loaded.data.user).toBe('')
    expect(loaded.data.editable).toBe(true)
  })
})

import { effectScope } from 'vue'
import type { EffectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFileBrowser } from './use-file-browser'

function encodeBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function mountIndexData(payload: Record<string, unknown>): void {
  document.getElementById('index-data')?.remove()
  const tpl = document.createElement('template')
  tpl.id = 'index-data'
  tpl.innerHTML = encodeBase64Utf8(JSON.stringify(payload))
  document.body.appendChild(tpl)
}

function createJsonResponse(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function dispatchPageShow(isPersisted: boolean): void {
  const event = new Event('pageshow')
  Object.defineProperty(event, 'persisted', { value: isPersisted })
  window.dispatchEvent(event)
}

async function flushAsync(): Promise<void> {
  await Promise.resolve()
  await new Promise((resolve) => window.setTimeout(resolve, 0))
}

describe('useFileBrowser history refresh', () => {
  const scopes: EffectScope[] = []

  function runInScope<T>(fn: () => T): T {
    const scope = effectScope()
    scopes.push(scope)
    const result = scope.run(fn)
    if (result === undefined) {
      throw new Error('effectScope failed to run')
    }
    return result
  }

  afterEach(() => {
    while (scopes.length > 0) {
      scopes.pop()?.stop()
    }
    document.getElementById('index-data')?.remove()
    vi.restoreAllMocks()
  })

  it('refreshes directory list immediately on back_forward navigation with no-store cache', async () => {
    mountIndexData({
      href: '/',
      kind: 'Index',
      uri_prefix: '/',
      allow_upload: true,
      allow_delete: true,
      allow_search: true,
      allow_archive: true,
      paths: [{ path_type: 'File', name: '123.txt', mtime: 1000, size: 4 }],
    })

    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'back_forward' } as unknown as PerformanceEntry,
    ])
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({
        paths: [
          { path_type: 'Dir', name: 'uploaded-folder', mtime: 2000, size: 1 },
          { path_type: 'File', name: '123.txt', mtime: 1000, size: 4 },
        ],
      }),
    )

    const browser = runInScope(() => useFileBrowser())
    await flushAsync()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [requestUrl, requestInit] = fetchSpy.mock.calls[0] ?? []
    expect(typeof requestUrl).toBe('string')
    expect(requestUrl).toContain('json=')
    expect(requestInit).toMatchObject({ cache: 'no-store' })
    expect(browser.paths.value.map((item) => item.name)).toEqual(['uploaded-folder', '123.txt'])
  })

  it('does not auto-refresh on normal navigate load', async () => {
    mountIndexData({
      href: '/',
      kind: 'Index',
      uri_prefix: '/',
      allow_upload: true,
      allow_delete: true,
      paths: [{ path_type: 'File', name: '123.txt', mtime: 1000, size: 4 }],
    })

    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'navigate' } as unknown as PerformanceEntry,
    ])
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    runInScope(() => useFileBrowser())
    await flushAsync()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('refreshes when restored from bfcache (pageshow persisted=true) and ignores persisted=false', async () => {
    mountIndexData({
      href: '/',
      kind: 'Index',
      uri_prefix: '/',
      allow_upload: true,
      allow_delete: true,
      paths: [{ path_type: 'File', name: '123.txt', mtime: 1000, size: 4 }],
    })

    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'navigate' } as unknown as PerformanceEntry,
    ])
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({
        paths: [
          { path_type: 'Dir', name: 'fresh-folder', mtime: 3000, size: 2 },
          { path_type: 'File', name: '123.txt', mtime: 1000, size: 4 },
        ],
      }),
    )

    const browser = runInScope(() => useFileBrowser())
    dispatchPageShow(false)
    await flushAsync()
    expect(fetchSpy).not.toHaveBeenCalled()

    dispatchPageShow(true)
    await flushAsync()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(browser.paths.value.map((item) => item.name)).toEqual(['fresh-folder', '123.txt'])
  })

  it('aborts superseded refreshList requests so stale responses cannot overwrite newer state', async () => {
    mountIndexData({
      href: '/',
      kind: 'Index',
      uri_prefix: '/',
      allow_upload: true,
      allow_delete: true,
      paths: [],
    })

    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([
      { type: 'navigate' } as unknown as PerformanceEntry,
    ])

    const pendingFirst: { resolve: ((res: Response) => void) | null } = { resolve: null }
    let firstAborted = false
    let callCount = 0

    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      callCount++
      const signal = init?.signal
      if (callCount === 1) {
        return new Promise<Response>((resolve, reject) => {
          pendingFirst.resolve = resolve
          signal?.addEventListener('abort', () => {
            firstAborted = true
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      }
      return Promise.resolve(
        createJsonResponse({
          paths: [{ path_type: 'Dir', name: 'latest-folder', mtime: 5000, size: 3 }],
        }),
      )
    })

    const browser = runInScope(() => useFileBrowser())
    const first = browser.refreshList()
    const second = browser.refreshList()

    await second
    expect(firstAborted).toBe(true)
    pendingFirst.resolve?.(
      createJsonResponse({
        paths: [{ path_type: 'Dir', name: 'stale-folder', mtime: 1000, size: 1 }],
      }),
    )
    await first

    expect(browser.paths.value.map((item) => item.name)).toEqual(['latest-folder'])
    expect(browser.isLoading.value).toBe(false)
  })
})

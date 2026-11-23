import { effectScope, nextTick } from 'vue'
import type { EffectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useUploadQueue } from './use-upload-queue'

describe('useUploadQueue beforeunload listener', () => {
  const scopes: EffectScope[] = []

  afterEach(() => {
    while (scopes.length > 0) {
      scopes.pop()?.stop()
    }
    vi.restoreAllMocks()
  })

  it('registers beforeunload only while uploads are active so bfcache stays available', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const scope = effectScope()
    scopes.push(scope)
    const upload = scope.run(() =>
      useUploadQueue({
        isDemo: true,
        canUpload: () => true,
        resolveUrl: (rel) => `https://example.com/${rel}`,
        ensureAuth: async () => {},
        onUploaded: () => {},
      }),
    )
    if (!upload) throw new Error('failed to init upload queue')

    const hasBeforeUnloadAddedInitially = addSpy.mock.calls.some(
      ([type]) => type === 'beforeunload',
    )
    expect(hasBeforeUnloadAddedInitially).toBe(false)

    upload.enqueue(new File(['hello'], 'demo.txt', { type: 'text/plain' }), [])
    await nextTick()

    const hasBeforeUnloadWhenActive = addSpy.mock.calls.some(([type]) => type === 'beforeunload')
    expect(hasBeforeUnloadWhenActive).toBe(true)

    const taskId = upload.tasks.value[0]?.id
    expect(taskId).toBeDefined()
    if (taskId !== undefined) {
      upload.cancelTask(taskId)
    }
    await nextTick()

    const hasBeforeUnloadRemoved = removeSpy.mock.calls.some(([type]) => type === 'beforeunload')
    expect(hasBeforeUnloadRemoved).toBe(true)
  })
})

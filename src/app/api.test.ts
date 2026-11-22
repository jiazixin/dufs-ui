import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, setUnauthorizedHandler } from './api'

describe('api wrapper', () => {
  afterEach(() => {
    setUnauthorizedHandler(null)
    vi.restoreAllMocks()
  })

  it('maps error response into ApiError and triggers 401 handler', async () => {
    const on401 = vi.fn()
    setUnauthorizedHandler(on401)

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Unauthorized', {
        status: 401,
        headers: {
          'x-dufs-error-code': 'auth-required',
          'x-request-id': 'abc-123',
        },
      }),
    )

    await expect(api<string>('/secret', { responseType: 'text' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'auth-required',
      requestId: 'abc-123',
    })
    expect(on401).toHaveBeenCalledTimes(1)
  })

  it('preserves native AbortError when caller aborts', async () => {
    const controller = new AbortController()
    controller.abort()

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    try {
      await api<unknown>('/items', { signal: controller.signal })
      expect.unreachable('should have thrown')
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(DOMException)
      expect(error).not.toBeInstanceOf(ApiError)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { errorText } from './errors'

describe('errorText', () => {
  it('prefers domain messages over common messages and status fallback', () => {
    const domain = { 'upload-disabled': '禁止上传' }
    const err = new ApiError('Forbidden', {
      status: 403,
      code: 'upload-disabled',
      requestId: 'req-1',
    })
    expect(errorText(err, domain)).toBe('禁止上传')
  })

  it('falls back to common code and HTTP status messages', () => {
    const timeoutErr = new ApiError('Timeout', { status: 0, code: 'timeout', requestId: '' })
    expect(errorText(timeoutErr)).toContain('超时')

    const notFound = new ApiError('Not found', { status: 404, code: 'custom_404', requestId: '' })
    expect(errorText(notFound)).toContain('不存在')
  })

  it('handles AbortError and unknown errors', () => {
    expect(errorText(new DOMException('Aborted', 'AbortError'))).toBe('操作已取消')
    expect(errorText('unexpected')).toBe('操作失败，请稍后重试')
  })
})

export type ApiErrorInit = {
  status: number
  code: string
  requestId: string
  details?: unknown
  retryAfterMs?: number
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string
  readonly details?: unknown
  readonly retryAfterMs?: number

  constructor(message: string, init: ApiErrorInit) {
    super(message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.requestId = init.requestId
    this.details = init.details
    this.retryAfterMs = init.retryAfterMs
  }
}

export type ApiRequestOptions = {
  method?: string
  body?: BodyInit | null
  signal?: AbortSignal
  headers?: Record<string, string>
  responseType?: 'json' | 'text' | 'void' | 'headers'
  timeoutMs?: number
}

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

function parseRetryAfter(raw: string | null): number | undefined {
  if (!raw) return undefined
  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000
  }
  const dateMs = Date.parse(raw)
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now())
  }
  return undefined
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    signal,
    headers,
    responseType = 'json',
    timeoutMs = 30_000,
  } = options

  const controller = new AbortController()
  const TIMEOUT_REASON = 'dufs_timeout'

  const onExternalAbort = (): void => {
    controller.abort(signal?.reason)
  }
  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason)
    } else {
      signal.addEventListener('abort', onExternalAbort, { once: true })
    }
  }

  const timer = window.setTimeout(() => {
    controller.abort(TIMEOUT_REASON)
  }, timeoutMs)

  let response: Response
  try {
    response = await fetch(path, {
      method,
      body,
      headers,
      signal: controller.signal,
    })
  } catch (error: unknown) {
    window.clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onExternalAbort)

    if (controller.signal.reason === TIMEOUT_REASON) {
      throw new ApiError('Request timed out', {
        status: 0,
        code: 'timeout',
        requestId: '',
      })
    }
    if (isAbortError(error) || signal?.aborted) {
      throw error
    }
    throw new ApiError('Network request failed', {
      status: 0,
      code: 'network_error',
      requestId: '',
      details: error,
    })
  } finally {
    window.clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onExternalAbort)
  }

  if (!response.ok) {
    const dufsCode = response.headers.get('x-dufs-error-code') ?? ''
    const requestId = response.headers.get('x-request-id') ?? ''
    const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'))
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized()
    }
    let bodyText = ''
    try {
      bodyText = await response.text()
    } catch {
      bodyText = ''
    }
    throw new ApiError(bodyText || `HTTP ${String(response.status)}`, {
      status: response.status,
      code: dufsCode || `http_${String(response.status)}`,
      requestId,
      retryAfterMs,
    })
  }

  if (responseType === 'void') {
    return undefined as T
  }
  if (responseType === 'headers') {
    return response.headers as T
  }
  if (responseType === 'text') {
    const contentType = response.headers.get('content-type')
    const charsetMatch = contentType ? /charset=([^;\s]+)/i.exec(contentType) : null
    const charset = charsetMatch?.[1]?.toLowerCase() ?? 'utf-8'
    if (charset === 'utf-8') {
      return (await response.text()) as T
    }
    const buffer = await response.arrayBuffer()
    return new TextDecoder(charset).decode(new DataView(buffer)) as T
  }
  const raw: unknown = await response.json()
  return raw as T
}

export type UploadProgressEvent = {
  readonly loaded: number
  readonly total: number
}

export type UploadHandle = {
  readonly promise: Promise<void>
  readonly abort: () => void
}

export function uploadFileRequest(options: {
  url: string
  file: Blob
  offset: number
  onProgress: (event: UploadProgressEvent) => void
}): UploadHandle {
  const { url, file, offset, onProgress } = options
  const xhr = new XMLHttpRequest()

  const promise = new Promise<void>((resolve, reject) => {
    xhr.upload.addEventListener('progress', (event) => {
      onProgress({ loaded: event.loaded, total: event.total })
    })

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState !== 4) return
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      if (xhr.status === 0) return
      const code = xhr.getResponseHeader('x-dufs-error-code') ?? `http_${String(xhr.status)}`
      const requestId = xhr.getResponseHeader('x-request-id') ?? ''
      reject(
        new ApiError(xhr.statusText || `HTTP ${String(xhr.status)}`, {
          status: xhr.status,
          code,
          requestId,
        }),
      )
    })

    xhr.addEventListener('error', () => {
      reject(
        new ApiError('Upload network error', {
          status: 0,
          code: 'network_error',
          requestId: '',
        }),
      )
    })

    xhr.addEventListener('abort', () => {
      reject(new DOMException('Upload aborted', 'AbortError'))
    })

    if (offset > 0) {
      xhr.open('PATCH', url)
      xhr.setRequestHeader('X-Update-Range', 'append')
      xhr.send(file.slice(offset))
    } else {
      xhr.open('PUT', url)
      xhr.send(file)
    }
  })

  return {
    promise,
    abort: () => {
      xhr.abort()
    },
  }
}

export function logoutRequest(url: string, username: string): Promise<void> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('LOGOUT', url, true, username)
    xhr.addEventListener('loadend', () => {
      resolve()
    })
    xhr.send()
  })
}

import { ApiError } from './api'

const COMMON_ERROR_MESSAGES: Record<string, string> = {
  network_error: '网络连接失败，请检查服务是否可达',
  timeout: '请求超时，请稍后重试',
  http_400: '请求参数有误',
  http_401: '需要登录认证后才能执行此操作',
  http_403: '没有权限执行此操作',
  http_404: '目标文件或目录不存在',
  http_409: '目标已存在或状态冲突',
  http_413: '文件体积超出服务端或代理限制',
  http_500: '服务端发生内部错误',
  http_502: '上游服务暂不可用',
  http_503: '服务暂时不可用，请稍后重试',
}

export function errorText(error: unknown, domainMessages?: Record<string, string>): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '操作已取消'
  }

  if (error instanceof ApiError) {
    const fromDomain = domainMessages?.[error.code]
    if (fromDomain) {
      return fromDomain
    }
    const fromCommon = COMMON_ERROR_MESSAGES[error.code]
    if (fromCommon) {
      return fromCommon
    }
    const byStatus = COMMON_ERROR_MESSAGES[`http_${String(error.status)}`]
    if (byStatus) {
      return byStatus
    }
    return `请求失败（状态码 ${String(error.status)}）`
  }

  return '操作失败，请稍后重试'
}

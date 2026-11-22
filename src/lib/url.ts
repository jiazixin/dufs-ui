export function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

export function getBaseUrl(): string {
  const clean = window.location.href.split(/[?#]/)[0]
  return clean ?? window.location.origin
}

export function joinRelativeUrl(base: string, relativePath: string): string {
  const encoded = relativePath
    .split('/')
    .filter((segment) => segment.length > 0)
    .map(encodeURIComponent)
    .join('/')
  return `${ensureTrailingSlash(base)}${encoded}`
}

export function getBaseName(url: string): string {
  const clean = url.split(/[?#]/)[0] ?? ''
  const parts = clean.split('/').filter((segment) => segment.length > 0)
  const last = parts[parts.length - 1]
  return last ? decodeURIComponent(last) : '/'
}

export function getExtName(filename: string): string {
  const dot = filename.lastIndexOf('.')
  if (dot <= 0 || dot === filename.length - 1) {
    return ''
  }
  return filename.slice(dot).toLowerCase()
}

export function isSameOriginUrl(target: string): boolean {
  try {
    const resolved = new URL(target, window.location.href)
    return resolved.origin === window.location.origin
  } catch {
    return false
  }
}

export function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

import { decodeBase64Utf8 } from '../../lib/url'
import type { DemoFileContent, DufsData, DufsPageKind, PathItem, PathType } from './types'

export const demoContentStore = new Map<string, DemoFileContent>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePageKind(value: unknown): DufsPageKind {
  if (value === 'Edit' || value === 'View') {
    return value
  }
  return 'Index'
}

function parsePathType(value: unknown): PathType {
  if (value === 'Dir' || value === 'SymlinkDir' || value === 'SymlinkFile') {
    return value
  }
  return 'File'
}

export function normalizePathItems(
  raw: unknown,
  fallbackPermissions: { readonly allowUpload: boolean; readonly allowDelete: boolean },
): PathItem[] {
  if (!Array.isArray(raw)) return []
  const items: PathItem[] = []
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.name !== 'string') continue
    items.push({
      path_type: parsePathType(entry.path_type),
      name: entry.name,
      mtime: typeof entry.mtime === 'number' ? entry.mtime : 0,
      size: typeof entry.size === 'number' ? entry.size : 0,
      etag: typeof entry.etag === 'string' || entry.etag === null ? entry.etag : undefined,
      allow_upload:
        typeof entry.allow_upload === 'boolean'
          ? entry.allow_upload
          : fallbackPermissions.allowUpload,
      allow_delete:
        typeof entry.allow_delete === 'boolean'
          ? entry.allow_delete
          : fallbackPermissions.allowDelete,
      readonly_descendant:
        typeof entry.readonly_descendant === 'boolean' ? entry.readonly_descendant : undefined,
    })
  }
  return items
}

export function normalizeDufsData(raw: unknown): DufsData {
  const obj = isRecord(raw) ? raw : {}
  const allowUpload = Boolean(obj.allow_upload)
  const allowDelete = Boolean(obj.allow_delete)
  return {
    href: typeof obj.href === 'string' && obj.href.length > 0 ? obj.href : '/',
    uri_prefix:
      typeof obj.uri_prefix === 'string' && obj.uri_prefix.length > 0 ? obj.uri_prefix : '/',
    kind: parsePageKind(obj.kind),
    paths: normalizePathItems(obj.paths, { allowUpload, allowDelete }),
    allow_upload: allowUpload,
    allow_delete: allowDelete,
    allow_search: Boolean(obj.allow_search),
    allow_archive: Boolean(obj.allow_archive),
    auth: Boolean(obj.auth),
    user: typeof obj.user === 'string' ? obj.user : '',
    dir_exists: typeof obj.dir_exists === 'boolean' ? obj.dir_exists : true,
    editable: Boolean(obj.editable),
  }
}

function buildDemoData(): DufsData {
  const sampleSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">' +
    '<rect width="960" height="600" fill="#18181b"/>' +
    '<circle cx="240" cy="210" r="150" fill="rgba(255,255,255,0.06)"/>' +
    '<circle cx="720" cy="410" r="190" fill="rgba(255,255,255,0.05)"/>' +
    '<text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" fill="#fafafa" font-family="-apple-system,sans-serif" font-size="42" font-weight="600">DropHub · Dufs</text>' +
    '<text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#a1a1aa" font-family="-apple-system,sans-serif" font-size="18">Vue 3 + TypeScript · 极简文件中转站</text>' +
    '</svg>'

  demoContentStore.set('封面预览图.svg', {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sampleSvg)}`,
    text: sampleSvg,
  })
  demoContentStore.set('README.md', {
    text: [
      '# DropHub · Dufs Vue 3 前端',
      '',
      '使用方式：',
      '```bash',
      'npm run build',
      'dufs /你的共享目录 -A --assets ./dist',
      '```',
      '',
      '特性：拖拽上传、实时进度与续传、弹窗预览、纯本地离线二维码。',
    ].join('\n'),
  })
  demoContentStore.set('docker-compose.yml', {
    text: [
      'services:',
      '  dufs:',
      '    image: sigoden/dufs:latest',
      '    ports:',
      '      - "5000:5000"',
      '    volumes:',
      '      - ./shared:/data',
      '      - ./dist:/assets:ro',
      '    command: /data -A --assets /assets',
    ].join('\n'),
  })

  const now = Date.now()
  return {
    href: '/',
    uri_prefix: '/',
    kind: 'Index',
    allow_upload: true,
    allow_delete: true,
    allow_search: true,
    allow_archive: true,
    auth: false,
    user: '',
    dir_exists: true,
    editable: false,
    paths: [
      {
        path_type: 'Dir',
        name: '项目交付包',
        mtime: now - 1_200_000,
        size: 16,
        allow_upload: true,
        allow_delete: true,
      },
      {
        path_type: 'File',
        name: '封面预览图.svg',
        mtime: now - 3_600_000,
        size: 15_240,
        allow_upload: true,
        allow_delete: true,
      },
      {
        path_type: 'File',
        name: '产品演示录屏.mp4',
        mtime: now - 7_200_000,
        size: 68_421_000,
        allow_upload: true,
        allow_delete: true,
      },
      {
        path_type: 'File',
        name: '会议录音.mp3',
        mtime: now - 9_000_000,
        size: 8_420_100,
        allow_upload: true,
        allow_delete: true,
      },
      {
        path_type: 'File',
        name: '方案说明书.pdf',
        mtime: now - 14_400_000,
        size: 3_251_200,
        allow_upload: true,
        allow_delete: true,
      },
      {
        path_type: 'File',
        name: 'release-v2.4.tar.gz',
        mtime: now - 28_800_000,
        size: 48_234_496,
        allow_upload: true,
        allow_delete: true,
      },
      {
        path_type: 'File',
        name: 'docker-compose.yml',
        mtime: now - 43_200_000,
        size: 268,
        allow_upload: true,
        allow_delete: true,
      },
      {
        path_type: 'File',
        name: 'README.md',
        mtime: now - 86_400_000,
        size: 380,
        allow_upload: true,
        allow_delete: true,
      },
    ],
  }
}

export type LoadedDufsContext = {
  readonly data: DufsData
  readonly isDemo: boolean
}

export function loadInitialDufsData(): LoadedDufsContext {
  const el = document.getElementById('index-data')
  const raw = el?.innerHTML.trim() ?? ''
  if (!raw || raw === '__INDEX_DATA__') {
    return { data: buildDemoData(), isDemo: true }
  }
  const parsed: unknown = JSON.parse(decodeBase64Utf8(raw))
  return { data: normalizeDufsData(parsed), isDemo: false }
}

import { getExtName } from '../../lib/url'
import type { FileKind, PathItem } from './types'

const IMAGE_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
  '.avif',
])
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.ogv'])
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'])
const PDF_EXTS = new Set(['.pdf'])
const ARCHIVE_EXTS = new Set(['.zip', '.tar', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar', '.zst'])
const CODE_EXTS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.xml',
  '.sql',
  '.sh',
  '.py',
  '.go',
  '.rs',
  '.c',
  '.h',
  '.cpp',
  '.java',
  '.swift',
  '.rb',
  '.php',
  '.vue',
  '.env',
  '.ini',
  '.conf',
])
const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.log', '.csv', '.tsv'])
const DOC_EXTS = new Set(['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'])

export function isDirItem(item: PathItem): boolean {
  return item.path_type === 'Dir' || item.path_type === 'SymlinkDir'
}

export function detectFileKind(item: PathItem): FileKind {
  if (isDirItem(item)) return 'dir'
  const ext = getExtName(item.name)
  const lower = item.name.toLowerCase()
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (AUDIO_EXTS.has(ext)) return 'audio'
  if (PDF_EXTS.has(ext)) return 'pdf'
  if (ARCHIVE_EXTS.has(ext)) return 'archive'
  if (CODE_EXTS.has(ext) || lower === 'dockerfile' || lower === 'makefile') return 'code'
  if (TEXT_EXTS.has(ext) || lower === 'readme' || lower === 'license') return 'text'
  if (DOC_EXTS.has(ext)) return 'doc'
  return 'file'
}

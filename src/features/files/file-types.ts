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
  '.jsonc',
  '.yaml',
  '.yml',
  '.toml',
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.less',
  '.sass',
  '.xml',
  '.sql',
  '.sh',
  '.bash',
  '.zsh',
  '.py',
  '.go',
  '.rs',
  '.c',
  '.h',
  '.cpp',
  '.cc',
  '.cxx',
  '.hpp',
  '.java',
  '.kt',
  '.kts',
  '.gradle',
  '.swift',
  '.rb',
  '.php',
  '.vue',
  '.env',
  '.ini',
  '.conf',
  '.cfg',
  '.properties',
  '.dockerfile',
])
const CODE_BASENAMES = new Set([
  'dockerfile',
  'makefile',
  'gnumakefile',
  '.env',
  '.gitignore',
  '.editorconfig',
])
const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.log', '.csv', '.tsv'])
const TEXT_BASENAMES = new Set(['readme', 'license', 'go.mod', 'go.sum', 'go.work', 'go.work.sum'])
const DOC_EXTS = new Set(['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'])

export function isDirItem(item: PathItem): boolean {
  return item.path_type === 'Dir' || item.path_type === 'SymlinkDir'
}

export function isCodeFileName(filename: string): boolean {
  const ext = getExtName(filename)
  const lower = filename.toLowerCase()
  return (
    CODE_EXTS.has(ext) ||
    CODE_BASENAMES.has(lower) ||
    lower.startsWith('.env.') ||
    lower.startsWith('dockerfile.')
  )
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
  if (isCodeFileName(item.name)) return 'code'
  if (TEXT_EXTS.has(ext) || TEXT_BASENAMES.has(lower)) return 'text'
  if (DOC_EXTS.has(ext)) return 'doc'
  return 'file'
}

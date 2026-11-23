import { getExtName, getFileName } from '../../lib/url'
import type { CodeIconLang, FileKind, PathItem } from './types'

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
  '.tf',
  '.tofu',
  '.tfvars',
  '.vars',
  '.hcl',
  '.tfbackend',
  '.tftpl',
  '.tfstate',
  '.nomad',
])
const CODE_BASENAMES = new Set([
  'dockerfile',
  'makefile',
  'gnumakefile',
  '.env',
  '.gitignore',
  '.editorconfig',
  '.terraformrc',
  'terraform.rc',
  '.tofurc',
  'tofu.rc',
  '.terraformignore',
])
const TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.log', '.csv', '.tsv'])
const TEXT_BASENAMES = new Set([
  'readme',
  'license',
  'go.mod',
  'go.sum',
  'go.work',
  'go.work.sum',
  '.terraform-version',
  '.opentofu-version',
])
const DOC_EXTS = new Set(['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'])

const CODE_ICON_BY_EXT: Readonly<Record<string, CodeIconLang>> = {
  '.py': 'python',
  '.go': 'go',
  '.java': 'java',
  '.ts': 'ts',
  '.tsx': 'ts',
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.jsx': 'js',
  '.rs': 'rust',
  '.vue': 'vue',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',
  '.sass': 'css',
  '.json': 'json',
  '.jsonc': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.sh': 'sh',
  '.bash': 'sh',
  '.zsh': 'sh',
  '.sql': 'sql',
  '.dockerfile': 'docker',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.swift': 'swift',
  '.rb': 'ruby',
  '.php': 'php',
  '.tf': 'terraform',
  '.tfvars': 'terraform',
  '.vars': 'terraform',
  '.hcl': 'terraform',
  '.tfbackend': 'terraform',
  '.tftpl': 'terraform',
  '.tfstate': 'terraform',
  '.nomad': 'terraform',
  '.tofu': 'opentofu',
}

export function isDirItem(item: PathItem): boolean {
  return item.path_type === 'Dir' || item.path_type === 'SymlinkDir'
}

export function isCodeFileName(filename: string): boolean {
  const base = getFileName(filename)
  const ext = getExtName(base)
  const lower = base.toLowerCase()
  return (
    CODE_EXTS.has(ext) ||
    CODE_BASENAMES.has(lower) ||
    lower.startsWith('.env.') ||
    lower.startsWith('dockerfile.') ||
    lower.endsWith('.tfstate.backup')
  )
}

export function detectCodeIconLang(item: PathItem): CodeIconLang | null {
  if (isDirItem(item)) return null
  const base = getFileName(item.name)
  const lower = base.toLowerCase()
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) {
    return 'docker'
  }
  if (
    lower === '.tofurc' ||
    lower === 'tofu.rc' ||
    lower.endsWith('.tofutest.hcl') ||
    lower.endsWith('.tofutest.json') ||
    lower.endsWith('.tofu.json')
  ) {
    return 'opentofu'
  }
  if (
    lower === '.terraformrc' ||
    lower === 'terraform.rc' ||
    lower.endsWith('.tfstate.backup') ||
    lower.endsWith('.tf.json') ||
    lower.endsWith('.tfvars.json') ||
    lower.endsWith('.tftest.json')
  ) {
    return 'terraform'
  }
  const ext = getExtName(base)
  return CODE_ICON_BY_EXT[ext] ?? null
}

export function detectFileKind(item: PathItem): FileKind {
  if (isDirItem(item)) return 'dir'
  const base = getFileName(item.name)
  const ext = getExtName(base)
  const lower = base.toLowerCase()
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (AUDIO_EXTS.has(ext)) return 'audio'
  if (PDF_EXTS.has(ext)) return 'pdf'
  if (ARCHIVE_EXTS.has(ext)) return 'archive'
  if (isCodeFileName(base)) return 'code'
  if (TEXT_EXTS.has(ext) || TEXT_BASENAMES.has(lower)) return 'text'
  if (DOC_EXTS.has(ext)) return 'doc'
  return 'file'
}

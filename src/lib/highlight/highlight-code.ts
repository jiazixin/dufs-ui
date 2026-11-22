import { getExtName } from '../url'

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'keyword'
  | 'func'
  | 'section'
  | 'type'
  | 'key'
  | 'string'
  | 'number'
  | 'boolean'
  | 'meta'
  | 'punct'

export type HighlightToken = {
  readonly kind: TokenKind
  readonly text: string
}

export type HighlightLine = {
  readonly number: number
  readonly tokens: readonly HighlightToken[]
}

export type CodeLanguage =
  | 'go'
  | 'java'
  | 'kotlin'
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'yaml'
  | 'toml'
  | 'ini'
  | 'shell'
  | 'python'
  | 'rust'
  | 'c'
  | 'cpp'
  | 'swift'
  | 'ruby'
  | 'php'
  | 'sql'
  | 'html'
  | 'css'
  | 'xml'
  | 'vue'
  | 'dockerfile'
  | 'makefile'
  | 'plain'

export type CodeLanguageMeta = {
  readonly id: CodeLanguage
  readonly label: string
}

type LineScanState = {
  blockCommentEnd: string | null
  tripleQuote: '"' | "'" | null
}

const MAX_HIGHLIGHT_CHARS = 512 * 1024
const MAX_HIGHLIGHT_LINES = 5000

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  go: 'GO',
  java: 'JAVA',
  kotlin: 'KOTLIN',
  javascript: 'JS',
  typescript: 'TS',
  json: 'JSON',
  yaml: 'YAML',
  toml: 'TOML',
  ini: 'INI',
  shell: 'SHELL',
  python: 'PYTHON',
  rust: 'RUST',
  c: 'C',
  cpp: 'C++',
  swift: 'SWIFT',
  ruby: 'RUBY',
  php: 'PHP',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  xml: 'XML',
  vue: 'VUE',
  dockerfile: 'DOCKER',
  makefile: 'MAKE',
  plain: 'CODE',
}

const EXT_TO_LANGUAGE: Record<string, CodeLanguage> = {
  '.go': 'go',
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.gradle': 'kotlin',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.json': 'json',
  '.jsonc': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.conf': 'ini',
  '.cfg': 'ini',
  '.env': 'ini',
  '.properties': 'ini',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.py': 'python',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.swift': 'swift',
  '.rb': 'ruby',
  '.php': 'php',
  '.sql': 'sql',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',
  '.sass': 'css',
  '.xml': 'xml',
  '.vue': 'vue',
  '.dockerfile': 'dockerfile',
}

const KEYWORDS_BY_LANG: Partial<Record<CodeLanguage, ReadonlySet<string>>> = {
  go: new Set([
    'break',
    'case',
    'chan',
    'const',
    'continue',
    'default',
    'defer',
    'else',
    'fallthrough',
    'for',
    'func',
    'go',
    'goto',
    'if',
    'import',
    'interface',
    'map',
    'package',
    'range',
    'return',
    'select',
    'struct',
    'switch',
    'type',
    'var',
  ]),
  java: new Set([
    'abstract',
    'assert',
    'boolean',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'class',
    'continue',
    'default',
    'do',
    'double',
    'else',
    'enum',
    'extends',
    'final',
    'finally',
    'float',
    'for',
    'if',
    'implements',
    'import',
    'instanceof',
    'int',
    'interface',
    'long',
    'native',
    'new',
    'package',
    'private',
    'protected',
    'public',
    'record',
    'return',
    'sealed',
    'short',
    'static',
    'super',
    'switch',
    'synchronized',
    'this',
    'throw',
    'throws',
    'transient',
    'try',
    'var',
    'void',
    'volatile',
    'while',
    'yield',
  ]),
  kotlin: new Set([
    'abstract',
    'as',
    'break',
    'by',
    'catch',
    'class',
    'companion',
    'const',
    'constructor',
    'continue',
    'data',
    'do',
    'else',
    'enum',
    'finally',
    'for',
    'fun',
    'if',
    'import',
    'in',
    'init',
    'inline',
    'interface',
    'internal',
    'is',
    'lateinit',
    'object',
    'open',
    'operator',
    'out',
    'override',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'sealed',
    'super',
    'suspend',
    'this',
    'throw',
    'try',
    'typealias',
    'val',
    'var',
    'when',
    'while',
  ]),
  javascript: new Set([
    'as',
    'async',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'from',
    'function',
    'get',
    'if',
    'import',
    'in',
    'instanceof',
    'let',
    'new',
    'of',
    'return',
    'set',
    'static',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'yield',
  ]),
  typescript: new Set([
    'abstract',
    'as',
    'asserts',
    'async',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'declare',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'finally',
    'for',
    'from',
    'function',
    'get',
    'if',
    'implements',
    'import',
    'in',
    'infer',
    'instanceof',
    'interface',
    'is',
    'keyof',
    'let',
    'module',
    'namespace',
    'new',
    'of',
    'override',
    'private',
    'protected',
    'public',
    'readonly',
    'return',
    'satisfies',
    'set',
    'static',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'type',
    'typeof',
    'var',
    'void',
    'while',
    'yield',
  ]),
  python: new Set([
    'and',
    'as',
    'assert',
    'async',
    'await',
    'break',
    'case',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'match',
    'nonlocal',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'try',
    'while',
    'with',
    'yield',
  ]),
  rust: new Set([
    'as',
    'async',
    'await',
    'break',
    'const',
    'continue',
    'crate',
    'dyn',
    'else',
    'enum',
    'extern',
    'fn',
    'for',
    'if',
    'impl',
    'in',
    'let',
    'loop',
    'match',
    'mod',
    'move',
    'mut',
    'pub',
    'ref',
    'return',
    'self',
    'Self',
    'static',
    'struct',
    'super',
    'trait',
    'type',
    'unsafe',
    'use',
    'where',
    'while',
  ]),
  c: new Set([
    'auto',
    'break',
    'case',
    'char',
    'const',
    'continue',
    'default',
    'do',
    'double',
    'else',
    'enum',
    'extern',
    'float',
    'for',
    'goto',
    'if',
    'inline',
    'int',
    'long',
    'register',
    'return',
    'short',
    'signed',
    'sizeof',
    'static',
    'struct',
    'switch',
    'typedef',
    'union',
    'unsigned',
    'void',
    'volatile',
    'while',
  ]),
  cpp: new Set([
    'alignas',
    'alignof',
    'auto',
    'bool',
    'break',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'constexpr',
    'continue',
    'decltype',
    'default',
    'delete',
    'do',
    'double',
    'else',
    'enum',
    'explicit',
    'extern',
    'final',
    'float',
    'for',
    'friend',
    'if',
    'inline',
    'int',
    'long',
    'mutable',
    'namespace',
    'new',
    'noexcept',
    'operator',
    'override',
    'private',
    'protected',
    'public',
    'return',
    'short',
    'signed',
    'sizeof',
    'static',
    'struct',
    'switch',
    'template',
    'this',
    'throw',
    'try',
    'typedef',
    'typename',
    'union',
    'unsigned',
    'using',
    'virtual',
    'void',
    'volatile',
    'while',
  ]),
  swift: new Set([
    'actor',
    'as',
    'async',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'continue',
    'default',
    'defer',
    'do',
    'else',
    'enum',
    'extension',
    'fallthrough',
    'for',
    'func',
    'guard',
    'if',
    'import',
    'in',
    'init',
    'inout',
    'internal',
    'is',
    'let',
    'mutating',
    'open',
    'override',
    'private',
    'protocol',
    'public',
    'repeat',
    'return',
    'self',
    'static',
    'struct',
    'subscript',
    'super',
    'switch',
    'throw',
    'throws',
    'try',
    'typealias',
    'var',
    'where',
    'while',
  ]),
  ruby: new Set([
    'alias',
    'and',
    'begin',
    'break',
    'case',
    'class',
    'def',
    'do',
    'else',
    'elsif',
    'end',
    'ensure',
    'for',
    'if',
    'in',
    'module',
    'next',
    'not',
    'or',
    'redo',
    'require',
    'require_relative',
    'rescue',
    'retry',
    'return',
    'self',
    'super',
    'then',
    'unless',
    'until',
    'when',
    'while',
    'yield',
  ]),
  php: new Set([
    'abstract',
    'and',
    'array',
    'as',
    'break',
    'case',
    'catch',
    'class',
    'clone',
    'const',
    'continue',
    'declare',
    'default',
    'do',
    'echo',
    'else',
    'elseif',
    'enum',
    'extends',
    'final',
    'finally',
    'fn',
    'for',
    'foreach',
    'function',
    'global',
    'if',
    'implements',
    'include',
    'instanceof',
    'interface',
    'match',
    'namespace',
    'new',
    'or',
    'private',
    'protected',
    'public',
    'readonly',
    'require',
    'require_once',
    'return',
    'static',
    'switch',
    'throw',
    'trait',
    'try',
    'use',
    'var',
    'while',
    'yield',
  ]),
  shell: new Set([
    'case',
    'do',
    'done',
    'elif',
    'else',
    'esac',
    'export',
    'fi',
    'for',
    'function',
    'if',
    'in',
    'local',
    'readonly',
    'return',
    'set',
    'shift',
    'then',
    'unset',
    'until',
    'while',
  ]),
  sql: new Set([
    'add',
    'alter',
    'and',
    'as',
    'asc',
    'between',
    'by',
    'case',
    'column',
    'constraint',
    'create',
    'cross',
    'default',
    'delete',
    'desc',
    'distinct',
    'drop',
    'else',
    'end',
    'exists',
    'foreign',
    'from',
    'full',
    'group',
    'having',
    'in',
    'index',
    'inner',
    'insert',
    'into',
    'is',
    'join',
    'key',
    'left',
    'like',
    'limit',
    'not',
    'offset',
    'on',
    'or',
    'order',
    'outer',
    'primary',
    'references',
    'right',
    'select',
    'set',
    'table',
    'then',
    'union',
    'unique',
    'update',
    'values',
    'view',
    'when',
    'where',
  ]),
  dockerfile: new Set([
    'add',
    'arg',
    'cmd',
    'copy',
    'entrypoint',
    'env',
    'expose',
    'from',
    'healthcheck',
    'label',
    'maintainer',
    'onbuild',
    'run',
    'shell',
    'stopsignal',
    'user',
    'volume',
    'workdir',
    'as',
  ]),
}

const BUILTIN_TYPES_BY_LANG: Partial<Record<CodeLanguage, ReadonlySet<string>>> = {
  go: new Set([
    'any',
    'bool',
    'byte',
    'comparable',
    'complex64',
    'complex128',
    'error',
    'float32',
    'float64',
    'int',
    'int8',
    'int16',
    'int32',
    'int64',
    'rune',
    'string',
    'uint',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'uintptr',
  ]),
  rust: new Set([
    'bool',
    'char',
    'f32',
    'f64',
    'i8',
    'i16',
    'i32',
    'i64',
    'i128',
    'isize',
    'str',
    'u8',
    'u16',
    'u32',
    'u64',
    'u128',
    'usize',
    'Option',
    'Result',
    'String',
    'Vec',
    'Box',
  ]),
  typescript: new Set([
    'any',
    'bigint',
    'boolean',
    'never',
    'number',
    'object',
    'string',
    'symbol',
    'unknown',
    'void',
  ]),
  python: new Set([
    'bool',
    'bytes',
    'dict',
    'float',
    'int',
    'list',
    'object',
    'set',
    'str',
    'tuple',
  ]),
  sql: new Set([
    'bigint',
    'boolean',
    'char',
    'date',
    'decimal',
    'float',
    'int',
    'integer',
    'json',
    'jsonb',
    'numeric',
    'real',
    'serial',
    'smallint',
    'text',
    'timestamp',
    'uuid',
    'varchar',
  ]),
}

const BOOLEAN_LITERALS = new Set([
  'true',
  'false',
  'null',
  'nil',
  'none',
  'undefined',
  'nullptr',
  'True',
  'False',
  'None',
])

const YAML_BOOLEANS = new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off', '~'])

const HASH_COMMENT_LANGS = new Set<CodeLanguage>([
  'python',
  'shell',
  'ruby',
  'dockerfile',
  'makefile',
  'yaml',
  'toml',
  'ini',
  'php',
])

const SLASH_COMMENT_LANGS = new Set<CodeLanguage>([
  'go',
  'java',
  'kotlin',
  'javascript',
  'typescript',
  'json',
  'rust',
  'c',
  'cpp',
  'swift',
  'php',
  'css',
])

function pushToken(tokens: HighlightToken[], kind: TokenKind, text: string): void {
  if (!text) return
  const prev = tokens[tokens.length - 1]
  if (prev && prev.kind === kind) {
    tokens[tokens.length - 1] = { kind, text: prev.text + text }
    return
  }
  tokens.push({ kind, text })
}

export function detectCodeLanguage(filename: string): CodeLanguageMeta {
  const lower = filename.toLowerCase()
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) {
    return { id: 'dockerfile', label: LANGUAGE_LABELS.dockerfile }
  }
  if (lower === 'makefile' || lower === 'gnumakefile') {
    return { id: 'makefile', label: LANGUAGE_LABELS.makefile }
  }
  if (
    lower === '.env' ||
    lower.startsWith('.env.') ||
    lower === '.gitignore' ||
    lower === '.editorconfig'
  ) {
    return { id: 'ini', label: LANGUAGE_LABELS.ini }
  }

  const ext = getExtName(filename)
  const id = EXT_TO_LANGUAGE[ext] ?? 'plain'
  return { id, label: LANGUAGE_LABELS[id] }
}

function findUnquotedCommentIndex(raw: string, markers: readonly string[]): number {
  let quote: string | null = null
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (!ch) continue
    if (quote) {
      if (ch === '\\' && quote === '"') {
        i++
        continue
      }
      if (ch === quote) {
        quote = null
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (markers.includes(ch) && (i === 0 || /\s/.test(raw[i - 1] ?? ''))) {
      return i
    }
  }
  return -1
}

function splitTopLevelComma(inner: string): string[] {
  const parts: string[] = []
  let quote: string | null = null
  let depth = 0
  let start = 0

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (!ch) continue
    if (quote) {
      if (ch === '\\' && quote === '"') {
        i++
        continue
      }
      if (ch === quote) {
        quote = null
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '[' || ch === '{') {
      depth++
      continue
    }
    if ((ch === ']' || ch === '}') && depth > 0) {
      depth--
      continue
    }
    if (ch === ',' && depth === 0) {
      parts.push(inner.slice(start, i))
      start = i + 1
    }
  }

  parts.push(inner.slice(start))
  return parts
}

function consumeBlockComment(line: string, state: LineScanState, tokens: HighlightToken[]): number {
  if (!state.blockCommentEnd) return 0
  const endIdx = line.indexOf(state.blockCommentEnd)
  if (endIdx === -1) {
    pushToken(tokens, 'comment', line)
    return -1
  }
  const endPos = endIdx + state.blockCommentEnd.length
  pushToken(tokens, 'comment', line.slice(0, endPos))
  state.blockCommentEnd = null
  return endPos
}

function findTagCloseIndex(line: string, start: number): number {
  let quote: string | null = null
  for (let i = start; i < line.length; i++) {
    const ch = line[i]
    if (!ch) continue
    if (quote) {
      if (ch === quote) {
        quote = null
      }
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '>') {
      return i
    }
  }
  return -1
}

function tokenizeConfigValue(raw: string, language: 'yaml' | 'toml' | 'ini'): HighlightToken[] {
  const tokens: HighlightToken[] = []
  const markers = language === 'ini' ? ['#', ';'] : ['#']
  const commentIdx = findUnquotedCommentIndex(raw, markers)
  const valuePart = commentIdx === -1 ? raw : raw.slice(0, commentIdx)
  const commentPart = commentIdx === -1 ? '' : raw.slice(commentIdx)

  const trimmed = valuePart.trim()
  if (trimmed.length === 0) {
    if (valuePart) pushToken(tokens, 'plain', valuePart)
    if (commentPart) pushToken(tokens, 'comment', commentPart)
    return tokens
  }

  const leadLen = valuePart.length - valuePart.trimStart().length
  const trailLen = valuePart.length - valuePart.trimEnd().length
  if (leadLen > 0) pushToken(tokens, 'plain', valuePart.slice(0, leadLen))

  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    pushToken(tokens, 'punct', trimmed.slice(0, 1))
    const inner = trimmed.slice(1, -1)
    const parts = splitTopLevelComma(inner)
    for (let idx = 0; idx < parts.length; idx++) {
      const part = parts[idx] ?? ''
      const eqIdx = part.indexOf('=')
      const colonIdx = part.indexOf(':')
      const sepIdx = eqIdx !== -1 ? eqIdx : colonIdx
      if (trimmed.startsWith('{') && sepIdx > 0) {
        pushToken(tokens, 'key', part.slice(0, sepIdx))
        pushToken(tokens, 'punct', part.slice(sepIdx, sepIdx + 1))
        for (const sub of tokenizeConfigValue(part.slice(sepIdx + 1), language)) {
          pushToken(tokens, sub.kind, sub.text)
        }
      } else {
        for (const sub of tokenizeConfigValue(part, language)) {
          pushToken(tokens, sub.kind, sub.text)
        }
      }
      if (idx < parts.length - 1) {
        pushToken(tokens, 'punct', ',')
      }
    }
    pushToken(tokens, 'punct', trimmed.slice(-1))
  } else if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    pushToken(tokens, 'string', trimmed)
  } else if (
    language === 'yaml' &&
    (trimmed.startsWith('&') || trimmed.startsWith('*') || trimmed.startsWith('!'))
  ) {
    pushToken(tokens, 'meta', trimmed)
  } else if (
    (language === 'yaml' && YAML_BOOLEANS.has(trimmed.toLowerCase())) ||
    (language !== 'yaml' && BOOLEAN_LITERALS.has(trimmed.toLowerCase()))
  ) {
    pushToken(tokens, 'boolean', trimmed)
  } else if (/^-?(?:0x[0-9a-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)$/.test(trimmed)) {
    pushToken(tokens, 'number', trimmed)
  } else if (
    language === 'toml' &&
    /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(trimmed)
  ) {
    pushToken(tokens, 'number', trimmed)
  } else {
    pushToken(tokens, 'string', trimmed)
  }

  if (trailLen > 0) pushToken(tokens, 'plain', valuePart.slice(valuePart.length - trailLen))
  if (commentPart) pushToken(tokens, 'comment', commentPart)
  return tokens
}

function tokenizeConfigLine(line: string, language: 'yaml' | 'toml' | 'ini'): HighlightToken[] {
  const trimmed = line.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('#') || (language === 'ini' && trimmed.startsWith(';'))) {
    return [{ kind: 'comment', text: line }]
  }

  if (language === 'yaml' && (trimmed === '---' || trimmed === '...')) {
    return [{ kind: 'meta', text: line }]
  }

  if (language === 'toml' || language === 'ini') {
    const sectionMatch = /^(\s*)(\[+[^\]\r\n]+\]+)(.*)$/.exec(line)
    if (sectionMatch) {
      const tokens: HighlightToken[] = []
      const indent = sectionMatch[1] ?? ''
      const section = sectionMatch[2] ?? ''
      const rest = sectionMatch[3] ?? ''
      if (indent) pushToken(tokens, 'plain', indent)
      pushToken(tokens, 'section', section)
      if (rest) {
        const restTrim = rest.trimStart()
        if (restTrim.startsWith('#') || (language === 'ini' && restTrim.startsWith(';'))) {
          pushToken(tokens, 'comment', rest)
        } else {
          pushToken(tokens, 'plain', rest)
        }
      }
      return tokens
    }

    const kvMatch = /^(\s*)((?:"[^"]*"|'[^']*'|[^=:#;\s][^=]*?))(\s*=\s*)(.*)$/.exec(line)
    if (kvMatch) {
      const tokens: HighlightToken[] = []
      const indent = kvMatch[1] ?? ''
      const key = kvMatch[2] ?? ''
      const sep = kvMatch[3] ?? ''
      const val = kvMatch[4] ?? ''
      if (indent) pushToken(tokens, 'plain', indent)
      pushToken(tokens, 'key', key)
      pushToken(tokens, 'punct', sep)
      for (const tok of tokenizeConfigValue(val, language)) {
        pushToken(tokens, tok.kind, tok.text)
      }
      return tokens
    }
  }

  if (language === 'yaml') {
    const listKvMatch = /^(\s*)(-\s+)((?:"[^"]*"|'[^']*'|[\w./-]+))(:)(\s+.*|\s*)$/.exec(line)
    if (listKvMatch) {
      const tokens: HighlightToken[] = []
      pushToken(tokens, 'plain', listKvMatch[1] ?? '')
      pushToken(tokens, 'meta', listKvMatch[2] ?? '')
      pushToken(tokens, 'key', listKvMatch[3] ?? '')
      pushToken(tokens, 'punct', listKvMatch[4] ?? '')
      for (const tok of tokenizeConfigValue(listKvMatch[5] ?? '', 'yaml')) {
        pushToken(tokens, tok.kind, tok.text)
      }
      return tokens
    }

    const listMatch = /^(\s*)(-\s+)(.*)$/.exec(line)
    if (listMatch) {
      const tokens: HighlightToken[] = []
      pushToken(tokens, 'plain', listMatch[1] ?? '')
      pushToken(tokens, 'meta', listMatch[2] ?? '')
      for (const tok of tokenizeConfigValue(listMatch[3] ?? '', 'yaml')) {
        pushToken(tokens, tok.kind, tok.text)
      }
      return tokens
    }

    const kvMatch = /^(\s*)((?:"[^"]*"|'[^']*'|[\w./-]+))(:)(\s+.*|\s*)$/.exec(line)
    if (kvMatch) {
      const tokens: HighlightToken[] = []
      pushToken(tokens, 'plain', kvMatch[1] ?? '')
      pushToken(tokens, 'key', kvMatch[2] ?? '')
      pushToken(tokens, 'punct', kvMatch[3] ?? '')
      for (const tok of tokenizeConfigValue(kvMatch[4] ?? '', 'yaml')) {
        pushToken(tokens, tok.kind, tok.text)
      }
      return tokens
    }
  }

  return [{ kind: 'plain', text: line }]
}

function tokenizeJsonLine(line: string, state: LineScanState): HighlightToken[] {
  const tokens: HighlightToken[] = []
  let i = consumeBlockComment(line, state, tokens)
  if (i === -1) return tokens
  const len = line.length

  while (i < len) {
    const ch = line[i]
    if (!ch) break

    if (ch === '/' && line[i + 1] === '/') {
      pushToken(tokens, 'comment', line.slice(i))
      break
    }

    if (ch === '/' && line[i + 1] === '*') {
      const endIdx = line.indexOf('*/', i + 2)
      if (endIdx === -1) {
        pushToken(tokens, 'comment', line.slice(i))
        state.blockCommentEnd = '*/'
        break
      }
      pushToken(tokens, 'comment', line.slice(i, endIdx + 2))
      i = endIdx + 2
      continue
    }

    if (ch === '"') {
      let j = i + 1
      while (j < len) {
        if (line[j] === '\\' && j + 1 < len) {
          j += 2
          continue
        }
        if (line[j] === '"') {
          j++
          break
        }
        j++
      }
      const rest = line.slice(j).trimStart()
      const kind: TokenKind = rest.startsWith(':') ? 'key' : 'string'
      pushToken(tokens, kind, line.slice(i, j))
      i = j
      continue
    }

    if ((ch === '-' && /\d/.test(line[i + 1] ?? '')) || /\d/.test(ch)) {
      let j = i + 1
      while (j < len && /[\d.eE+-]/.test(line[j] ?? '')) j++
      pushToken(tokens, 'number', line.slice(i, j))
      i = j
      continue
    }

    if (/[a-zA-Z]/.test(ch)) {
      let j = i + 1
      while (j < len && /[a-zA-Z]/.test(line[j] ?? '')) j++
      const word = line.slice(i, j)
      const kind: TokenKind = BOOLEAN_LITERALS.has(word) ? 'boolean' : 'plain'
      pushToken(tokens, kind, word)
      i = j
      continue
    }

    if (/[{}[\]:,]/.test(ch)) {
      pushToken(tokens, 'punct', ch)
      i++
      continue
    }

    let j = i + 1
    while (j < len && /\s/.test(line[j] ?? '')) j++
    pushToken(tokens, 'plain', line.slice(i, j))
    i = j
  }

  return tokens
}

function tokenizeMarkupLine(line: string, state: LineScanState): HighlightToken[] {
  const tokens: HighlightToken[] = []
  let i = consumeBlockComment(line, state, tokens)
  if (i === -1) return tokens
  const len = line.length

  while (i < len) {
    if (line.startsWith('<!--', i)) {
      const endIdx = line.indexOf('-->', i + 4)
      if (endIdx === -1) {
        pushToken(tokens, 'comment', line.slice(i))
        state.blockCommentEnd = '-->'
        break
      }
      pushToken(tokens, 'comment', line.slice(i, endIdx + 3))
      i = endIdx + 3
      continue
    }

    if (line[i] === '<') {
      const closeIdx = findTagCloseIndex(line, i + 1)
      const tagEnd = closeIdx === -1 ? len : closeIdx + 1
      const segment = line.slice(i, tagEnd)
      let t = 0
      const segLen = segment.length
      if (segment.startsWith('</')) {
        pushToken(tokens, 'punct', '</')
        t = 2
      } else if (segment.startsWith('<!')) {
        pushToken(tokens, 'meta', segment)
        i = tagEnd
        continue
      } else {
        pushToken(tokens, 'punct', '<')
        t = 1
      }

      let nameEnd = t
      while (nameEnd < segLen && /[\w:-]/.test(segment[nameEnd] ?? '')) nameEnd++
      if (nameEnd > t) {
        pushToken(tokens, 'section', segment.slice(t, nameEnd))
        t = nameEnd
      }

      while (t < segLen) {
        const ch = segment[t]
        if (!ch) break
        if (ch === '>' || (ch === '/' && segment[t + 1] === '>')) {
          pushToken(tokens, 'punct', segment.slice(t))
          break
        }
        if (ch === '"' || ch === "'") {
          const quote = ch
          let q = t + 1
          while (q < segLen && segment[q] !== quote) q++
          if (q < segLen) q++
          pushToken(tokens, 'string', segment.slice(t, q))
          t = q
          continue
        }
        if (/[a-zA-Z@:#v-]/.test(ch)) {
          let a = t + 1
          while (a < segLen && /[\w:@.#-]/.test(segment[a] ?? '')) a++
          pushToken(tokens, 'key', segment.slice(t, a))
          t = a
          continue
        }
        if (ch === '=') {
          pushToken(tokens, 'punct', ch)
          t++
          continue
        }
        pushToken(tokens, 'plain', ch)
        t++
      }

      i = tagEnd
      continue
    }

    const nextTag = line.indexOf('<', i)
    if (nextTag === -1) {
      pushToken(tokens, 'plain', line.slice(i))
      break
    }
    pushToken(tokens, 'plain', line.slice(i, nextTag))
    i = nextTag
  }

  return tokens
}

function tokenizeCssLine(line: string, state: LineScanState): HighlightToken[] {
  const tokens: HighlightToken[] = []
  let i = consumeBlockComment(line, state, tokens)
  if (i === -1) return tokens
  const len = line.length

  while (i < len) {
    const ch = line[i]
    if (!ch) break

    if (ch === '/' && line[i + 1] === '*') {
      const endIdx = line.indexOf('*/', i + 2)
      if (endIdx === -1) {
        pushToken(tokens, 'comment', line.slice(i))
        state.blockCommentEnd = '*/'
        break
      }
      pushToken(tokens, 'comment', line.slice(i, endIdx + 2))
      i = endIdx + 2
      continue
    }

    if (ch === '/' && line[i + 1] === '/') {
      pushToken(tokens, 'comment', line.slice(i))
      break
    }

    if (ch === '@') {
      let j = i + 1
      while (j < len && /[\w-]/.test(line[j] ?? '')) j++
      pushToken(tokens, 'keyword', line.slice(i, j))
      i = j
      continue
    }

    if (ch === '"' || ch === "'") {
      const quote = ch
      let j = i + 1
      while (j < len) {
        if (line[j] === '\\' && j + 1 < len) {
          j += 2
          continue
        }
        if (line[j] === quote) {
          j++
          break
        }
        j++
      }
      pushToken(tokens, 'string', line.slice(i, j))
      i = j
      continue
    }

    if (ch === '#' && /[0-9a-fA-F]/.test(line[i + 1] ?? '')) {
      let j = i + 1
      while (j < len && /[0-9a-fA-F]/.test(line[j] ?? '')) j++
      pushToken(tokens, 'number', line.slice(i, j))
      i = j
      continue
    }

    if (/\d/.test(ch)) {
      let j = i + 1
      while (j < len && /[\d.%a-zA-Z-]/.test(line[j] ?? '')) j++
      pushToken(tokens, 'number', line.slice(i, j))
      i = j
      continue
    }

    if (/[a-zA-Z_-]/.test(ch)) {
      let j = i + 1
      while (j < len && /[\w-]/.test(line[j] ?? '')) j++
      const word = line.slice(i, j)
      const next = line.slice(j).trimStart()
      if (word.startsWith('--')) {
        pushToken(tokens, 'meta', word)
      } else if (next.startsWith(':') && !next.startsWith('::')) {
        pushToken(tokens, 'key', word)
      } else if (next.startsWith('(')) {
        pushToken(tokens, 'func', word)
      } else {
        pushToken(tokens, 'plain', word)
      }
      i = j
      continue
    }

    if (/[{}:;(),.>+~*]/.test(ch)) {
      pushToken(tokens, 'punct', ch)
      i++
      continue
    }

    pushToken(tokens, 'plain', ch)
    i++
  }

  return tokens
}

function classifyIdentifier(
  word: string,
  language: CodeLanguage,
  nextNonSpace: string | undefined,
): TokenKind {
  if (BOOLEAN_LITERALS.has(word)) {
    return 'boolean'
  }
  const keywords = KEYWORDS_BY_LANG[language]
  if (keywords) {
    const lookup = language === 'sql' || language === 'dockerfile' ? word.toLowerCase() : word
    if (keywords.has(lookup)) {
      return 'keyword'
    }
  }
  const builtinTypes = BUILTIN_TYPES_BY_LANG[language]
  if (builtinTypes) {
    const lookup = language === 'sql' ? word.toLowerCase() : word
    if (builtinTypes.has(lookup)) {
      return 'type'
    }
  }
  if (nextNonSpace === '(') {
    return 'func'
  }
  if (/^[A-Z][A-Za-z0-9_]*$/.test(word) && language !== 'sql' && language !== 'dockerfile') {
    return 'type'
  }
  return 'plain'
}

function tokenizeProgrammingLine(
  line: string,
  language: CodeLanguage,
  state: LineScanState,
): HighlightToken[] {
  const tokens: HighlightToken[] = []
  let i = consumeBlockComment(line, state, tokens)
  if (i === -1) return tokens
  const len = line.length

  if (state.tripleQuote) {
    const marker = state.tripleQuote.repeat(3)
    const endIdx = line.indexOf(marker, i)
    if (endIdx === -1) {
      pushToken(tokens, 'string', line.slice(i))
      return tokens
    }
    const endPos = endIdx + 3
    pushToken(tokens, 'string', line.slice(i, endPos))
    state.tripleQuote = null
    i = endPos
  }

  if (language === 'makefile') {
    const targetMatch = /^([A-Za-z0-9_.-]+)(:)(.*)$/.exec(line)
    if (targetMatch) {
      pushToken(tokens, 'section', targetMatch[1] ?? '')
      pushToken(tokens, 'punct', targetMatch[2] ?? '')
      pushToken(tokens, 'plain', targetMatch[3] ?? '')
      return tokens
    }
  }

  while (i < len) {
    const ch = line[i]
    if (!ch) break

    // Comments
    if (SLASH_COMMENT_LANGS.has(language) && ch === '/' && line[i + 1] === '/') {
      pushToken(tokens, 'comment', line.slice(i))
      break
    }
    if (SLASH_COMMENT_LANGS.has(language) && ch === '/' && line[i + 1] === '*') {
      const endIdx = line.indexOf('*/', i + 2)
      if (endIdx === -1) {
        pushToken(tokens, 'comment', line.slice(i))
        state.blockCommentEnd = '*/'
        break
      }
      pushToken(tokens, 'comment', line.slice(i, endIdx + 2))
      i = endIdx + 2
      continue
    }
    if (language === 'sql' && ch === '-' && line[i + 1] === '-') {
      pushToken(tokens, 'comment', line.slice(i))
      break
    }
    if (HASH_COMMENT_LANGS.has(language) && ch === '#') {
      pushToken(tokens, 'comment', line.slice(i))
      break
    }
    if ((language === 'c' || language === 'cpp') && ch === '#' && line.slice(0, i).trim() === '') {
      let j = i + 1
      while (j < len && /[a-zA-Z_]/.test(line[j] ?? '')) j++
      pushToken(tokens, 'meta', line.slice(i, j))
      i = j
      continue
    }

    // Annotations / decorators / attributes
    if (ch === '@' && /[A-Za-z_]/.test(line[i + 1] ?? '')) {
      let j = i + 1
      while (j < len && /[\w.]/.test(line[j] ?? '')) j++
      pushToken(tokens, 'meta', line.slice(i, j))
      i = j
      continue
    }

    // Shell / PHP / Makefile variables
    if (
      (language === 'shell' || language === 'php' || language === 'makefile') &&
      ch === '$' &&
      /[A-Za-z_{([*]/.test(line[i + 1] ?? '')
    ) {
      let j = i + 1
      if (line[j] === '{' || line[j] === '(') {
        const closeChar = line[j] === '{' ? '}' : ')'
        const closeIdx = line.indexOf(closeChar, j + 1)
        j = closeIdx === -1 ? len : closeIdx + 1
      } else {
        while (j < len && /\w/.test(line[j] ?? '')) j++
      }
      pushToken(tokens, 'meta', line.slice(i, j))
      i = j
      continue
    }

    // Python triple-quoted strings
    if (
      language === 'python' &&
      (ch === '"' || ch === "'") &&
      line.slice(i, i + 3) === ch.repeat(3)
    ) {
      const marker = ch.repeat(3)
      const endIdx = line.indexOf(marker, i + 3)
      if (endIdx === -1) {
        pushToken(tokens, 'string', line.slice(i))
        state.tripleQuote = ch
        break
      }
      pushToken(tokens, 'string', line.slice(i, endIdx + 3))
      i = endIdx + 3
      continue
    }

    // Strings
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      let j = i + 1
      while (j < len) {
        if (line[j] === '\\' && quote !== '`' && j + 1 < len) {
          j += 2
          continue
        }
        if (line[j] === quote) {
          j++
          break
        }
        j++
      }
      pushToken(tokens, 'string', line.slice(i, j))
      i = j
      continue
    }

    // Numbers
    if (/\d/.test(ch) && (i === 0 || !/[\w$]/.test(line[i - 1] ?? ''))) {
      let j = i + 1
      while (j < len && /[\d._xXbBoOa-fA-FLuU]/.test(line[j] ?? '')) j++
      pushToken(tokens, 'number', line.slice(i, j))
      i = j
      continue
    }

    // Identifiers
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1
      while (j < len && /[\w$]/.test(line[j] ?? '')) j++
      const word = line.slice(i, j)
      const afterWord = line.slice(j).trimStart()
      const nextNonSpace = afterWord[0]
      const kind = classifyIdentifier(word, language, nextNonSpace)
      pushToken(tokens, kind, word)
      i = j
      continue
    }

    // Special multi-char operators
    if (
      (ch === ':' && line[i + 1] === '=') ||
      (ch === '=' && line[i + 1] === '>') ||
      (ch === '-' && line[i + 1] === '>')
    ) {
      pushToken(tokens, 'meta', line.slice(i, i + 2))
      i += 2
      continue
    }

    // Punctuation
    if (/[{}()[\].,;:=<>!&|+\-/*?~^%]/.test(ch)) {
      pushToken(tokens, 'punct', ch)
      i++
      continue
    }

    // Whitespace
    let j = i + 1
    while (j < len && /\s/.test(line[j] ?? '')) j++
    pushToken(tokens, 'plain', line.slice(i, j))
    i = j
  }

  return tokens
}

export function tokenizeCode(source: string, language: CodeLanguage): readonly HighlightLine[] {
  const normalized = source.replace(/\r\n?/g, '\n')
  const rawLines = normalized.split('\n')

  if (
    language === 'plain' ||
    normalized.length > MAX_HIGHLIGHT_CHARS ||
    rawLines.length > MAX_HIGHLIGHT_LINES
  ) {
    return rawLines.map((text, index) => ({
      number: index + 1,
      tokens: text.length > 0 ? [{ kind: 'plain', text }] : [],
    }))
  }

  const state: LineScanState = {
    blockCommentEnd: null,
    tripleQuote: null,
  }

  return rawLines.map((line, index) => {
    let tokens: HighlightToken[]
    switch (language) {
      case 'yaml':
      case 'toml':
      case 'ini':
        tokens = tokenizeConfigLine(line, language)
        break
      case 'json':
        tokens = tokenizeJsonLine(line, state)
        break
      case 'html':
      case 'xml':
      case 'vue':
        tokens = tokenizeMarkupLine(line, state)
        break
      case 'css':
        tokens = tokenizeCssLine(line, state)
        break
      default:
        tokens = tokenizeProgrammingLine(line, language, state)
        break
    }

    return {
      number: index + 1,
      tokens,
    }
  })
}

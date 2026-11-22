import { describe, expect, it } from 'vitest'
import { detectCodeLanguage, tokenizeCode } from './highlight-code'
import type { HighlightLine, TokenKind } from './highlight-code'

function joinLineText(line: HighlightLine): string {
  return line.tokens.map((token) => token.text).join('')
}

function findTokenKind(line: HighlightLine, text: string): TokenKind | undefined {
  return line.tokens.find((token) => token.text === text)?.kind
}

describe('detectCodeLanguage', () => {
  it('detects common programming and config languages from filenames', () => {
    expect(detectCodeLanguage('server.go')).toEqual({ id: 'go', label: 'GO' })
    expect(detectCodeLanguage('FileService.java')).toEqual({ id: 'java', label: 'JAVA' })
    expect(detectCodeLanguage('upload.js')).toEqual({ id: 'javascript', label: 'JS' })
    expect(detectCodeLanguage('types.ts')).toEqual({ id: 'typescript', label: 'TS' })
    expect(detectCodeLanguage('docker-compose.yml')).toEqual({ id: 'yaml', label: 'YAML' })
    expect(detectCodeLanguage('dufs.toml')).toEqual({ id: 'toml', label: 'TOML' })
    expect(detectCodeLanguage('storage.ini')).toEqual({ id: 'ini', label: 'INI' })
    expect(detectCodeLanguage('.env.production')).toEqual({ id: 'ini', label: 'INI' })
    expect(detectCodeLanguage('Dockerfile')).toEqual({ id: 'dockerfile', label: 'DOCKER' })
    expect(detectCodeLanguage('Makefile')).toEqual({ id: 'makefile', label: 'MAKE' })
    expect(detectCodeLanguage('unknown.xyz')).toEqual({ id: 'plain', label: 'CODE' })
  })
})

describe('tokenizeCode', () => {
  it('highlights Go keywords, types, functions, strings, and comments', () => {
    const source = [
      'package main',
      '// start server',
      'func Start(port int) string {',
      '  addr := ":5000"',
      '  return addr',
      '}',
    ].join('\n')

    const lines = tokenizeCode(source, 'go')
    expect(lines).toHaveLength(6)
    expect(lines.map(joinLineText).join('\n')).toBe(source)

    expect(findTokenKind(lines[0] ?? { number: 1, tokens: [] }, 'package')).toBe('keyword')
    expect(lines[1]?.tokens).toEqual([{ kind: 'comment', text: '// start server' }])
    expect(findTokenKind(lines[2] ?? { number: 3, tokens: [] }, 'func')).toBe('keyword')
    expect(findTokenKind(lines[2] ?? { number: 3, tokens: [] }, 'Start')).toBe('func')
    expect(findTokenKind(lines[2] ?? { number: 3, tokens: [] }, 'int')).toBe('type')
    expect(findTokenKind(lines[2] ?? { number: 3, tokens: [] }, 'string')).toBe('type')
    expect(findTokenKind(lines[3] ?? { number: 4, tokens: [] }, ':=')).toBe('meta')
    expect(findTokenKind(lines[3] ?? { number: 4, tokens: [] }, '":5000"')).toBe('string')
  })

  it('highlights Java annotations and multi-line block comments', () => {
    const source = [
      '/*',
      ' * doc line',
      ' */',
      '@Override',
      'public boolean isReady() { return true; }',
    ].join('\n')

    const lines = tokenizeCode(source, 'java')
    expect(lines[0]?.tokens[0]?.kind).toBe('comment')
    expect(lines[1]?.tokens[0]?.kind).toBe('comment')
    expect(lines[2]?.tokens[0]?.kind).toBe('comment')
    expect(findTokenKind(lines[3] ?? { number: 4, tokens: [] }, '@Override')).toBe('meta')
    expect(findTokenKind(lines[4] ?? { number: 5, tokens: [] }, 'public')).toBe('keyword')
    expect(findTokenKind(lines[4] ?? { number: 5, tokens: [] }, 'isReady')).toBe('func')
    expect(findTokenKind(lines[4] ?? { number: 5, tokens: [] }, 'true')).toBe('boolean')
  })

  it('highlights YAML keys, list markers, booleans, numbers, strings, and comments', () => {
    const source = [
      '# compose file',
      'services:',
      '  port: 5000',
      '  allow_upload: true # inline comment',
      '  - "5000:5000"',
    ].join('\n')

    const lines = tokenizeCode(source, 'yaml')
    expect(lines.map(joinLineText).join('\n')).toBe(source)
    expect(lines[0]?.tokens[0]?.kind).toBe('comment')
    expect(findTokenKind(lines[1] ?? { number: 2, tokens: [] }, 'services')).toBe('key')
    expect(findTokenKind(lines[2] ?? { number: 3, tokens: [] }, '5000')).toBe('number')
    expect(findTokenKind(lines[3] ?? { number: 4, tokens: [] }, 'true')).toBe('boolean')
    expect(findTokenKind(lines[3] ?? { number: 4, tokens: [] }, '# inline comment')).toBe('comment')
    expect(findTokenKind(lines[4] ?? { number: 5, tokens: [] }, '- ')).toBe('meta')
    expect(findTokenKind(lines[4] ?? { number: 5, tokens: [] }, '"5000:5000"')).toBe('string')
  })

  it('highlights TOML and INI sections, keys, values, and semicolon comments', () => {
    const toml = ['[permissions]', 'allow-upload = true', 'port = 5000'].join('\n')
    const tomlLines = tokenizeCode(toml, 'toml')
    expect(findTokenKind(tomlLines[0] ?? { number: 1, tokens: [] }, '[permissions]')).toBe(
      'section',
    )
    expect(findTokenKind(tomlLines[1] ?? { number: 2, tokens: [] }, 'allow-upload')).toBe('key')
    expect(findTokenKind(tomlLines[1] ?? { number: 2, tokens: [] }, 'true')).toBe('boolean')
    expect(findTokenKind(tomlLines[2] ?? { number: 3, tokens: [] }, '5000')).toBe('number')

    const ini = ['; ini comment', '[server]', 'host = 127.0.0.1'].join('\n')
    const iniLines = tokenizeCode(ini, 'ini')
    expect(iniLines[0]?.tokens[0]?.kind).toBe('comment')
    expect(findTokenKind(iniLines[1] ?? { number: 2, tokens: [] }, '[server]')).toBe('section')
    expect(findTokenKind(iniLines[2] ?? { number: 3, tokens: [] }, 'host')).toBe('key')
  })

  it('normalizes CRLF line endings without losing content', () => {
    const lines = tokenizeCode('const a = 1\r\nconst b = 2', 'javascript')
    expect(lines).toHaveLength(2)
    expect(lines.map(joinLineText)).toEqual(['const a = 1', 'const b = 2'])
  })

  it('preserves exact whitespace in config lines and splits top-level array/table commas safely', () => {
    const yaml = 'services:   # section comment'
    const yamlLines = tokenizeCode(yaml, 'yaml')
    expect(yamlLines.map(joinLineText)).toEqual([yaml])

    const toml = ['args = ["a,b", "c"]', 'matrix = [[1, 2], [3, 4]]'].join('\n')
    const tomlLines = tokenizeCode(toml, 'toml')
    expect(tomlLines.map(joinLineText).join('\n')).toBe(toml)
    expect(findTokenKind(tomlLines[0] ?? { number: 1, tokens: [] }, '"a,b"')).toBe('string')
    expect(findTokenKind(tomlLines[0] ?? { number: 1, tokens: [] }, '"c"')).toBe('string')
    expect(findTokenKind(tomlLines[1] ?? { number: 2, tokens: [] }, '1')).toBe('number')
    expect(findTokenKind(tomlLines[1] ?? { number: 2, tokens: [] }, '4')).toBe('number')
  })

  it('handles > inside quoted Vue/HTML attribute values without truncating the tag', () => {
    const vue = '<button :disabled="count > 0" @click="() => save()">Save</button>'
    const lines = tokenizeCode(vue, 'vue')
    expect(lines.map(joinLineText)).toEqual([vue])
    expect(findTokenKind(lines[0] ?? { number: 1, tokens: [] }, 'button')).toBe('section')
    expect(findTokenKind(lines[0] ?? { number: 1, tokens: [] }, ':disabled')).toBe('key')
    expect(findTokenKind(lines[0] ?? { number: 1, tokens: [] }, '"count > 0"')).toBe('string')
    expect(findTokenKind(lines[0] ?? { number: 1, tokens: [] }, '@click')).toBe('key')
    expect(findTokenKind(lines[0] ?? { number: 1, tokens: [] }, '"() => save()"')).toBe('string')
  })
})

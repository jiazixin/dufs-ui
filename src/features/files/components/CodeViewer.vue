<script setup lang="ts">
import { computed } from 'vue'
import { detectCodeLanguage, tokenizeCode } from '../../../lib/highlight/highlight-code'
import type { TokenKind } from '../../../lib/highlight/highlight-code'

const { code, filename } = defineProps<{
  code: string
  filename: string
}>()

const languageMeta = computed(() => detectCodeLanguage(filename))
const lines = computed(() => tokenizeCode(code, languageMeta.value.id))

function tokenClass(kind: TokenKind): string | undefined {
  return kind === 'plain' ? undefined : `tok-${kind}`
}
</script>

<template>
  <div class="code-viewer" :data-language="languageMeta.id">
    <span class="code-lang-badge" aria-label="代码语言">{{ languageMeta.label }}</span>
    <div class="code-scroll">
      <pre class="code-pre"><code class="code-table"><span
        v-for="line in lines"
        :key="line.number"
        class="code-line"
      ><span class="line-num" aria-hidden="true">{{ line.number }}</span><span class="line-code"><span
        v-for="(token, idx) in line.tokens"
        :key="idx"
        :class="tokenClass(token.kind)"
      >{{ token.text }}</span></span></span></code></pre>
    </div>
  </div>
</template>

<style scoped>
.code-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--code-bg);
  color: var(--code-text);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.code-lang-badge {
  position: absolute;
  top: 10px;
  right: 14px;
  z-index: 2;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--code-border);
  background: var(--code-badge-bg);
  color: var(--code-badge-text);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  user-select: none;
  pointer-events: none;
}

.code-scroll {
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
}

.code-pre {
  margin: 0;
  min-width: 100%;
  min-height: 100%;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.65;
  tab-size: 4;
}

.code-pre ::selection {
  background: var(--code-selection);
}

.code-table {
  display: table;
  width: 100%;
  border-collapse: collapse;
  padding: 12px 0;
  font-family: inherit;
}

.code-line {
  display: table-row;
}

.code-line:hover {
  background: var(--code-line-hover);
}

.line-num {
  display: table-cell;
  width: 1%;
  min-width: 48px;
  padding: 0 12px 0 14px;
  text-align: right;
  vertical-align: top;
  user-select: none;
  color: var(--code-line-num);
  background: var(--code-gutter-bg);
  border-right: 1px solid var(--code-border);
  font-variant-numeric: tabular-nums;
}

.line-code {
  display: table-cell;
  padding: 0 72px 0 18px;
  white-space: pre;
}

.tok-comment {
  color: var(--tok-comment);
  font-style: italic;
}

.tok-keyword {
  color: var(--tok-keyword);
}

.tok-func {
  color: var(--tok-func);
}

.tok-section {
  color: var(--tok-section);
  font-weight: 600;
}

.tok-type {
  color: var(--tok-type);
}

.tok-key {
  color: var(--tok-key);
}

.tok-string {
  color: var(--tok-string);
}

.tok-number {
  color: var(--tok-number);
}

.tok-boolean {
  color: var(--tok-boolean);
}

.tok-meta {
  color: var(--tok-meta);
}

.tok-punct {
  color: var(--tok-punct);
}
</style>

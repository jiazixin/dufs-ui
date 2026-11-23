<script setup lang="ts">
import type { CodeIconLang } from '../types'

const { lang, size = 20 } = defineProps<{
  lang: CodeIconLang
  size?: number
}>()
</script>

<template>
  <svg
    class="code-brand-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :data-lang="lang"
    aria-hidden="true"
  >
    <template v-if="lang === 'python'">
      <path
        fill="var(--lang-py)"
        d="M11.9 2.5c-3.4 0-3.2 1.5-3.2 1.5v2.3h3.4v.7H6.2S3.5 6.7 3.5 11.2s2.4 4.3 2.4 4.3h1.4v-2.1s-.1-2.4 2.3-2.4h4s2.2 0 2.2-2.2V4.7s.3-2.2-3.9-2.2Zm-1.8 1.3a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7Z"
      />
      <path
        fill="var(--lang-py-2)"
        d="M12.1 21.5c3.4 0 3.2-1.5 3.2-1.5v-2.3h-3.4V17h5.9s2.7.3 2.7-4.2-2.4-4.3-2.4-4.3h-1.4v2.1s.1 2.4-2.3 2.4h-4s-2.2 0-2.2 2.2v4.1s-.3 2.2 3.9 2.2Zm1.8-1.3a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Z"
      />
    </template>

    <template v-else-if="lang === 'go'">
      <rect x="2" y="9.1" width="3.2" height="1.35" rx=".68" fill="var(--lang-go)" />
      <rect x="1.2" y="11.4" width="3.5" height="1.35" rx=".68" fill="var(--lang-go)" />
      <rect x="2.4" y="13.7" width="2.8" height="1.35" rx=".68" fill="var(--lang-go)" />
      <g transform="skewX(-8) translate(1.8 0)">
        <path
          fill="var(--lang-go)"
          d="M10.5 7.4c2.1 0 3.5.9 4 2.4l-2 .7c-.3-.7-.9-1.2-2-1.2-1.5 0-2.5 1.1-2.5 2.7s1 2.7 2.5 2.7c1.1 0 1.8-.5 2-1.4h-2.1v-1.7h4.2v1.2c0 2.6-1.7 3.8-4.1 3.8-2.7 0-4.6-1.9-4.6-4.6s1.9-4.6 4.6-4.6Z"
        />
        <path
          fill="var(--lang-go)"
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M19.2 7.4c2.6 0 4.4 1.9 4.4 4.6s-1.8 4.6-4.4 4.6-4.4-1.9-4.4-4.6 1.8-4.6 4.4-4.6Zm0 1.9c-1.4 0-2.3 1.1-2.3 2.7s.9 2.7 2.3 2.7 2.3-1.1 2.3-2.7-.9-2.7-2.3-2.7Z"
        />
      </g>
    </template>

    <template v-else-if="lang === 'java'">
      <path
        d="M10.2 9.4c-1-1.3 1.7-2.4.7-4.1-.4-.6-1.1-1-1.1-1"
        stroke="var(--lang-java)"
        stroke-width="1.75"
        stroke-linecap="round"
      />
      <path
        d="M13.8 9.2c-.8-1.1 1.5-2.1.6-3.5"
        stroke="var(--lang-java)"
        stroke-width="1.65"
        stroke-linecap="round"
      />
      <path
        fill="var(--lang-java-cup)"
        d="M5 11.2h10.5v3.6a4.7 4.7 0 0 1-4.7 4.7H9.7A4.7 4.7 0 0 1 5 14.8v-3.6Z"
      />
      <path
        d="M15.5 12.2h1.9a2 2 0 0 1 0 4h-1.9"
        stroke="var(--lang-java-cup)"
        stroke-width="1.9"
        stroke-linecap="round"
      />
      <path
        d="M4.2 21.1c3.8 1.2 9.2 1.2 13 0"
        stroke="var(--lang-java)"
        stroke-width="1.7"
        stroke-linecap="round"
      />
    </template>

    <template v-else-if="lang === 'ts'">
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.2" fill="var(--lang-ts)" />
      <text
        x="19.6"
        y="18.6"
        text-anchor="end"
        fill="var(--lang-on-brand)"
        class="brand-glyph-sans"
        font-size="10.2"
      >
        TS
      </text>
    </template>

    <template v-else-if="lang === 'js'">
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.2" fill="var(--lang-js-bg)" />
      <text
        x="19.6"
        y="18.6"
        text-anchor="end"
        fill="var(--lang-js-fg)"
        class="brand-glyph-sans"
        font-size="10.2"
      >
        JS
      </text>
    </template>

    <template v-else-if="lang === 'rust'">
      <path
        fill="var(--lang-rs)"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M12 2.2l1.4 2.1 2.4-.7.4 2.4 2.4.4-.7 2.4 2.1 1.4-1.6 1.9 1.6 1.9-2.1 1.4.7 2.4-2.4.4-.4 2.4-2.4-.7-1.4 2.1-1.4-2.1-2.4.7-.4-2.4-2.4-.4.7-2.4-2.1-1.4 1.6-1.9-1.6-1.9 2.1-1.4-.7-2.4 2.4-.4.4-2.4 2.4.7L12 2.2Zm0 4.3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
      />
      <text
        x="12"
        y="15.3"
        text-anchor="middle"
        fill="var(--lang-rs)"
        class="brand-glyph-serif"
        font-size="9.5"
      >
        R
      </text>
    </template>

    <template v-else-if="lang === 'vue'">
      <path fill="var(--lang-vue)" d="M2.2 4.4h4.3L12 13.8l5.5-9.4h4.3L12 20.8 2.2 4.4Z" />
      <path fill="var(--lang-vue-2)" d="M6.5 4.4h3.3L12 8.2l2.2-3.8h3.3L12 13.8 6.5 4.4Z" />
    </template>

    <template v-else-if="lang === 'c'">
      <path fill="var(--lang-cpp)" d="M12 2.4 20.4 7.2v9.6L12 21.6 3.6 16.8V7.2L12 2.4Z" />
      <path
        d="M15.4 15.1a4.8 4.8 0 1 1 0-6.2"
        stroke="var(--lang-on-brand)"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </template>

    <template v-else-if="lang === 'cpp'">
      <path fill="var(--lang-cpp)" d="M12 2.4 20.4 7.2v9.6L12 21.6 3.6 16.8V7.2L12 2.4Z" />
      <path
        d="M13.1 14.3a3.6 3.6 0 1 1 0-4.6"
        stroke="var(--lang-on-brand)"
        stroke-width="2.1"
        stroke-linecap="round"
      />
      <path
        d="M14.3 12h2.4M15.5 10.8v2.4M17.5 12h2.4M18.7 10.8v2.4"
        stroke="var(--lang-on-brand)"
        stroke-width="1.35"
        stroke-linecap="round"
      />
    </template>

    <template v-else-if="lang === 'html'">
      <path fill="var(--lang-html)" d="M4 3h16l-1.5 16.2L12 21l-6.5-1.8L4 3Z" />
      <path
        d="M16.2 7.5H8.4l.3 3.4h7.1l-.5 5.4-3.3.9-3.3-.9-.2-2.2"
        stroke="var(--lang-on-brand)"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="lang === 'css'">
      <path fill="var(--lang-css)" d="M4 3h16l-1.5 16.2L12 21l-6.5-1.8L4 3Z" />
      <path
        d="M8 7.5h8l-.5 4.2H9.2m6.1 0-.4 4.4-2.9.9-2.9-.9-.2-1.8"
        stroke="var(--lang-on-brand)"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="lang === 'json'">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="4"
        fill="var(--lang-json)"
        fill-opacity=".14"
      />
      <path
        d="M9.5 6.5c-1.4 0-2 .7-2 2v1.8c0 1-.6 1.7-1.6 1.7 1 0 1.6.7 1.6 1.7v1.8c0 1.3.6 2 2 2"
        stroke="var(--lang-json)"
        stroke-width="2"
        stroke-linecap="round"
      />
      <path
        d="M14.5 6.5c1.4 0 2 .7 2 2v1.8c0 1 .6 1.7 1.6 1.7-1 0-1.6.7-1.6 1.7v1.8c0 1.3-.6 2-2 2"
        stroke="var(--lang-json)"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="12" cy="10.2" r="1.15" fill="var(--lang-json)" />
      <circle cx="12" cy="14" r="1.15" fill="var(--lang-json)" />
    </template>

    <template v-else-if="lang === 'yaml'">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="var(--lang-yaml)" />
      <path
        d="M7.8 7.5 12 12.6l4.2-5.1M12 12.6v4.6"
        stroke="var(--lang-on-brand)"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="lang === 'sh'">
      <rect x="2.5" y="3.5" width="19" height="17" rx="3.2" fill="var(--lang-sh)" />
      <path
        d="m7 9.2 3.2 2.8L7 14.8M12.2 15h4.5"
        stroke="var(--lang-on-brand)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="lang === 'sql'">
      <ellipse cx="12" cy="6.2" rx="7.2" ry="2.8" fill="var(--lang-sql)" />
      <path
        fill="var(--lang-sql)"
        fill-opacity=".82"
        d="M4.8 7.6v4.1c0 1.55 3.22 2.8 7.2 2.8s7.2-1.25 7.2-2.8V7.6c-1.5 1.15-4.15 1.8-7.2 1.8s-5.7-.65-7.2-1.8Z"
      />
      <path
        fill="var(--lang-sql)"
        fill-opacity=".68"
        d="M4.8 13.4v4.2c0 1.55 3.22 2.8 7.2 2.8s7.2-1.25 7.2-2.8v-4.2c-1.5 1.15-4.15 1.8-7.2 1.8s-5.7-.65-7.2-1.8Z"
      />
    </template>

    <template v-else-if="lang === 'docker'">
      <rect x="6.5" y="8.2" width="2.4" height="2.2" rx=".4" fill="var(--lang-docker)" />
      <rect x="9.6" y="8.2" width="2.4" height="2.2" rx=".4" fill="var(--lang-docker)" />
      <rect x="12.7" y="8.2" width="2.4" height="2.2" rx=".4" fill="var(--lang-docker)" />
      <rect x="9.6" y="5.4" width="2.4" height="2.2" rx=".4" fill="var(--lang-docker)" />
      <rect x="12.7" y="5.4" width="2.4" height="2.2" rx=".4" fill="var(--lang-docker)" />
      <path
        fill="var(--lang-docker)"
        d="M3 12.2h13.8c1.1 0 1.8-.3 2.3-1.1.4-.7.4-1.6.1-2.2.8.4 1.6 1.2 1.8 2.2.7-.2 1.4 0 1.8.4-.5.9-1.5 1.4-2.5 1.5-.8 3.6-3.7 6.2-8.4 6.2-5.1 0-8.9-2.8-8.9-7Z"
      />
      <circle cx="8" cy="14.9" r=".95" fill="var(--lang-on-brand)" />
    </template>

    <template v-else-if="lang === 'kotlin'">
      <path fill="var(--lang-kt)" d="M3.5 3.5h17l-8.5 8.5 8.5 8.5h-17v-17Z" />
      <path fill="var(--lang-on-brand)" fill-opacity=".22" d="M3.5 3.5h8.5l-8.5 8.5v-8.5Z" />
    </template>

    <template v-else-if="lang === 'swift'">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4.2" fill="var(--lang-swift)" />
      <path
        fill="var(--lang-on-brand)"
        d="M17.8 14.9c.7-2.4-.5-5.6-3.1-7.4 1.3 1.9 1.3 4.1.2 5.4-1.8-1-4.1-2.5-6.1-4.3 1.1 1.7 2.5 3.3 4.1 4.6-2-.8-4.1-2-5.8-3.4 1.4 2.1 3.5 4 6 5.1-1.9.6-4.1.3-6.1-.8 1.9 2.3 5 3.4 8 2.6 1.2-.3 2.2-.1 3.1.8.3-1-.1-1.9-.3-2.6Z"
      />
    </template>

    <template v-else-if="lang === 'ruby'">
      <path fill="var(--lang-rb)" d="M6.5 4.2h11l3.7 5.2L12 20.5 2.8 9.4 6.5 4.2Z" />
      <path fill="var(--lang-on-brand)" fill-opacity=".22" d="M6.5 4.2 8.7 9.4h6.6l2.2-5.2h-11Z" />
      <path fill="var(--lang-on-brand)" fill-opacity=".14" d="M8.7 9.4 12 20.5l3.3-11.1H8.7Z" />
    </template>

    <template v-else-if="lang === 'php'">
      <ellipse cx="12" cy="12" rx="10" ry="6.4" fill="var(--lang-php)" />
      <text
        x="12"
        y="14.5"
        text-anchor="middle"
        fill="var(--lang-on-brand)"
        class="brand-glyph-italic"
        font-size="7.8"
      >
        php
      </text>
    </template>

    <template v-else-if="lang === 'terraform'">
      <path fill="var(--lang-tf)" d="M3.5 3.4 9.1 6.6v6.4L3.5 9.8V3.4Z" />
      <path fill="var(--lang-tf)" d="M9.7 7 15.3 10.2v6.4l-5.6-3.2V7Z" />
      <path fill="var(--lang-tf)" d="M9.7 14.2 15.3 17.4v4.4l-5.6-3.2v-4.4Z" />
      <path fill="var(--lang-tf-2)" d="M15.9 10.2 21.5 7v6.4l-5.6 3.2v-6.4Z" />
    </template>

    <template v-else-if="lang === 'opentofu'">
      <path fill="var(--lang-tofu)" d="M12 2.6 20.4 7.2 12 11.8 3.6 7.2 12 2.6Z" />
      <path fill="var(--lang-tofu-2)" d="M3.6 8.3 11.4 12.6v8.6L3.6 16.9V8.3Z" />
      <path fill="var(--lang-tofu)" d="M20.4 8.3 12.6 12.6v8.6l7.8-4.3V8.3Z" />
      <circle cx="9.6" cy="6.8" r=".9" fill="var(--lang-tofu-fg)" />
      <circle cx="14.4" cy="6.8" r=".9" fill="var(--lang-tofu-fg)" />
      <path
        d="M10.1 8.4c1.1.8 2.7.8 3.8 0"
        stroke="var(--lang-tofu-fg)"
        stroke-width="1.2"
        stroke-linecap="round"
      />
    </template>
  </svg>
</template>

<style scoped>
.code-brand-icon {
  display: block;
  flex-shrink: 0;
}

.brand-glyph-sans {
  font-family: var(--font-sans);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.brand-glyph-serif {
  font-family: Georgia, serif;
  font-weight: 900;
}

.brand-glyph-italic {
  font-family: var(--font-sans);
  font-weight: 800;
  font-style: italic;
  letter-spacing: -0.02em;
}
</style>

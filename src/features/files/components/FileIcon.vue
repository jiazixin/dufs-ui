<script setup lang="ts">
import { computed } from 'vue'
import {
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
} from '@lucide/vue'
import { detectFileKind } from '../file-types'
import type { FileKind, PathItem } from '../types'

const { item, size = 20 } = defineProps<{
  item: PathItem
  size?: number
}>()

const kind = computed<FileKind>(() => detectFileKind(item))
</script>

<template>
  <span class="file-icon-thin" :class="`is-${kind}`" aria-hidden="true">
    <Folder v-if="kind === 'dir'" :size="size" :stroke-width="1.6" />
    <FileImage v-else-if="kind === 'image'" :size="size" :stroke-width="1.6" />
    <FileVideo v-else-if="kind === 'video'" :size="size" :stroke-width="1.6" />
    <FileAudio v-else-if="kind === 'audio'" :size="size" :stroke-width="1.6" />
    <FileText v-else-if="kind === 'pdf' || kind === 'text'" :size="size" :stroke-width="1.6" />
    <FileArchive v-else-if="kind === 'archive'" :size="size" :stroke-width="1.6" />
    <FileCode v-else-if="kind === 'code'" :size="size" :stroke-width="1.6" />
    <FileSpreadsheet v-else-if="kind === 'doc'" :size="size" :stroke-width="1.6" />
    <File v-else :size="size" :stroke-width="1.6" />
  </span>
</template>

<style scoped>
.file-icon-thin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.is-dir {
  color: var(--ft-dir);
}

.is-image {
  color: var(--ft-image);
}

.is-video {
  color: var(--ft-video);
}

.is-audio {
  color: var(--ft-audio);
}

.is-pdf {
  color: var(--ft-pdf);
}

.is-archive {
  color: var(--ft-archive);
}

.is-code {
  color: var(--ft-code);
}

.is-text {
  color: var(--ft-text);
}

.is-doc {
  color: var(--ft-doc);
}

.is-file {
  color: var(--ft-file);
}
</style>

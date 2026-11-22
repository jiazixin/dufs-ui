<script setup lang="ts">
const { size = 30 } = defineProps<{
  size?: number
}>()
</script>

<template>
  <svg
    class="brand-logo"
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect class="logo-bg" width="32" height="32" rx="8" />
    <rect x="8.5" y="7.8" width="4" height="16.4" rx="2" fill="currentColor" fill-opacity="0.44" />
    <path
      d="M15.4 9.8H16.2A6.2 6.2 0 0 1 16.2 22.2H15.4"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>
.brand-logo {
  display: block;
  flex-shrink: 0;
  color: var(--accent-fg);
}

.logo-bg {
  fill: var(--accent);
}
</style>

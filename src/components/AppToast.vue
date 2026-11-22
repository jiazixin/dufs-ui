<script setup lang="ts">
import { useToast } from '../app/toast'

const { items } = useToast()
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <div
      v-for="item in items"
      :key="item.id"
      class="toast"
      :class="`is-${item.tone}`"
      role="status"
    >
      {{ item.message }}
    </div>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 66px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast {
  padding: 9px 16px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--accent-fg);
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--shadow-md);
}

.toast.is-success {
  background: var(--success);
  color: var(--success-fg);
}

.toast.is-error {
  background: var(--danger);
  color: var(--danger-fg);
}
</style>

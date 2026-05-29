<template>
  <div :class="['session-flex-layout', { 'session-flex-layout--normal': !isFlexMode }]">
    <div class="session-top-panel">
      <slot name="top" />
    </div>
    <div class="session-bottom-panel">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup>
import { isFlexMode } from '@/composables/useFlexMode.js'
</script>

<style scoped>
/* Normal (unfolded): single scrollable column */
.session-flex-layout--normal {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.session-flex-layout--normal .session-top-panel,
.session-flex-layout--normal .session-bottom-panel {
  /* Both panels flow naturally in a single column */
}

/* Flex (tabletop) mode is applied globally via flex-mode.css using class names */
</style>

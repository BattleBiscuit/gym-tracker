<template>
  <div class="progress-bar-wrap" :title="`${percent}%`">
    <div class="progress-bar__fill" :style="{ width: percent + '%' }" />
  </div>
</template>

<script setup>
defineProps({
  percent: { type: Number, default: 0 },
})
</script>

<style scoped>
.progress-bar-wrap {
  height: 3px;
  background-color: var(--color-surface-2);
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background-color: var(--color-accent);
  transition: width 0.4s ease;
}
</style>

<template>
  <div class="slider-wrap">
    <!-- Track: all slides side by side, clips to one at a time -->
    <div
      class="slider-track"
      ref="trackRef"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div
        class="slider-inner"
        :style="{ transform: `translateX(calc(${-activeIndex * 100}% + ${dragPct}px))` }"
      >
        <div class="slider-slide" v-for="(slide, i) in slides" :key="i">
          <div class="slide-header">
            <h2 class="slide-title">{{ slide.title }}</h2>
            <slot :name="`controls-${i}`" />
          </div>
          <slot :name="`slide-${i}`" />
        </div>
      </div>
    </div>

    <!-- Dots -->
    <div class="slider-dots">
      <button
        v-for="(_, i) in slides"
        :key="i"
        :class="['dot', { 'dot--active': i === activeIndex }]"
        @click="goTo(i)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  slides: { type: Array, required: true }, // [{ title }]
})

const activeIndex = ref(0)
const dragPct     = ref(0)
const trackRef    = ref(null)

let startX = 0
let startY = 0
let dragging = false

function goTo(i) {
  activeIndex.value = Math.max(0, Math.min(props.slides.length - 1, i))
}

function onTouchStart(e) {
  startX   = e.touches[0].clientX
  startY   = e.touches[0].clientY
  dragging = true
  dragPct.value = 0
}

function onTouchMove(e) {
  if (!dragging) return
  const dx = e.touches[0].clientX - startX
  const dy = e.touches[0].clientY - startY
  if (Math.abs(dy) > Math.abs(dx) + 5) { dragging = false; return }
  dragPct.value = dx
}

function onTouchEnd() {
  if (!dragging) return
  dragging = false
  const threshold = (trackRef.value?.offsetWidth || 300) * 0.25
  if (dragPct.value < -threshold) goTo(activeIndex.value + 1)
  else if (dragPct.value > threshold) goTo(activeIndex.value - 1)
  dragPct.value = 0
}
</script>

<style scoped>
.slider-wrap { display: flex; flex-direction: column; gap: var(--space-3); }

.slider-track { overflow: hidden; width: 100%; }

.slider-inner {
  display: flex;
  transition: transform 300ms ease;
  will-change: transform;
}

.slider-slide {
  flex: 0 0 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.slide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slide-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.slider-dots {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.dot {
  width: 6px; height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-surface-3);
  transition: background var(--transition-fast), transform var(--transition-fast);
}
.dot--active { background: var(--color-accent); transform: scale(1.3); }
</style>

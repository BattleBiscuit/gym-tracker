<template>
  <div class="radar-wrap">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart, RadarController, RadialLinearScale,
  PointElement, LineElement, Filler, Tooltip,
} from 'chart.js'

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps({
  data: { type: Array, default: () => [] }, // [{ muscle, count }]
})

const canvasRef = ref(null)
let chart = null

function buildChart() {
  if (!canvasRef.value) return
  if (chart) { chart.destroy(); chart = null }
  if (!props.data.length) return

  chart = new Chart(canvasRef.value, {
    type: 'radar',
    data: {
      labels: props.data.map(d => d.muscle),
      datasets: [{
        data: props.data.map(d => d.count),
        backgroundColor: 'rgba(232, 255, 71, 0.12)',
        borderColor: '#e8ff47',
        borderWidth: 2,
        pointBackgroundColor: '#e8ff47',
        pointRadius: 3,
        pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.2,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.r} session${ctx.parsed.r !== 1 ? 's' : ''}`,
          },
          backgroundColor: '#1a1a1a',
          borderColor: '#2e2e2e',
          borderWidth: 1,
          titleColor: '#9e9e9e',
          bodyColor: '#f5f5f5',
          padding: 10,
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            display: false,
            stepSize: 1,
          },
          grid:        { color: '#2e2e2e' },
          angleLines:  { color: '#2e2e2e' },
          pointLabels: {
            color: '#9e9e9e',
            font: { size: 11 },
          },
        },
      },
    },
  })
}

let ro = null

onMounted(() => {
  buildChart()
  ro = new ResizeObserver(() => {
    if (canvasRef.value?.offsetWidth > 0) {
      if (!chart) buildChart()
      else chart.resize()
    }
  })
  if (canvasRef.value) ro.observe(canvasRef.value)
})

watch(() => props.data, buildChart, { deep: true })
onUnmounted(() => { if (chart) chart.destroy(); if (ro) ro.disconnect() })
</script>

<style scoped>
.radar-wrap {
  width: 100%;
  background: var(--color-surface-1);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
</style>

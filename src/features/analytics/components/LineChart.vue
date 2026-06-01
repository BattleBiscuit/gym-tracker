<template>
  <div class="chart-wrap">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const props = defineProps({
  data:   { type: Array, default: () => [] }, // [{ label, value }]
  color:  { type: String, default: '#e8ff47' },
  unit:   { type: String, default: '' },
})

const canvasRef = ref(null)
let chart = null

function buildChart() {
  if (!canvasRef.value) return
  if (chart) { chart.destroy(); chart = null }
  if (!props.data.length) return

  chart = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: props.data.map(d => d.label),
      datasets: [{
        data: props.data.map(d => d.value),
        borderColor: props.color,
        backgroundColor: props.color + '18',
        borderWidth: 2,
        pointRadius: props.data.length > 20 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: props.color,
        tension: 0.3,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y}${props.unit ? ' ' + props.unit : ''}`,
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
        x: {
          ticks: { color: '#616161', font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
          grid: { color: '#1a1a1a' },
          border: { color: '#2e2e2e' },
        },
        y: {
          ticks: { color: '#616161', font: { size: 11 } },
          grid: { color: '#1a1a1a' },
          border: { color: '#2e2e2e' },
          beginAtZero: false,
        },
      },
    },
  })
}

let ro = null

onMounted(() => {
  buildChart()
  // Rebuild when canvas becomes visible (e.g. switching from hidden tab)
  ro = new ResizeObserver(() => {
    if (canvasRef.value && canvasRef.value.offsetWidth > 0) {
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
.chart-wrap {
  position: relative;
  width: 100%;
  background: var(--color-surface-1);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
}
</style>

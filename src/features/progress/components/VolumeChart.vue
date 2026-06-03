<template>
  <div class="chart-wrap">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  Chart, BarController, BarElement,
  LinearScale, CategoryScale, Tooltip,
} from 'chart.js'

Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip)

const props = defineProps({
  data: { type: Array, default: () => [] }, // [{ week, volume }]
})

const canvasRef = ref(null)
let chart = null

function buildChart() {
  if (!canvasRef.value) return
  if (chart) { chart.destroy(); chart = null }
  if (!props.data.length) return

  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.data.map(d => d.week),
      datasets: [{
        data: props.data.map(d => d.volume),
        backgroundColor: 'rgba(232,255,71,0.5)',
        borderColor: '#e8ff47',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.6,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y
              return v >= 1000 ? `${(v/1000).toFixed(1)}t` : `${Math.round(v)}kg`
            },
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
          ticks: { color: '#616161', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
          grid: { display: false },
          border: { color: '#2e2e2e' },
        },
        y: {
          ticks: {
            color: '#616161', font: { size: 10 },
            callback: v => v >= 1000 ? `${(v/1000).toFixed(0)}t` : `${v}kg`,
          },
          grid: { color: '#1a1a1a' },
          border: { color: '#2e2e2e' },
          beginAtZero: true,
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
.chart-wrap {
  width: 100%;
  background: var(--color-surface-1);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
</style>

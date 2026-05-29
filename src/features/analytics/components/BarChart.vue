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
  data:  { type: Array, default: () => [] }, // [{ label, value }]
  color: { type: String, default: '#e8ff47' },
  unit:  { type: String, default: '' },
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
      labels: props.data.map(d => d.label),
      datasets: [{
        data: props.data.map(d => d.value),
        backgroundColor: props.color + 'aa',
        borderColor: props.color,
        borderWidth: 1,
        borderRadius: 4,
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
            label: ctx => `${ctx.parsed.y.toLocaleString()}${props.unit ? ' ' + props.unit : ''}`,
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
          ticks: { color: '#616161', font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
          grid: { display: false },
          border: { color: '#2e2e2e' },
        },
        y: {
          ticks: { color: '#616161', font: { size: 11 } },
          grid: { color: '#1a1a1a' },
          border: { color: '#2e2e2e' },
          beginAtZero: true,
        },
      },
    },
  })
}

onMounted(buildChart)
watch(() => props.data, buildChart, { deep: true })
onUnmounted(() => { if (chart) chart.destroy() })
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

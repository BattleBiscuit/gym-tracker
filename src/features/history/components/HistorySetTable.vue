<template>
  <div class="set-table">
    <div class="set-table__exercise-name">{{ exerciseName }}</div>
    <table class="set-table__table">
      <thead>
        <tr>
          <th>Set</th>
          <th>Planned</th>
          <th>Actual</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(set, idx) in sets" :key="idx" :class="{ 'row--skipped': set.skipped }">
          <td>{{ idx + 1 }}</td>
          <td>
            <template v-if="set.type === 'cardio'">{{ set.plannedDuration }}min · lvl{{ set.plannedLevel }}</template>
            <template v-else>{{ set.plannedReps }}×{{ formatWeight(set.plannedWeight, set.isBodyweight) }}</template>
          </td>
          <td>
            <template v-if="set.skipped">—</template>
            <template v-else-if="set.type === 'cardio' && set.actualDuration != null">
              {{ set.actualDuration }}min · lvl{{ set.actualLevel }}
            </template>
            <template v-else-if="set.actualReps != null">
              {{ set.actualReps }}×{{ formatWeight(set.actualWeight, set.isBodyweight) }}
            </template>
            <template v-else>—</template>
          </td>
          <td>
            <AppBadge v-if="set.skipped" variant="default">Skip</AppBadge>
            <AppBadge v-else variant="success">✓</AppBadge>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import AppBadge from '@/components/ui/AppBadge.vue'
import { formatWeight } from '@/utils/formatWeight.js'

defineProps({
  exerciseName: { type: String, required: true },
  sets:         { type: Array, required: true },
})
</script>

<style scoped>
.set-table {
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.set-table__exercise-name {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-1);
  border-bottom: 1px solid var(--color-border);
}

.set-table__table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: left;
  background-color: var(--color-surface-2);
}

td {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-1);
  border-top: 1px solid var(--color-border);
}

.row--skipped td {
  opacity: 0.45;
}
</style>

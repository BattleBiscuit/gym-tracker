<template>
  <div class="set-table">
    <div class="set-table__exercise-name">{{ exerciseName }}</div>
    <table class="set-table__table">
      <thead>
        <tr>
          <th>Set</th>
          <th>Planned</th>
          <th>Actual</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(set, idx) in sets" :key="set.id" :class="{ 'row--skipped': set.skipped && !editing }">
          <td>{{ idx + 1 }}</td>
          <td>
            <template v-if="set.type === 'cardio'">{{ set.plannedDuration }}min · lvl{{ set.plannedLevel }}</template>
            <template v-else>{{ set.plannedReps }}×{{ formatWeight(set.plannedWeight, set.isBodyweight) }}</template>
          </td>

          <!-- Actual — read or edit -->
          <td>
            <template v-if="!editing">
              <template v-if="set.skipped">—</template>
              <template v-else-if="set.type === 'cardio' && set.actualDuration != null">
                {{ set.actualDuration }}min · lvl{{ set.actualLevel }}
              </template>
              <template v-else-if="set.actualReps != null">
                <span v-if="set.isPR" class="pr-inline">🏆</span>{{ set.actualReps }}×{{ formatWeight(set.actualWeight, set.isBodyweight) }}
              </template>
              <template v-else>—</template>
            </template>

            <!-- Edit mode inputs -->
            <template v-else>
              <div class="edit-inputs" v-if="set.type !== 'cardio'">
                <input class="edit-input" type="text" inputmode="numeric"
                  :value="localEdits[set.id]?.reps ?? set.actualReps ?? set.plannedReps"
                  @input="setEdit(set.id, 'reps', $event.target.value)"
                  placeholder="reps" />
                <span class="edit-sep">×</span>
                <button :class="['edit-bw', { 'edit-bw--active': localEdits[set.id]?.isBodyweight ?? set.isBodyweight }]"
                  type="button" @click="toggleBW(set)">BW</button>
                <input class="edit-input" type="text" inputmode="decimal"
                  :value="localEdits[set.id]?.weight ?? set.actualWeight ?? set.plannedWeight"
                  @input="setEdit(set.id, 'weight', $event.target.value)"
                  placeholder="kg" />
              </div>
              <div class="edit-inputs" v-else>
                <input class="edit-input" type="text" inputmode="numeric"
                  :value="localEdits[set.id]?.duration ?? set.actualDuration ?? set.plannedDuration"
                  @input="setEdit(set.id, 'duration', $event.target.value)"
                  placeholder="min" />
                <span class="edit-sep">lvl</span>
                <input class="edit-input" type="text" inputmode="numeric"
                  :value="localEdits[set.id]?.level ?? set.actualLevel ?? set.plannedLevel"
                  @input="setEdit(set.id, 'level', $event.target.value)"
                  placeholder="lvl" />
              </div>
            </template>
          </td>

          <td>
            <template v-if="!editing">
              <AppBadge v-if="set.skipped" variant="default">Skip</AppBadge>
              <template v-else>
                <AppBadge variant="success">✓</AppBadge>
              </template>
            </template>
            <!-- Edit: skipped toggle -->
            <template v-else>
              <button :class="['skip-toggle', { 'skip-toggle--skipped': localEdits[set.id]?.skipped ?? set.skipped }]"
                type="button" @click="toggleSkip(set)">
                {{ (localEdits[set.id]?.skipped ?? set.skipped) ? 'Skip' : '✓' }}
              </button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Dexie from 'dexie'
import AppBadge from '@/components/ui/AppBadge.vue'
import { formatWeight, resolveWeight } from '@/utils/formatWeight.js'
import { bodyweight } from '@/composables/useConfig.js'
import { db } from '@/db/index.js'

const props = defineProps({
  exerciseName: { type: String, required: true },
  sets:         { type: Array, required: true },
  editing:      { type: Boolean, default: false },
})

const emit = defineEmits(['save'])

// Bodyweight at the time of this session — resolved once on mount
const sessionBodyweight = ref(null)

onMounted(async () => {
  const sessionAt = props.sets[0]?.startedAt
  if (!sessionAt) return
  const entry = await db.bodyMetrics
    .where('[type+loggedAt]')
    .between(['weight', Dexie.minKey], ['weight', sessionAt], false, true)
    .last()
  sessionBodyweight.value = entry?.value ?? null
})

// Local edits map: setId → { reps, weight, isBodyweight, duration, level, skipped }
const localEdits = ref({})

function setEdit(id, field, value) {
  if (!localEdits.value[id]) localEdits.value[id] = {}
  localEdits.value[id][field] = value === '' ? null : field === 'reps' || field === 'level'
    ? parseInt(value) : parseFloat(value)
}

function toggleBW(set) {
  if (!localEdits.value[set.id]) localEdits.value[set.id] = {}
  const current = localEdits.value[set.id].isBodyweight ?? set.isBodyweight
  localEdits.value[set.id].isBodyweight = !current
}

function toggleSkip(set) {
  if (!localEdits.value[set.id]) localEdits.value[set.id] = {}
  const current = localEdits.value[set.id].skipped ?? set.skipped
  localEdits.value[set.id].skipped = !current
}

// Called by parent to get pending changes
function getChanges() {
  const bw = sessionBodyweight.value ?? bodyweight.value ?? 0
  const changes = []
  for (const set of props.sets) {
    const edits = localEdits.value[set.id]
    if (!edits || !Object.keys(edits).length) continue
    const isBodyweight = edits.isBodyweight ?? set.isBodyweight
    const actualWeight = edits.weight ?? set.actualWeight
    const actualReps   = edits.reps   ?? set.actualReps
    changes.push({
      id: set.id,
      actualReps,
      actualWeight,
      isBodyweight,
      effectiveWeight: set.type !== 'cardio'
        ? resolveWeight(actualWeight, isBodyweight, bw)
        : null,
      actualDuration: edits.duration ?? set.actualDuration,
      actualLevel:    edits.level    ?? set.actualLevel,
      skipped:        edits.skipped  ?? set.skipped,
      completedAt:    (edits.skipped ?? set.skipped) ? set.completedAt : (set.completedAt || Date.now()),
    })
  }
  return changes
}

function resetEdits() {
  localEdits.value = {}
}

defineExpose({ getChanges, resetEdits })
</script>

<style scoped>
.set-table { background: var(--color-surface-1); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.set-table__exercise-name { padding: var(--space-3) var(--space-4); font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--color-text-1); border-bottom: 1px solid var(--color-border); }
.set-table__table { width: 100%; border-collapse: collapse; }

th { padding: var(--space-2) var(--space-4); font-size: var(--text-xs); color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.08em; text-align: left; background: var(--color-surface-2); }
td { padding: var(--space-3) var(--space-4); font-size: var(--text-sm); color: var(--color-text-1); border-top: 1px solid var(--color-border); }
.row--skipped td { opacity: 0.45; }
.pr-inline { font-size: 11px; margin-right: 3px; }

/* Edit inputs */
.edit-inputs { display: flex; align-items: center; gap: 4px; }
.edit-input {
  width: 44px; text-align: center; font-size: var(--text-sm); font-weight: var(--font-semibold);
  color: var(--color-text-1); background: var(--color-surface-2);
  border: 1px solid var(--color-accent); border-radius: var(--radius-sm);
  padding: 2px 4px; height: 26px;
  user-select: text; -webkit-user-select: text;
}
.edit-input:focus { outline: none; }
.edit-sep { font-size: var(--text-xs); color: var(--color-text-3); }

.edit-bw {
  height: 26px; padding: 0 4px; font-size: 10px; font-weight: var(--font-bold);
  color: var(--color-text-3); background: transparent;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
}
.edit-bw--active { background: var(--color-accent); color: #0f0f0f; border-color: var(--color-accent); }

.skip-toggle {
  font-size: var(--text-xs); font-weight: var(--font-bold);
  padding: 2px var(--space-2); border-radius: var(--radius-sm);
  border: 1px solid var(--color-border); color: var(--color-text-2);
  transition: all var(--transition-fast);
}
.skip-toggle--skipped { background: var(--color-surface-3); color: var(--color-text-3); }
</style>

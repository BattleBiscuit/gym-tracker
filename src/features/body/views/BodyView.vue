<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Body</span>
    </template>

    <!-- Current metrics grid -->
    <div class="body-content">
      <div class="metrics-grid">
        <div
          v-for="metric in METRIC_TYPES"
          :key="metric.key"
          class="metric-card"
          @click="openLog(metric)"
        >
          <span class="metric-icon">{{ metric.icon }}</span>
          <div class="metric-body">
            <span class="metric-label">{{ metric.label }}</span>
            <span class="metric-value" v-if="store.latest[metric.key]">
              {{ store.latest[metric.key].value }}{{ metric.unit }}
            </span>
            <span class="metric-value metric-value--empty" v-else>—</span>
            <span class="metric-date" v-if="store.latest[metric.key]">
              {{ formatDate(store.latest[metric.key].loggedAt) }}
            </span>
          </div>
          <svg class="metric-add" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
      </div>

      <!-- History per metric -->
      <section
        v-for="metric in METRIC_TYPES"
        :key="metric.key + '-history'"
        v-if="store.history[metric.key]?.length"
        class="history-section"
      >
        <div class="section-header">
          <h2 class="section-title">{{ metric.label }} history</h2>
        </div>
        <div class="history-list">
          <div
            v-for="entry in [...(store.history[metric.key] || [])].reverse().slice(0, showAll[metric.key] ? 999 : 10)"
            :key="entry.id"
            class="history-row"
          >
            <span class="history-date">{{ formatDateTime(entry.loggedAt) }}</span>
            <span class="history-value">{{ entry.value }}{{ metric.unit }}</span>
            <button class="history-del" @click.stop="remove(metric.key, entry.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button
            v-if="(store.history[metric.key]?.length || 0) > 10 && !showAll[metric.key]"
            class="show-more"
            @click="showAll[metric.key] = true"
          >
            Show all {{ store.history[metric.key].length }} entries
          </button>
        </div>
      </section>
    </div>

    <!-- Log entry bottom sheet -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="logSheet" class="sheet-backdrop" @click.self="logSheet = false">
          <div class="sheet">
            <div class="sheet-handle" />
            <div class="sheet-content">
              <h2 class="sheet-title">Log {{ activeMetric?.label }}</h2>
              <div class="log-input-row">
                <input
                  ref="logInputRef"
                  v-model="logValue"
                  class="log-input"
                  type="text"
                  inputmode="decimal"
                  :placeholder="store.latest[activeMetric?.key]?.value ?? '0'"
                  @keydown.enter="submitLog"
                />
                <span class="log-unit">{{ activeMetric?.unit }}</span>
              </div>
              <div class="sheet-actions">
                <AppButton variant="accent" full @click="submitLog">Log</AppButton>
                <AppButton variant="ghost" full @click="logSheet = false">Cancel</AppButton>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppPageShell>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useBodyStore } from '../stores/useBodyStore.js'
import { METRIC_TYPES } from '../db/bodyRepository.js'

const store    = useBodyStore()
const logSheet = ref(false)
const logValue = ref('')
const activeMetric = ref(null)
const logInputRef  = ref(null)
const showAll = reactive(Object.fromEntries(METRIC_TYPES.map(m => [m.key, false])))

onMounted(async () => {
  await store.loadLatest()
  for (const m of METRIC_TYPES) {
    await store.loadHistory(m.key)
  }
})

function openLog(metric) {
  activeMetric.value = metric
  logValue.value = ''
  logSheet.value = true
  nextTick(() => logInputRef.value?.focus())
}

async function submitLog() {
  const val = parseFloat(logValue.value)
  if (!val || val <= 0) return
  await store.log(activeMetric.value.key, val)
  logSheet.value = false
}

async function remove(type, id) {
  await store.remove(type, id)
}

function formatDate(ts) {
  const d = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 86400000) return 'Today'
  if (diff < 172800000) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateTime(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.page-title { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--color-text-1); flex: 1; }

.body-content {
  display: flex; flex-direction: column; gap: var(--space-6);
  padding: var(--space-4); padding-bottom: var(--scroll-pb);
}

/* Metrics grid */
.metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

.metric-card {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-1); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); cursor: pointer;
  transition: background var(--transition-fast);
}
.metric-card:active { background: var(--color-surface-2); }

.metric-icon { font-size: 18px; flex-shrink: 0; }
.metric-body { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.metric-label { font-size: 10px; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.06em; }
.metric-value { font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--color-text-1); }
.metric-value--empty { color: var(--color-text-3); }
.metric-date { font-size: 10px; color: var(--color-text-3); }
.metric-add { color: var(--color-accent); flex-shrink: 0; }

/* History sections */
.history-section { display: flex; flex-direction: column; gap: var(--space-2); }
.section-header { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.1em; }

.history-list { display: flex; flex-direction: column; gap: var(--space-1); }
.history-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface-1); border: 1px solid var(--color-border); border-radius: var(--radius-md);
}
.history-date  { flex: 1; font-size: var(--text-sm); color: var(--color-text-2); }
.history-value { font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--color-text-1); }
.history-del   { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; color: var(--color-text-3); border-radius: var(--radius-sm); }
.history-del:active { color: var(--color-danger); }

.show-more { text-align: center; font-size: var(--text-sm); color: var(--color-accent); padding: var(--space-2); width: 100%; }

/* Log sheet */
.sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: flex-end; }
.sheet { width: 100%; background: var(--color-surface-1); border-radius: var(--radius-xl) var(--radius-xl) 0 0; padding-bottom: env(safe-area-inset-bottom,0px); }
.sheet-handle { width: 36px; height: 4px; background: var(--color-surface-3); border-radius: var(--radius-full); margin: var(--space-3) auto var(--space-1); }
.sheet-content { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); }
.sheet-title { font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--color-text-1); text-align: center; }
.sheet-actions { display: flex; flex-direction: column; gap: var(--space-2); }

.log-input-row { display: flex; align-items: center; gap: var(--space-3); }
.log-input {
  flex: 1; height: 56px; text-align: center;
  font-size: var(--text-2xl); font-weight: var(--font-bold);
  color: var(--color-text-1); background: var(--color-surface-2);
  border: 1px solid var(--color-accent); border-radius: var(--radius-lg);
  user-select: text; -webkit-user-select: text;
}
.log-input:focus { outline: none; }
.log-unit { font-size: var(--text-lg); color: var(--color-text-3); font-weight: var(--font-medium); flex-shrink: 0; }

.sheet-enter-active, .sheet-leave-active { transition: opacity 200ms ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform 200ms ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
</style>

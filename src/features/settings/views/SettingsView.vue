<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Settings</span>
    </template>

    <div class="settings-content">

      <!-- General -->
      <section class="settings-section">
        <h2 class="section-title">General</h2>
        <div class="settings-card">
          <div class="settings-row settings-row--static">
            <div class="settings-row__body">
              <span class="settings-row__label">Violent mode</span>
              <span class="settings-row__sub">Get insulted when you perform worse than last time</span>
            </div>
            <label class="toggle">
              <input type="checkbox" :checked="violentMode" @change="setViolentMode($event.target.checked)" />
              <span class="toggle__track" />
            </label>
          </div>
        </div>
      </section>

      <!-- Data -->
      <section class="settings-section">
        <h2 class="section-title">Data</h2>
        <div class="settings-card">
          <div class="settings-row" @click="openExportModal">
            <div class="settings-row__body">
              <span class="settings-row__label">Export backup</span>
              <span class="settings-row__sub">Choose what to include and download as JSON</span>
            </div>
            <!-- Arrow pointing up = export out -->
            <svg class="settings-row__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="settings-divider" />
          <div class="settings-row" @click="triggerImport">
            <div class="settings-row__body">
              <span class="settings-row__label">Import backup</span>
              <span class="settings-row__sub">Restore from a JSON backup file</span>
            </div>
            <!-- Arrow pointing down = import in -->
            <svg class="settings-row__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div class="settings-divider" />
          <div class="settings-row settings-row--static">
            <div class="settings-row__body">
              <span class="settings-row__label">Persistent storage</span>
              <span class="settings-row__sub">Prevents OS from auto-clearing data</span>
            </div>
            <AppBadge :variant="isPersistent ? 'success' : 'warning'">
              {{ isPersistent ? 'Active' : 'Not granted' }}
            </AppBadge>
          </div>
          <input ref="fileInputRef" type="file" accept=".json" class="file-input-hidden" @change="onFileSelected" />
        </div>
      </section>

      <!-- App -->
      <section class="settings-section">
        <h2 class="section-title">App</h2>
        <div class="settings-card">
          <div class="settings-row settings-row--static">
            <div class="settings-row__body">
              <span class="settings-row__label">PRsonal</span>
              <span class="settings-row__sub">v{{ currentVersion }} · Built {{ buildDate }} 🏋️</span>
            </div>
          </div>
          <div class="settings-divider" />
          <!-- Update available → download row -->
          <template v-if="updateAvailable">
            <div class="settings-row settings-row--update" @click="openDownload">
              <div class="settings-row__body">
                <span class="settings-row__label settings-row__label--accent">Update available</span>
                <span class="settings-row__sub">Tap to download the latest APK</span>
              </div>
              <svg class="settings-row__icon settings-row__icon--accent" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div class="settings-divider" />
          </template>
          <!-- Check button -->
          <div class="settings-row" @click="checkForUpdate">
            <div class="settings-row__body">
              <span class="settings-row__label">{{ isChecking ? 'Checking…' : 'Check for update' }}</span>
              <span class="settings-row__sub">Tap to check GitHub for a newer version</span>
            </div>
            <svg class="settings-row__icon" :class="{ 'icon-spin': isChecking }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
        </div>
      </section>

      <!-- Developer -->
      <section class="settings-section settings-section--dev">
        <h2 class="section-title">Developer</h2>
        <div class="settings-card">
          <div class="settings-row" @click="loadTestData">
            <div class="settings-row__body">
              <span class="settings-row__label">Load test data</span>
              <span class="settings-row__sub">3 routines · 15 exercises · 18 sessions · PRs · BW · Cardio</span>
            </div>
            <svg class="settings-row__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div class="settings-divider" />
          <div class="settings-row" @click="router.push({ name: 'recovery' })">
            <div class="settings-row__body">
              <span class="settings-row__label settings-row__label--warning">Database recovery</span>
              <span class="settings-row__sub">Scan and export data if something went wrong</span>
            </div>
            <svg class="settings-row__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
        </div>
      </section>

    </div>

    <!-- Export status toast -->
    <Transition name="toast">
      <div v-if="toast.show" :class="['toast', `toast--${toast.type}`]">{{ toast.message }}</div>
    </Transition>

    <!-- Export options modal -->
    <AppModal v-model="exportModal" title="Export backup">
      <div class="export-options">
        <p style="color:var(--color-text-2);margin-bottom:var(--space-4)">Select what to include in the backup:</p>
        <label v-for="opt in exportOptions" :key="opt.key" class="export-option">
          <input type="checkbox" v-model="opt.selected" class="export-checkbox" />
          <div class="export-option__body">
            <span class="export-option__label">{{ opt.label }}</span>
            <span class="export-option__count">{{ opt.count }} {{ opt.count === 1 ? 'record' : 'records' }}</span>
          </div>
        </label>
      </div>
      <template #actions>
        <AppButton variant="accent" full :disabled="!exportOptions.some(o => o.selected)" @click="doExport">
          Download
        </AppButton>
        <AppButton variant="ghost" full @click="exportModal = false">Cancel</AppButton>
      </template>
    </AppModal>

    <!-- Import confirm modal -->
    <AppModal v-model="importModal" title="Restore from backup" :closeOnBackdrop="false">
      <div class="import-preview">
        <p style="color:var(--color-danger);margin-bottom:var(--space-4)">
          ⚠ Selected data will be <strong>deleted and replaced</strong>. This cannot be undone.
        </p>
        <div class="export-options">
          <label
            v-for="opt in importOptions"
            :key="opt.key"
            class="export-option"
            :class="{ 'export-option--disabled': !opt.available }"
          >
            <input type="checkbox" v-model="opt.selected" :disabled="!opt.available" class="export-checkbox" />
            <div class="export-option__body">
              <span class="export-option__label">{{ opt.label }}</span>
              <span class="export-option__count">
                {{ opt.available ? `${opt.count} records in backup` : 'Not in this backup' }}
              </span>
            </div>
          </label>
        </div>
      </div>
      <template #actions>
        <AppButton variant="danger" full :disabled="isImporting || !importOptions.some(o => o.selected)" @click="doImport">
          {{ isImporting ? 'Restoring…' : 'Restore selected' }}
        </AppButton>
        <AppButton variant="ghost" full @click="importModal = false">Cancel</AppButton>
      </template>
    </AppModal>
  </AppPageShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { db } from '@/db/index.js'
import { violentMode, setViolentMode } from '@/composables/useConfig.js'
import {
  checkForUpdate as checkGitHubUpdate,
  openDownload,
  updateAvailable,
  isChecking,
  currentVersion,
} from '@/composables/useUpdateCheck.js'

const router  = useRouter()

const fileInputRef  = ref(null)
const exportModal   = ref(false)
const exportOptions = ref([])
const importModal   = ref(false)
const importOptions = ref([])
const isImporting   = ref(false)
const importPreview = ref(null)
const isPersistent  = ref(false)
const buildDate     = __BUILD_DATE__
let pendingImportData = null

async function loadTestData() {
  try {
    const res = await fetch('./test-data.json')
    if (!res.ok) throw new Error('Could not load test data')
    const data = await res.json()
    pendingImportData = data
    importOptions.value = [
      { key: 'exercises', label: 'Exercise library', count: data.exerciseLibrary?.length || 0, available: true, selected: true },
      { key: 'routines',  label: 'Routines',         count: data.routines?.length || 0,        available: true, selected: true },
      { key: 'plans',     label: 'Training plans',   count: data.plans?.length || 0,            available: !!data.plans?.length, selected: !!data.plans?.length },
      { key: 'history',   label: 'Workout history',  count: data.workoutSessions?.length || 0, available: true, selected: true },
    ]
    importModal.value = true
  } catch (e) {
    showToast('Failed: ' + e.message, 'error')
  }
}

async function openExportModal() {
  const [exerciseCount, routineCount, sessionCount, planCount] = await Promise.all([
    db.exerciseLibrary.count(),
    db.routines.count(),
    db.workoutSessions.where('status').equals('completed').count(),
    db.plans.count(),
  ])
  exportOptions.value = [
    { key: 'exercises', label: 'Exercise library', count: exerciseCount, selected: true },
    { key: 'routines',  label: 'Routines',         count: routineCount,  selected: true },
    { key: 'plans',     label: 'Training plans',   count: planCount,     selected: true },
    { key: 'history',   label: 'Workout history',  count: sessionCount,  selected: true },
  ]
  exportModal.value = true
}

const toast = ref({ show: false, message: '', type: 'success' })

onMounted(async () => {
  if (navigator.storage?.persisted) {
    isPersistent.value = await navigator.storage.persisted()
  }
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, type === 'error' ? 8000 : 3000)
}

// ── Update ───────────────────────────────────────────────────────────────────

async function checkForUpdate() {
  await checkGitHubUpdate()
  if (!updateAvailable.value) {
    showToast('Already up to date')
  }
}


// ── Export ──────────────────────────────────────────────────────────────────

async function doExport() {
  const selected = Object.fromEntries(exportOptions.value.map(o => [o.key, o.selected]))
  exportModal.value = false

  try {
    const backup = { version: 1, exportedAt: new Date().toISOString() }

    if (selected.exercises) {
      backup.exerciseLibrary = await db.exerciseLibrary.toArray()
    }
    if (selected.routines) {
      backup.routines         = await db.routines.toArray()
      backup.routineExercises = await db.routineExercises.toArray()
    }
    if (selected.plans) {
      backup.plans       = await db.plans.toArray()
      backup.planEntries = await db.planEntries.toArray()
    }
    if (selected.history) {
      backup.workoutSessions = await db.workoutSessions.toArray()
      backup.workoutSets     = await db.workoutSets.toArray()
    }

    const parts = exportOptions.value.filter(o => o.selected).map(o => o.key).join('-')
    const date  = new Date().toISOString().slice(0, 10)
    const json  = JSON.stringify(backup, null, 2)
    const blob  = new Blob([json], { type: 'application/json' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href      = url
    a.download  = `prsonal-${parts}-${date}.json`
    a.click()
    URL.revokeObjectURL(url)

    showToast('Backup downloaded')
  } catch (e) {
    showToast('Export failed: ' + e.message, 'error')
  }
}

// ── Import ──────────────────────────────────────────────────────────────────

function triggerImport() {
  fileInputRef.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''

  const reader = new FileReader()
  reader.onload = evt => {
    try {
      const data = JSON.parse(evt.target.result)
      if (!data.version || !data.exportedAt) throw new Error('Not a valid PRsonal backup file')
      pendingImportData = data
      importPreview.value = data
      // Build import options from what's actually in the file
      importOptions.value = [
        {
          key: 'exercises',
          label: 'Exercise library',
          count: data.exerciseLibrary?.length || 0,
          available: !!data.exerciseLibrary?.length,
          selected: !!data.exerciseLibrary?.length,
        },
        {
          key: 'routines',
          label: 'Routines',
          count: data.routines?.length || 0,
          available: !!data.routines?.length,
          selected: !!data.routines?.length,
        },
        {
          key: 'plans',
          label: 'Training plans',
          count: data.plans?.length || 0,
          available: !!data.plans?.length,
          selected: !!data.plans?.length,
        },
        {
          key: 'history',
          label: 'Workout history',
          count: data.workoutSessions?.length || 0,
          available: !!data.workoutSessions?.length,
          selected: !!data.workoutSessions?.length,
        },
      ]
      importModal.value = true
    } catch (err) {
      showToast('Invalid file: ' + err.message, 'error')
    }
  }
  reader.readAsText(file)
}

async function doImport() {
  if (!pendingImportData) return
  isImporting.value = true
  const selected = Object.fromEntries(importOptions.value.map(o => [o.key, o.selected]))
  const d = pendingImportData
  try {
    await db.transaction('rw',
      db.exerciseLibrary, db.routines, db.routineExercises,
      db.plans, db.planEntries,
      db.workoutSessions, db.workoutSets,
      async () => {
        if (selected.exercises) {
          await db.exerciseLibrary.clear()
          if (d.exerciseLibrary?.length) await db.exerciseLibrary.bulkPut(d.exerciseLibrary)
        }
        if (selected.routines) {
          await db.routineExercises.clear()
          await db.routines.clear()
          if (d.routines?.length)         await db.routines.bulkPut(d.routines)
          if (d.routineExercises?.length) await db.routineExercises.bulkPut(d.routineExercises)
        }
        if (selected.plans) {
          await db.planEntries.clear()
          await db.plans.clear()
          if (d.plans?.length)       await db.plans.bulkPut(d.plans)
          if (d.planEntries?.length) await db.planEntries.bulkPut(d.planEntries)
        }
        if (selected.history) {
          await db.workoutSets.clear()
          await db.workoutSessions.clear()
          if (d.workoutSessions?.length) await db.workoutSessions.bulkPut(d.workoutSessions)
          if (d.workoutSets?.length) {
            // Ensure exerciseName is always a string — null/undefined breaks the index
            const cleanSets = d.workoutSets.map(s => ({
              ...s,
              exerciseName:      s.exerciseName      || '',
              exerciseLibraryId: s.exerciseLibraryId || null,
              isPR:              s.isPR              || false,
              startedAt:         s.startedAt         || s.completedAt || null,
              muscleGroups:      Array.isArray(s.muscleGroups) ? s.muscleGroups : [],
            }))
            await db.workoutSets.bulkPut(cleanSets)
          }
        }
      }
    )
    importModal.value = false
    pendingImportData = null
    importPreview.value = null
    showToast('Restore successful — reload to see changes')
  } catch (e) {
    showToast('Restore failed: ' + e.message, 'error')
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
.page-title { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--color-text-1); }

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
  padding-bottom: var(--scroll-pb);
}

.settings-section { display: flex; flex-direction: column; gap: var(--space-3); }

.section-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.settings-card {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.settings-row:active { background: var(--color-surface-2); }
.settings-row--static { cursor: default; }
.settings-row--static:active { background: transparent; }

.settings-row__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.settings-row__label { font-size: var(--text-base); font-weight: var(--font-medium); color: var(--color-text-1); }
.settings-row__sub   { font-size: var(--text-sm); color: var(--color-text-3); }
.settings-row__icon  { color: var(--color-text-3); flex-shrink: 0; }

.settings-divider { height: 1px; background: var(--color-border); margin: 0; }

.settings-section--dev { opacity: 0.75; }
.settings-section--dev .section-title { color: var(--color-text-3); }
.settings-row__label--warning { color: var(--color-warning); }
.settings-row__label--accent  { color: var(--color-accent); font-weight: var(--font-semibold); }
.settings-row__icon--accent   { color: var(--color-accent); }
.settings-row--update         { background: rgba(232,255,71,0.04); }
.settings-row--update:active  { background: rgba(232,255,71,0.1); }

.file-input-hidden { display: none; }

.toggle { position: relative; display: inline-flex; align-items: center; cursor: pointer; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle__track {
  width: 44px; height: 24px;
  background: var(--color-surface-3);
  border-radius: var(--radius-full);
  transition: background var(--transition-normal);
  position: relative;
}
.toggle__track::after {
  content: '';
  position: absolute;
  top: 3px; left: 3px;
  width: 18px; height: 18px;
  background: var(--color-text-2);
  border-radius: var(--radius-full);
  transition: transform var(--transition-normal), background var(--transition-normal);
}
.toggle input:checked + .toggle__track { background: var(--color-accent); }
.toggle input:checked + .toggle__track::after { transform: translateX(20px); background: #0f0f0f; }


@keyframes spin { to { transform: rotate(360deg); } }
.icon-spin { animation: spin 1s linear infinite; }

/* Export options */
.export-options { display: flex; flex-direction: column; gap: var(--space-2); }

.export-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}
.export-option:has(input:checked) { border-color: var(--color-accent); background: rgba(232,255,71,0.04); }

.export-checkbox {
  width: 18px; height: 18px;
  accent-color: var(--color-accent);
  cursor: pointer;
  flex-shrink: 0;
}

.export-option__body { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.export-option__label { font-size: var(--text-base); font-weight: var(--font-medium); color: var(--color-text-1); }
.export-option__count { font-size: var(--text-sm); color: var(--color-text-3); }
.export-option--disabled { opacity: 0.4; cursor: default; }

/* Import preview */
.import-preview { display: flex; flex-direction: column; gap: var(--space-4); }

.import-stats {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
}

.import-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.import-stat__val   { font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--color-text-1); }
.import-stat__label { font-size: var(--text-xs); color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.06em; }

/* Toast */
.toast {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--safe-bottom) + var(--space-4));
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap;
  z-index: 3000;
  pointer-events: none;
}
.toast--success { background: var(--color-surface-2); color: var(--color-text-1); border: 1px solid var(--color-border); }
.toast--error   { background: #2a0a0a; color: #ff6b6b; border: 1px solid var(--color-danger); max-width: 90vw; white-space: normal; text-align: center; }

.toast-enter-active, .toast-leave-active { transition: opacity 200ms, transform 200ms; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>

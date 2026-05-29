<template>
  <AppPageShell>
    <template #header>
      <span class="page-title">Settings</span>
    </template>

    <div class="settings-content">

      <!-- Data section -->
      <section class="settings-section">
        <h2 class="section-title">Data</h2>

        <div class="settings-card">
          <div class="settings-row" @click="doExport">
            <div class="settings-row__body">
              <span class="settings-row__label">Export backup</span>
              <span class="settings-row__sub">Download all data as JSON</span>
            </div>
            <svg class="settings-row__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>

          <div class="settings-divider" />

          <div class="settings-row" @click="triggerImport">
            <div class="settings-row__body">
              <span class="settings-row__label">Import backup</span>
              <span class="settings-row__sub">Restore from a JSON backup file</span>
            </div>
            <svg class="settings-row__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <input ref="fileInputRef" type="file" accept=".json" class="file-input-hidden" @change="onFileSelected" />
        </div>
      </section>

      <!-- Storage section -->
      <section class="settings-section">
        <h2 class="section-title">Storage</h2>
        <div class="settings-card">
          <div class="settings-row settings-row--static">
            <div class="settings-row__body">
              <span class="settings-row__label">Persistent storage</span>
              <span class="settings-row__sub">Prevents OS from auto-clearing data</span>
            </div>
            <AppBadge :variant="isPersistent ? 'success' : 'warning'">
              {{ isPersistent ? 'Active' : 'Not granted' }}
            </AppBadge>
          </div>
        </div>
      </section>

      <!-- Example data section -->
      <section class="settings-section">
        <h2 class="section-title">Example data</h2>
        <div class="settings-card">
          <div class="settings-row" @click="loadExample">
            <div class="settings-row__body">
              <span class="settings-row__label">Load example backup</span>
              <span class="settings-row__sub">3 routines · 15 exercises · 12 sessions of history</span>
            </div>
            <svg class="settings-row__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
        </div>
      </section>

      <!-- App section -->
      <section class="settings-section">
        <h2 class="section-title">App</h2>
        <div class="settings-card">
          <div class="settings-row settings-row--static">
            <div class="settings-row__body">
              <span class="settings-row__label">PRsonal</span>
              <span class="settings-row__sub">Your personal gym tracker · PWA · Built {{ buildDate }}</span>
            </div>
          </div>

          <div class="settings-divider" />

          <div class="settings-row" @click="checkForUpdate">
            <div class="settings-row__body">
              <span class="settings-row__label">{{ updateStatus }}</span>
              <span class="settings-row__sub">Tap to check for a newer version</span>
            </div>
            <svg class="settings-row__icon" :class="{ 'icon-spin': isChecking }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
        </div>
      </section>
    </div>

    <!-- Export status toast -->
    <Transition name="toast">
      <div v-if="toast.show" :class="['toast', `toast--${toast.type}`]">{{ toast.message }}</div>
    </Transition>

    <!-- Import confirm modal -->
    <AppModal v-model="importModal" title="Import backup?" :closeOnBackdrop="false">
      <div class="import-preview">
        <p style="color:var(--color-text-2)">This will <strong>merge</strong> the backup into your current data. Existing records with the same ID will be overwritten.</p>
        <div v-if="importPreview" class="import-stats">
          <div class="import-stat">
            <span class="import-stat__val">{{ importPreview.exerciseLibrary?.length || 0 }}</span>
            <span class="import-stat__label">Exercises</span>
          </div>
          <div class="import-stat">
            <span class="import-stat__val">{{ importPreview.routines?.length || 0 }}</span>
            <span class="import-stat__label">Routines</span>
          </div>
          <div class="import-stat">
            <span class="import-stat__val">{{ importPreview.workoutSessions?.length || 0 }}</span>
            <span class="import-stat__label">Sessions</span>
          </div>
        </div>
      </div>
      <template #actions>
        <AppButton variant="accent" full :disabled="isImporting" @click="doImport">
          {{ isImporting ? 'Importing…' : 'Import' }}
        </AppButton>
        <AppButton variant="ghost" full @click="importModal = false">Cancel</AppButton>
      </template>
    </AppModal>
  </AppPageShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { db } from '@/db/index.js'

const fileInputRef  = ref(null)
const importModal   = ref(false)
const isImporting   = ref(false)
const importPreview = ref(null)
const isPersistent  = ref(false)
const isChecking    = ref(false)
const updateStatus  = ref('Check for update')
const buildDate     = __BUILD_DATE__
let pendingImportData = null

const toast = ref({ show: false, message: '', type: 'success' })

onMounted(async () => {
  if (navigator.storage?.persisted) {
    isPersistent.value = await navigator.storage.persisted()
  }
})

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// ── Update ───────────────────────────────────────────────────────────────────

async function checkForUpdate() {
  if (isChecking.value) return
  isChecking.value = true
  updateStatus.value = 'Checking…'

  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (!reg) {
      updateStatus.value = 'No service worker found'
      return
    }

    await reg.update()

    if (reg.waiting) {
      // New SW already waiting — activate it and reload
      updateStatus.value = 'Update found — reloading…'
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      setTimeout(() => window.location.reload(), 500)
    } else if (reg.installing) {
      // SW is downloading — wait for it
      updateStatus.value = 'Downloading update…'
      reg.installing.addEventListener('statechange', e => {
        if (e.target.state === 'installed') {
          updateStatus.value = 'Update ready — reloading…'
          e.target.postMessage({ type: 'SKIP_WAITING' })
          setTimeout(() => window.location.reload(), 500)
        }
      })
    } else {
      updateStatus.value = 'Already up to date'
      setTimeout(() => { updateStatus.value = 'Check for update' }, 3000)
    }
  } catch (e) {
    updateStatus.value = 'Check failed: ' + e.message
    setTimeout(() => { updateStatus.value = 'Check for update' }, 4000)
  } finally {
    isChecking.value = false
  }
}

// ── Example data ────────────────────────────────────────────────────────────

async function loadExample() {
  try {
    const res = await fetch('./example-backup.json')
    if (!res.ok) throw new Error('Could not load example file')
    const data = await res.json()
    pendingImportData = data
    importPreview.value = data
    importModal.value = true
  } catch (e) {
    showToast('Failed to load example: ' + e.message, 'error')
  }
}

// ── Export ──────────────────────────────────────────────────────────────────

async function doExport() {
  try {
    const [
      exerciseLibrary,
      routines,
      routineExercises,
      workoutSessions,
      workoutSets,
    ] = await Promise.all([
      db.exerciseLibrary.toArray(),
      db.routines.toArray(),
      db.routineExercises.toArray(),
      db.workoutSessions.toArray(),
      db.workoutSets.toArray(),
    ])

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      exerciseLibrary,
      routines,
      routineExercises,
      workoutSessions,
      workoutSets,
    }

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href     = url
    a.download = `prsonal-backup-${date}.json`
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
  e.target.value = '' // reset so same file can be picked again

  const reader = new FileReader()
  reader.onload = evt => {
    try {
      const data = JSON.parse(evt.target.result)
      if (!data.version || !data.exportedAt) throw new Error('Not a valid PRsonal backup file')
      pendingImportData = data
      importPreview.value = data
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
  try {
    const d = pendingImportData
    await db.transaction('rw',
      db.exerciseLibrary,
      db.routines,
      db.routineExercises,
      db.workoutSessions,
      db.workoutSets,
      async () => {
        if (d.exerciseLibrary?.length) await db.exerciseLibrary.bulkPut(d.exerciseLibrary)
        if (d.routines?.length)         await db.routines.bulkPut(d.routines)
        if (d.routineExercises?.length) await db.routineExercises.bulkPut(d.routineExercises)
        if (d.workoutSessions?.length)  await db.workoutSessions.bulkPut(d.workoutSessions)
        if (d.workoutSets?.length)      await db.workoutSets.bulkPut(d.workoutSets)
      }
    )
    importModal.value = false
    pendingImportData = null
    importPreview.value = null
    showToast('Import successful — reload to see changes')
  } catch (e) {
    showToast('Import failed: ' + e.message, 'error')
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

.file-input-hidden { display: none; }

@keyframes spin { to { transform: rotate(360deg); } }
.icon-spin { animation: spin 1s linear infinite; }

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
.toast--error   { background: rgba(244,67,54,0.15); color: var(--color-danger); border: 1px solid var(--color-danger); }

.toast-enter-active, .toast-leave-active { transition: opacity 200ms, transform 200ms; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>

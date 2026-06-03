<template>
  <AppPageShell>
    <template #header>
      <button class="back-btn" @click="router.back()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="page-title">Recovery</span>
    </template>

    <div class="recovery-content">
      <div v-if="!checked" class="recovery-section">
        <p class="recovery-desc">This tool reads your data directly from the database, bypassing any index issues. Use it to check what data is still present and export it.</p>
        <AppButton variant="accent" full @click="scan">Scan database</AppButton>
      </div>

      <template v-else>
        <div class="recovery-section">
          <h2 class="section-title">Database contents</h2>
          <div class="stat-grid">
            <div class="stat-card" v-for="(count, table) in counts" :key="table">
              <span class="stat-val">{{ count }}</span>
              <span class="stat-lbl">{{ table }}</span>
            </div>
          </div>
        </div>

        <div v-if="totalRecords > 0" class="recovery-section">
          <p class="recovery-desc">Data found. Tap below to export everything as a backup file, then re-import it from Settings.</p>
          <AppButton variant="accent" full @click="exportRaw">Export all data</AppButton>
        </div>

        <div v-else class="recovery-section">
          <p class="recovery-desc" style="color:var(--color-danger)">No records found in the database. The data may have been lost during the schema migration.</p>
        </div>

        <div class="recovery-section">
          <p class="recovery-desc" style="color:var(--color-text-3); font-size:var(--text-xs)">DB version: {{ dbVersion }}</p>
        </div>
      </template>
    </div>
  </AppPageShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppPageShell from '@/components/ui/AppPageShell.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const checked = ref(false)
const counts  = ref({})
const dbVersion = ref(null)

const TABLES = ['routines', 'routineExercises', 'workoutSessions', 'workoutSets', 'exerciseLibrary', 'plans', 'planEntries', 'config']

const totalRecords = computed(() => Object.values(counts.value).reduce((s, v) => s + v, 0))

async function openRawDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('gymapp')
    req.onsuccess  = e => resolve(e.target.result)
    req.onerror    = e => reject(e.target.error)
  })
}

async function getAllFromStore(db, storeName) {
  if (!db.objectStoreNames.contains(storeName)) return []
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).getAll()
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

async function scan() {
  try {
    const db = await openRawDb()
    dbVersion.value = db.version
    const result = {}
    for (const table of TABLES) {
      const rows = await getAllFromStore(db, table)
      result[table] = rows.length
    }
    counts.value = result
    checked.value = true
    db.close()
  } catch (e) {
    alert('Scan failed: ' + e.message)
  }
}

async function exportRaw() {
  try {
    const db = await openRawDb()
    const backup = { version: 1, exportedAt: new Date().toISOString(), recoveredAt: new Date().toISOString() }
    for (const table of TABLES) {
      backup[table] = await getAllFromStore(db, table)
    }
    db.close()

    const json = JSON.stringify(backup, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `prsonal-recovery-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('Export failed: ' + e.message)
  }
}
</script>

<style scoped>
.back-btn { display:flex; align-items:center; justify-content:center; width:40px; height:40px; color:var(--color-text-2); border-radius:var(--radius-md); margin-left:calc(-1 * var(--space-2)); }
.back-btn:active { color:var(--color-text-1); }
.page-title { font-size:var(--text-lg); font-weight:var(--font-semibold); color:var(--color-text-1); }

.recovery-content { display:flex; flex-direction:column; gap:var(--space-6); padding:var(--space-4); padding-bottom:var(--scroll-pb); }
.recovery-section { display:flex; flex-direction:column; gap:var(--space-3); }
.recovery-desc { font-size:var(--text-sm); color:var(--color-text-2); line-height:1.6; }
.section-title { font-size:var(--text-xs); font-weight:var(--font-semibold); color:var(--color-text-3); text-transform:uppercase; letter-spacing:0.1em; }

.stat-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:var(--space-2); }
.stat-card { background:var(--color-surface-1); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:var(--space-3); display:flex; flex-direction:column; gap:2px; }
.stat-val { font-size:var(--text-2xl); font-weight:var(--font-bold); color:var(--color-text-1); }
.stat-lbl { font-size:var(--text-xs); color:var(--color-text-3); }
</style>

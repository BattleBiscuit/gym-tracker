<template>
  <div class="search-wrap">
    <div class="field-label" v-if="label">{{ label }}</div>

    <!-- Trigger — just a display button, no keyboard -->
    <div class="search-trigger-row">
      <button
        type="button"
        :class="['search-trigger', { 'search-trigger--error': error, 'search-trigger--filled': displayName }]"
        @click="openSheet"
      >
        <span>{{ displayName || placeholder }}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <button v-if="selectedId" class="search-clear" @click="clear" aria-label="Clear">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <span v-if="error" class="search-error">{{ error }}</span>
  </div>

  <!-- Bottom sheet teleported to body -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="sheetOpen" class="sheet-backdrop" @click.self="closeSheet">
        <div class="sheet">
          <div class="sheet-handle" />

          <div class="sheet-search-row">
            <input
              ref="sheetInputRef"
              v-model="query"
              class="sheet-search"
              type="text"
              placeholder="Search exercises…"
              autocomplete="off"
            />
            <button class="sheet-cancel" @click="closeSheet">Cancel</button>
          </div>

          <div class="sheet-list">
            <button
              v-for="item in results"
              :key="item.id"
              class="sheet-option"
              @click="select(item)"
            >
              <span class="sheet-option__name">{{ item.name }}</span>
              <span class="sheet-option__meta">
                {{ item.type }}<template v-if="item.primaryMuscles?.length"> · {{ item.primaryMuscles.slice(0,2).join(', ') }}</template>
              </span>
            </button>

            <button
              v-if="query.trim() && !exactMatch"
              class="sheet-option sheet-option--create"
              @click="createAndSelect"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create "{{ query.trim() }}"
            </button>

            <div v-if="!results.length && !query.trim()" class="sheet-empty">
              No exercises in library yet. Type a name to create one.
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { libraryRepository } from '../db/libraryRepository.js'
import { useLibraryStore } from '../stores/useLibraryStore.js'

const props = defineProps({
  modelValue:   { type: String, default: null },
  displayValue: { type: String, default: '' },
  label:        { type: String, default: 'Exercise' },
  placeholder:  { type: String, default: 'Tap to select exercise…' },
  error:        { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'update:displayValue', 'select'])

const libraryStore  = useLibraryStore()
const sheetInputRef = ref(null)
const sheetOpen     = ref(false)
const query         = ref('')
const results       = ref([])
const selectedId    = ref(props.modelValue || null)
const displayName   = ref(props.displayValue || '')

const exactMatch = computed(() =>
  results.value.some(r => r.name.toLowerCase() === query.value.trim().toLowerCase())
)

watch(() => props.modelValue,   v => { selectedId.value  = v })
watch(() => props.displayValue, v => { displayName.value = v })

async function openSheet() {
  query.value = ''
  results.value = await libraryRepository.search('')
  sheetOpen.value = true
  await nextTick()
  sheetInputRef.value?.focus()
}

function closeSheet() {
  sheetOpen.value = false
  query.value = ''
}

watch(query, async q => {
  results.value = await libraryRepository.search(q)
})

function select(item) {
  selectedId.value  = item.id
  displayName.value = item.name
  sheetOpen.value   = false
  query.value       = ''
  emit('update:modelValue', item.id)
  emit('update:displayValue', item.name)
  emit('select', item)
}

async function createAndSelect() {
  const entry = await libraryStore.create({ name: query.value.trim(), type: 'strength' })
  select(entry)
}

function clear() {
  selectedId.value  = null
  displayName.value = ''
  emit('update:modelValue', null)
  emit('update:displayValue', '')
}

onMounted(() => {
  if (!libraryStore.exercises.length) libraryStore.loadAll()
})
</script>

<style scoped>
.search-wrap { display: flex; flex-direction: column; gap: var(--space-1); }

.field-label { font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-2); }

.search-trigger-row { position: relative; display: flex; align-items: center; }

.search-trigger {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--touch-target-min);
  padding: 0 var(--space-4);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-text-3);
  text-align: left;
  transition: border-color var(--transition-fast);
}
.search-trigger--filled { color: var(--color-text-1); }
.search-trigger--error  { border-color: var(--color-danger); }
.search-trigger:active  { border-color: var(--color-border-focus); }

.search-clear {
  position: absolute; right: var(--space-3);
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  color: var(--color-text-3); border-radius: var(--radius-full);
}
.search-clear:active { color: var(--color-text-1); }

.search-error { font-size: var(--text-xs); color: var(--color-danger); }

/* ── Bottom sheet ── */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  max-height: 85dvh;
  background: var(--color-surface-1);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sheet-handle {
  width: 36px; height: 4px;
  background: var(--color-surface-3);
  border-radius: var(--radius-full);
  margin: var(--space-3) auto var(--space-1);
  flex-shrink: 0;
}

.sheet-search-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4) var(--space-3);
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
}

.sheet-search {
  flex: 1;
  height: 40px;
  padding: 0 var(--space-4);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-1);
  font-size: var(--text-sm);
  user-select: text;
  -webkit-user-select: text;
}
.sheet-search:focus { border-color: var(--color-border-focus); outline: none; }

.sheet-cancel {
  font-size: var(--text-sm);
  color: var(--color-text-2);
  white-space: nowrap;
}
.sheet-cancel:active { color: var(--color-text-1); }

.sheet-list {
  flex: 1;
  overflow-y: scroll;
  overscroll-behavior: contain;
  min-height: 200px;
  padding-bottom: env(safe-area-inset-bottom, 16px);
}

.sheet-option {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}
.sheet-option:last-child { border-bottom: none; }
.sheet-option:active { background: var(--color-surface-2); }

.sheet-option__name { font-size: var(--text-base); font-weight: var(--font-medium); color: var(--color-text-1); }
.sheet-option__meta { font-size: var(--text-xs); color: var(--color-text-3); }

.sheet-option--create {
  flex-direction: row;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-accent);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.sheet-empty {
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--color-text-3);
  font-size: var(--text-sm);
}

/* Transition */
.sheet-enter-active, .sheet-leave-active { transition: opacity 200ms ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform 200ms ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
</style>

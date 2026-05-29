import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: { name: 'routines' } },

  {
    path: '/routines',
    name: 'routines',
    component: () => import('@/features/routines/views/RoutinesView.vue'),
  },
  {
    path: '/routines/new',
    name: 'routine-create',
    component: () => import('@/features/routines/views/RoutineEditView.vue'),
  },
  {
    path: '/routines/:id/edit',
    name: 'routine-edit',
    component: () => import('@/features/routines/views/RoutineEditView.vue'),
    props: true,
  },

  {
    path: '/session',
    name: 'session-pick',
    component: () => import('@/features/session/views/SessionPickView.vue'),
  },
  {
    path: '/session/active',
    name: 'session-active',
    component: () => import('@/features/session/views/SessionActiveView.vue'),
  },

  {
    path: '/history',
    name: 'history',
    component: () => import('@/features/history/views/HistoryView.vue'),
  },
  {
    path: '/history/:id',
    name: 'history-detail',
    component: () => import('@/features/history/views/HistoryDetailView.vue'),
    props: true,
  },

  {
    path: '/library',
    name: 'library',
    component: () => import('@/features/library/views/LibraryView.vue'),
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/features/analytics/views/AnalyticsView.vue'),
  },

  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/features/settings/views/SettingsView.vue'),
  },

  { path: '/:pathMatch(.*)*', redirect: { name: 'routines' } },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Guards are added in main.js after stores are available

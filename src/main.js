import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router/index.js'
import { useSessionStore } from './features/session/stores/useSessionStore.js'

import './styles/global.css'
import './styles/flex-mode.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Navigation guards — added after stores are available via pinia
router.beforeEach(async (to) => {
  const sessionStore = useSessionStore()

  // session-active requires an active session
  if (to.name === 'session-active' && !sessionStore.activeSessionId) {
    return { name: 'session-pick' }
  }

  // session-pick redirects to active session if one is running
  if (to.name === 'session-pick' && sessionStore.activeSessionId) {
    return { name: 'session-active' }
  }
})

app.mount('#app')

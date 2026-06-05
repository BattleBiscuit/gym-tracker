import { ref } from 'vue'

const REPO    = __GITHUB_REPO__
const CURRENT = __APP_VERSION__

// Fetch all releases and find the highest semver tag — no hardcoded tag name
const API_URL = `https://api.github.com/repos/${REPO}/releases?per_page=20`

export const updateAvailable = ref(false)
export const latestVersion   = ref(null)
export const downloadUrl     = ref(null)
export const isChecking      = ref(false)

function parseVersion(v) {
  return (v || '').replace(/^v/, '').split('.').map(Number)
}

function isNewer(remote, current) {
  const r = parseVersion(remote)
  const c = parseVersion(current)
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (c[i] || 0)) return true
    if ((r[i] || 0) < (c[i] || 0)) return false
  }
  return false
}

export async function checkForUpdate() {
  isChecking.value = true
  updateAvailable.value = false
  latestVersion.value   = null
  downloadUrl.value     = null

  try {
    const res = await fetch(API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return

    const releases = await res.json()

    // Find the highest semver release that has an APK asset
    const candidate = releases
      .filter(r => !r.prerelease && /^v\d+\.\d+\.\d+$/.test(r.tag_name))
      .sort((a, b) => {
        const av = parseVersion(a.tag_name)
        const bv = parseVersion(b.tag_name)
        for (let i = 0; i < 3; i++) {
          if (bv[i] !== av[i]) return bv[i] - av[i]
        }
        return 0
      })
      .find(r => r.assets?.some(a => a.name.endsWith('.apk')))

    if (!candidate) return

    const apk = candidate.assets.find(a => a.name.endsWith('.apk'))
    const remoteVersion = candidate.tag_name.replace(/^v/, '')

    if (isNewer(remoteVersion, CURRENT)) {
      updateAvailable.value = true
      latestVersion.value   = remoteVersion
      downloadUrl.value     = apk.browser_download_url
    }
  } catch {
    // Network error or offline — silently ignore
  } finally {
    isChecking.value = false
  }
}

export function openDownload() {
  if (downloadUrl.value) window.open(downloadUrl.value, '_blank')
}

export const currentVersion = CURRENT

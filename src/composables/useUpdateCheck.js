import { ref } from 'vue'

const REPO    = __GITHUB_REPO__
const CURRENT = __APP_VERSION__

const API_URL = `https://api.github.com/repos/${REPO}/releases/tags/nightly`

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

    const release = await res.json()

    // Find the .apk asset
    const apk = release.assets?.find(a => a.name.endsWith('.apk'))
    if (!apk) return

    // Strip leading 'v' from tag if present, use body or tag as version label
    const remote = release.tag_name === 'latest'
      ? release.name  // "Latest build" — not semver, skip version comparison
      : release.tag_name

    // For a rolling 'latest' release we always consider it newer if the
    // release was published after this build date
    const releaseDate  = new Date(release.published_at)
    const buildDate    = new Date(__BUILD_DATE__.replace(' ', 'T') + ':00Z')
    const rollingNewer = release.tag_name === 'latest' && releaseDate > buildDate

    if (rollingNewer || isNewer(remote, CURRENT)) {
      updateAvailable.value = true
      latestVersion.value   = release.tag_name === 'latest'
        ? release.body?.match(/commit \[`([a-f0-9]{7})`/)?.[1] ?? 'latest'
        : remote
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

// Analytics consent. GA is not loaded at all until the visitor accepts: before that there is
// no gtag.js request, no cookie and no event. The loader lives in BaseLayout (window.htLoadGA).
// The storage key is duplicated there; keep both in sync.
const KEY = 'ht_analytics_consent'

// 'granted' | 'denied' | null (not yet chosen)
export function getConsent() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function hasConsent() {
  return getConsent() === 'granted'
}

export function setConsent(value) {
  try { localStorage.setItem(KEY, value) } catch {}
  if (value === 'granted' && typeof window.htLoadGA === 'function') window.htLoadGA()
}

// Withdrawing consent: forget the choice and reload so the page returns to its
// no-GA state and the banner asks again. GA cookies already set are not removed here.
export function resetConsent() {
  try { localStorage.removeItem(KEY) } catch {}
  location.reload()
}

import { EVENT_SPEC } from './events.js'
import { hasConsent } from './consent.js'

// The only place that talks to GA. Fails silently if GA is not loaded (no PUBLIC_GA_ID,
// blocked by the browser) or consent is missing. Analytics must never break the site.
export function track(name, params = {}) {
  try {
    const allowed = EVENT_SPEC[name]
    if (!allowed) return
    if (typeof window.gtag !== 'function' || !hasConsent()) return

    const clean = {}
    for (const key of allowed) {
      if (params[key] !== undefined) clean[key] = params[key]
    }
    // In local dev, show events in GA4 DebugView.
    if (import.meta.env.DEV) clean.debug_mode = true

    window.gtag('event', name, clean)
  } catch {}
}

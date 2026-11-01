import { track } from './track.js'

// One delegated listener for every element that declares itself with data-track.
//   <a href="/quiz" data-track="cta_click" data-track-location="header">
// Markup never calls GA; it only describes itself.
document.addEventListener('click', (event) => {
  const el = event.target instanceof Element ? event.target.closest('[data-track]') : null
  if (!el) return

  track(el.dataset.track, {
    cta_location: el.dataset.trackLocation,
    cta_text: (el.dataset.trackText || el.textContent || '').trim().slice(0, 100),
    source_page: location.pathname,
  })
})

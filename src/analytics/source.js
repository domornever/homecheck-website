// Which page sent this visitor to the quiz. Used as the source_page parameter.
//
// The referrer is read fresh on every navigation, so blog A -> quiz -> blog B -> quiz reports B.
// It is kept in sessionStorage because a click on the header button while already on /quiz has
// the quiz itself as referrer, and we want to keep the original source in that case.
const KEY = 'ht_source_page'

export function getSourcePage() {
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer)
      if (ref.origin !== location.origin) return remember('(external)')
      if (ref.pathname.replace(/\/$/, '') !== '/quiz') return remember(ref.pathname)
    }
    return sessionStorage.getItem(KEY) || '(direct)'
  } catch {
    return '(direct)'
  }
}

function remember(value) {
  try { sessionStorage.setItem(KEY, value) } catch {}
  return value
}

// Build-time: tags every link to the quiz in blog Markdown with the same data-track attributes
// the header button carries, so the delegated listener in listener.js picks them up. Posts stay
// plain Markdown and never mention GA. Plain tree walk, no dependencies.
const QUIZ_HREF = /^(https:\/\/hometheory\.sg)?\/quiz\/?([?#].*)?$/

function walk(node) {
  if (node.type === 'element' && node.tagName === 'a' && QUIZ_HREF.test(node.properties?.href ?? '')) {
    node.properties.dataTrack = 'cta_click'
    node.properties.dataTrackLocation = 'blog'
  }
  for (const child of node.children ?? []) walk(child)
}

export default function rehypeTrackQuizLinks() {
  return (tree) => walk(tree)
}

/**
 * Model-written markdown, turned into HTML that is safe to put on the page.
 *
 * The assistant writes in markdown — tables of candidate sources, headed
 * sections, links — and showing that raw is showing somebody pipes and
 * asterisks where a table was meant. So it is rendered; and because the text
 * comes from a model, it is sanitised before it ever reaches `v-html`.
 * `marked` for the rendering, DOMPurify for the sanitising, which is the same
 * pairing FoodChat already uses on the same class of content.
 */
import DOMPurify from 'dompurify'
import { marked } from 'marked'

let hooked = false

/**
 * Every link opens in a new tab, and carries `noopener`.
 *
 * A link the model wrote points off our site by definition, and a curator
 * checking a source should not lose the conversation that produced it. The
 * `rel` is not politeness: `target="_blank"` without it hands the opened page
 * a handle on ours.
 */
function installHook() {
  if (hooked || typeof window === 'undefined') return
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
  hooked = true
}

export function renderMarkdown(text: string): string {
  if (!text) return ''
  installHook()
  const html = DOMPurify.sanitize(marked(text, { breaks: true, gfm: true }) as string)
  // Each table gets its own scroll container. A comparison of eight sources
  // is wider than any column it is shown in, and without this the page
  // itself scrolls sideways — which moves everything else too.
  return html
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

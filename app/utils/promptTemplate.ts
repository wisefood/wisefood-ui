import type { PromptMessage, PromptTemplate } from '~/services/observabilityApi'

/**
 * Rendering and filling Langfuse prompt templates in the console.
 *
 * Pure functions, no Vue: the console has no test runner, so anything with
 * logic in it lives here where `node --experimental-strip-types` can execute
 * it. The component only lays the results out.
 */

/** One run of template text: plain, a variable, or a reference to another prompt. */
export interface Segment {
  kind: 'text' | 'variable' | 'reference'
  text: string
}

const MUSTACHE = /{{\s*([A-Za-z_][\w.-]*)\s*}}/g
// A single-brace format field, not doubled on either side. Same rule as the gateway.
const FORMAT = /(?<!{){([A-Za-z_]\w*)(?::[^{}]*)?}(?!})/g
const REFERENCE = /@@@langfusePrompt:([^@]+?)@@@/g

function variablePattern(convention: PromptTemplate['convention']): RegExp | null {
  if (convention === 'mustache') return new RegExp(MUSTACHE.source, 'g')
  if (convention === 'format') return new RegExp(FORMAT.source, 'g')
  return null
}

/**
 * Split template text so variables and references can be drawn differently
 * from the words around them. Never uses innerHTML — the segments are data,
 * and the component renders each as its own element.
 */
export function segment(text: string, convention: PromptTemplate['convention']): Segment[] {
  const out: Segment[] = []
  const pattern = variablePattern(convention)
  // Cut on references first so a `{{` inside one is not read as a variable.
  const refs = new RegExp(REFERENCE.source, 'g')
  let last = 0
  const pushText = (chunk: string) => {
    if (!chunk) return
    if (!pattern) {
      out.push({ kind: 'text', text: chunk })
      return
    }
    let cursor = 0
    for (const m of chunk.matchAll(pattern)) {
      const at = m.index ?? 0
      if (at > cursor) out.push({ kind: 'text', text: chunk.slice(cursor, at) })
      out.push({ kind: 'variable', text: m[1] ?? m[0] })
      cursor = at + m[0].length
    }
    if (cursor < chunk.length) out.push({ kind: 'text', text: chunk.slice(cursor) })
  }
  for (const m of text.matchAll(refs)) {
    const at = m.index ?? 0
    pushText(text.slice(last, at))
    out.push({ kind: 'reference', text: m[1] ?? m[0] })
    last = at + m[0].length
  }
  pushText(text.slice(last))
  return out
}

/**
 * Fill a template the way the application would.
 *
 * Mustache: what the Langfuse SDKs' `compile()` does — replace each
 * `{{name}}` with the value, leave unknown ones as they are. Format: what
 * FoodChat's `str.format` does — replace `{name}`, and turn `{{`/`}}` into
 * single braces. Empty values are left as the placeholder so a half-filled
 * preview still shows what is missing.
 */
export function fill(
  text: string,
  convention: PromptTemplate['convention'],
  values: Record<string, string>
): string {
  const has = (name: string) => Object.prototype.hasOwnProperty.call(values, name) && values[name] !== ''
  if (convention === 'mustache') {
    return text.replace(new RegExp(MUSTACHE.source, 'g'), (whole, name: string) =>
      has(name) ? String(values[name]) : whole)
  }
  if (convention === 'format') {
    return text
      .replace(new RegExp(FORMAT.source, 'g'), (whole, name: string) =>
        has(name) ? String(values[name]) : whole)
      .replace(/{{/g, '{')
      .replace(/}}/g, '}')
  }
  return text
}

/** A placeholder's messages, typed one per line as `role: content`. */
export function parseMessages(input: string): PromptMessage[] {
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^([A-Za-z_]+)\s*:\s*(.*)$/.exec(line)
      return m ? { role: m[1]!.toLowerCase(), content: m[2] ?? '' } : { role: 'user', content: line }
    })
}

/** The messages a chat prompt would send, with placeholders spliced in and variables filled. */
export function compileChat(
  messages: PromptMessage[],
  convention: PromptTemplate['convention'],
  values: Record<string, string>,
  placeholders: Record<string, string>
): PromptMessage[] {
  const out: PromptMessage[] = []
  for (const m of messages) {
    if (m.type === 'placeholder') {
      const typed = placeholders[m.name ?? ''] ?? ''
      if (typed.trim()) out.push(...parseMessages(typed))
      else out.push({ type: 'placeholder', name: m.name })
      continue
    }
    out.push({ role: m.role, content: fill(m.content ?? '', convention, values) })
  }
  return out
}

/** Chat messages as one readable block, the way the drawer has always shown them. */
export function messagesToText(messages: PromptMessage[]): string {
  return messages.map((m) => {
    if (m.type === 'placeholder') return `[messages: ${m.name ?? 'placeholder'}]`
    return `${(m.role ?? 'message').toUpperCase()}:\n${m.content ?? ''}`
  }).join('\n\n')
}

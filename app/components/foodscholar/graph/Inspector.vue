<template>
  <aside
    class="flex h-full w-full flex-col border-l border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm"
    :aria-label="t('graph.inspector.title')"
  >
    <!-- Empty state: not a shrug, a prompt. -->
    <div
      v-if="!nodeId"
      class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <UIcon
        name="i-lucide-mouse-pointer-click"
        class="h-8 w-8 text-zinc-300 dark:text-zinc-600"
      />
      <p class="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {{ t('graph.inspector.emptyTitle') }}
      </p>
      <p class="max-w-[22ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {{ t('graph.inspector.emptyHint') }}
      </p>
    </div>

    <template v-else>
      <!-- Breadcrumb. Server-built, so it costs nothing to show and never
           walks ancestors one request at a time. -->
      <div class="shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-4 pt-3 pb-2">
        <nav
          v-if="breadcrumb.length"
          :aria-label="t('graph.inspector.breadcrumb')"
          class="mb-2"
        >
          <ol class="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[0.7rem] text-zinc-500 dark:text-zinc-400">
            <li
              v-for="(crumb, i) in breadcrumb"
              :key="crumb.node_id"
              class="flex items-center gap-1"
            >
              <UIcon
                v-if="i > 0"
                name="i-lucide-chevron-right"
                class="h-3 w-3 shrink-0 opacity-50"
              />
              <button
                type="button"
                class="max-w-[14ch] truncate rounded px-0.5 hover:text-brand-600 dark:hover:text-brand-400 hover:underline"
                :title="crumb.label"
                @click="emit('select', crumb.node_id)"
              >
                {{ crumb.label }}
              </button>
            </li>
          </ol>
        </nav>

        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span
                class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                :style="{ backgroundColor: kindColor }"
              />
              <span class="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {{ t(`graph.kind.${kind}`) }}
              </span>
              <span
                v-if="status === 'folded'"
                class="rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-px text-[0.6rem] font-medium text-zinc-500 dark:text-zinc-400"
                :title="t('graph.inspector.foldedHint')"
              >{{ t('graph.inspector.folded') }}</span>
            </div>
            <h3 class="mt-0.5 text-base font-semibold leading-tight text-zinc-900 dark:text-white">
              {{ title }}
            </h3>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
            :aria-label="t('graph.inspector.close')"
            @click="emit('select', '')"
          >
            <UIcon
              name="i-lucide-x"
              class="h-4 w-4"
            />
          </button>
        </div>

        <div class="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-[0.7rem] font-medium text-zinc-600 dark:text-zinc-300 transition-colors hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400"
            @click="emit('expand', nodeId)"
          >
            <UIcon
              name="i-lucide-git-fork"
              class="h-3 w-3"
            />
            {{ t('graph.inspector.expand') }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-[0.7rem] font-medium text-zinc-600 dark:text-zinc-300 transition-colors hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400"
            @click="emit('scope', nodeId)"
          >
            <UIcon
              name="i-lucide-scan-search"
              class="h-3 w-3"
            />
            {{ t('graph.inspector.scopeHere') }}
          </button>
          <button
            v-if="askableQuestion"
            type="button"
            class="inline-flex items-center gap-1 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 text-[0.7rem] font-medium text-brand-700 dark:text-brand-300 transition-colors hover:bg-brand-100 dark:hover:bg-brand-900/40"
            @click="emit('ask', askableQuestion)"
          >
            <UIcon
              name="i-lucide-sparkles"
              class="h-3 w-3"
            />
            {{ t('graph.inspector.askAbout') }}
          </button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <div
          v-if="loading"
          class="space-y-3 p-4"
        >
          <div
            v-for="i in 4"
            :key="i"
            class="h-3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
            :style="{ width: `${90 - i * 12}%` }"
          />
        </div>

        <div
          v-else-if="error"
          class="m-4 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-900/20 p-3"
        >
          <p class="text-xs text-amber-800 dark:text-amber-200">
            {{ error }}
          </p>
          <button
            type="button"
            class="mt-2 text-xs font-medium text-amber-900 dark:text-amber-100 underline"
            @click="load()"
          >
            {{ t('graph.retry') }}
          </button>
        </div>

        <template v-else>
          <!-- The card. The written part of the graph, and the reason a
               browse session ends somewhere useful rather than at a label. -->
          <section
            v-if="card"
            class="border-b border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div
              v-if="card.safety_flagged"
              class="mb-3 flex gap-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-2.5"
            >
              <UIcon
                name="i-lucide-shield-alert"
                class="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400"
              />
              <p class="text-[0.7rem] leading-relaxed text-rose-800 dark:text-rose-200">
                {{ t('graph.inspector.safetyFlag') }}
              </p>
            </div>

            <div class="mb-2 flex flex-wrap items-center gap-1.5">
              <span
                v-if="card.evidence_quality"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold"
                :class="qualityClass(card.evidence_quality)"
              >
                <UIcon
                  :name="qualityIcon(card.evidence_quality)"
                  class="h-3 w-3"
                />
                {{ t(`graph.quality.${card.evidence_quality}`, card.evidence_quality) }}
              </span>
              <span class="text-[0.65rem] text-zinc-400 dark:text-zinc-500">
                {{ t('graph.inspector.citedChunks', { count: card.cited_chunk_ids.length }) }}
              </span>
            </div>

            <p class="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
              {{ card.summary }}
            </p>

            <p
              v-if="card.tip"
              class="mt-3 rounded-lg border border-brandg-200 dark:border-brandg-900/60 bg-brandg-50 dark:bg-brandg-950/30 p-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200"
            >
              <span class="font-semibold">{{ t('graph.inspector.tip') }}</span> {{ card.tip }}
            </p>

            <!-- Shown, not hidden behind a disclosure. A summary that is
                 contested is a different claim from one that is not, and the
                 difference belongs next to the text, not one click away. -->
            <div
              v-if="card.controversy_note || card.confidence_note"
              class="mt-3 space-y-1.5"
            >
              <p
                v-if="card.controversy_note"
                class="flex gap-1.5 text-[0.7rem] leading-relaxed text-zinc-500 dark:text-zinc-400"
              >
                <UIcon
                  name="i-lucide-scale"
                  class="mt-px h-3 w-3 shrink-0"
                />
                <span>{{ card.controversy_note }}</span>
              </p>
              <p
                v-if="card.confidence_note"
                class="flex gap-1.5 text-[0.7rem] leading-relaxed text-zinc-500 dark:text-zinc-400"
              >
                <UIcon
                  name="i-lucide-gauge"
                  class="mt-px h-3 w-3 shrink-0"
                />
                <span>{{ card.confidence_note }}</span>
              </p>
            </div>
          </section>

          <!-- The card as a node of its own. Reached by clicking one on the
               map, where it is a mark like any other. It has no hierarchy and
               no evidence list of its own — what it describes has both — so
               the useful thing to offer is the way back to its subject. -->
          <section
            v-if="isCardOnly"
            class="border-b border-zinc-200 dark:border-zinc-800 p-4"
          >
            <button
              v-if="card?.target_id"
              type="button"
              class="flex w-full items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-2 text-left transition-colors hover:border-brand-400"
              @click="emit('select', card!.target_id)"
            >
              <UIcon
                name="i-lucide-corner-up-left"
                class="h-3.5 w-3.5 shrink-0 text-zinc-400"
              />
              <span class="min-w-0 flex-1 text-xs text-zinc-700 dark:text-zinc-200">
                {{ t('graph.inspector.describes', { kind: t(`graph.kind.${card!.target_type}`) }) }}
              </span>
            </button>
          </section>

          <!-- Facts. A definition list because that is what it is. -->
          <section
            v-else
            class="border-b border-zinc-200 dark:border-zinc-800 p-4"
          >
            <dl class="grid grid-cols-2 gap-x-3 gap-y-2">
              <div
                v-for="fact in facts"
                :key="fact.label"
              >
                <dt class="text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {{ fact.label }}
                </dt>
                <dd
                  class="mt-0.5 truncate text-sm text-zinc-800 dark:text-zinc-100"
                  :title="String(fact.value)"
                >
                  {{ fact.value }}
                </dd>
              </div>
            </dl>
            <p
              v-if="keywordTerms.length"
              class="mt-3"
            >
              <span class="text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {{ t('graph.inspector.keywords') }}
              </span>
              <span class="mt-1 flex flex-wrap gap-1">
                <span
                  v-for="term in keywordTerms"
                  :key="term"
                  class="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[0.7rem] text-zinc-600 dark:text-zinc-300"
                >{{ term }}</span>
              </span>
            </p>
          </section>

          <!-- Structure: children and themes, each a way further in. -->
          <section
            v-if="children.length || themes.length"
            class="border-b border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div v-if="children.length">
              <h4 class="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {{ t('graph.inspector.children') }} ({{ children.length }})
              </h4>
              <ul class="space-y-0.5">
                <li
                  v-for="child in children"
                  :key="child.node_id"
                >
                  <button
                    type="button"
                    class="group flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    @click="emit('select', child.node_id)"
                  >
                    <span
                      class="h-1.5 w-1.5 shrink-0 rounded-sm"
                      :style="{ backgroundColor: colorFor(child.kind) }"
                    />
                    <span class="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-200">{{ child.label }}</span>
                    <span class="shrink-0 text-[0.65rem] tabular-nums text-zinc-400 dark:text-zinc-500">{{ child.chunk_count }}</span>
                  </button>
                </li>
              </ul>
            </div>

            <div
              v-if="themes.length"
              :class="children.length ? 'mt-3' : ''"
            >
              <h4 class="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {{ t('graph.inspector.themes') }} ({{ themes.length }})
              </h4>
              <ul class="space-y-0.5">
                <li
                  v-for="themeNode in themes"
                  :key="themeNode.node_id"
                >
                  <button
                    type="button"
                    class="group flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    @click="emit('select', themeNode.node_id)"
                  >
                    <span
                      class="h-1.5 w-1.5 shrink-0 rounded-sm"
                      :style="{ backgroundColor: colorFor('theme') }"
                    />
                    <span class="min-w-0 flex-1 truncate text-xs text-zinc-700 dark:text-zinc-200">{{ themeNode.label }}</span>
                    <span class="shrink-0 text-[0.65rem] tabular-nums text-zinc-400 dark:text-zinc-500">{{ themeNode.chunk_count }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </section>

          <!-- Evidence. Loaded on demand: a page of passages is the heaviest
               thing here and most selections never open it.

               Hidden for a card, because the chunks route filters by what a
               passage is ATTACHED to, and nothing is attached to a card — its
               passages are the ones it cites, by id, and no route fetches
               those. The section would say "no passages" every time, which is
               false: the card cites several, they just belong to its target. -->
          <section
            v-if="!isCardOnly"
            class="p-4"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 text-left"
              :aria-expanded="evidenceOpen"
              @click="toggleEvidence"
            >
              <h4 class="text-[0.6rem] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {{ t('graph.inspector.evidencePassages') }}
              </h4>
              <UIcon
                :name="evidenceOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="h-4 w-4 text-zinc-400"
              />
            </button>

            <div
              v-if="evidenceOpen"
              class="mt-2 space-y-2"
            >
              <div
                v-if="chunksLoading"
                class="space-y-2"
              >
                <div
                  v-for="i in 3"
                  :key="i"
                  class="h-12 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                />
              </div>
              <p
                v-else-if="!chunks.length"
                class="text-xs text-zinc-500 dark:text-zinc-400"
              >
                {{ t('graph.inspector.noEvidence') }}
              </p>
              <article
                v-for="chunk in chunks"
                :key="chunk.chunk_id"
                class="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 p-2.5"
              >
                <p class="text-[0.75rem] leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {{ chunk.text }}
                </p>
                <p class="mt-1.5 flex flex-wrap items-center gap-x-2 text-[0.65rem] text-zinc-400 dark:text-zinc-500">
                  <span
                    v-if="chunk.source_type"
                    class="font-medium uppercase tracking-wide"
                  >{{ chunk.source_type }}</span>
                  <span v-if="chunk.year">{{ chunk.year }}</span>
                  <span
                    class="truncate"
                    :title="chunk.source_doc_id"
                  >{{ chunk.source_doc_id }}</span>
                </p>
              </article>
              <button
                v-if="chunks.length && chunksHasMore"
                type="button"
                class="w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:border-brand-400 hover:text-brand-600"
                :disabled="chunksLoading"
                @click="loadChunks(true)"
              >
                {{ t('graph.inspector.moreEvidence') }}
              </button>
            </div>
          </section>
        </template>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import graphApi from '~/services/graphApi'
import type {
  GraphCard,
  GraphChunk,
  GraphNodeKind,
  GraphNodeSummary,
  GraphShelfDetail,
  GraphThemeDetail
} from '~/services/graphApi'
import { GRAPH_THEME_DARK, GRAPH_THEME_LIGHT } from '~/utils/graphPalette'

/**
 * Everything about one node, in one panel.
 *
 * The node route returns breadcrumb, children, themes and card together, so
 * opening a node is one request rather than five. Evidence passages are the
 * exception and are fetched only when someone asks for them: they are the
 * heaviest payload here and most selections never open that section.
 */

const props = defineProps<{
  nodeId: string | null
  isDark?: boolean
}>()

const emit = defineEmits<{
  select: [nodeId: string]
  expand: [nodeId: string]
  /** Narrow the whole view to this node's subtree. */
  scope: [nodeId: string]
  /** Hand a question to the Question Answering tab. */
  ask: [question: string]
}>()

const { t } = useI18n()

const CHUNK_PAGE = 10

const loading = ref(false)
const error = ref<string | null>(null)
const detail = ref<GraphShelfDetail | GraphThemeDetail | null>(null)
const card = ref<GraphCard | null>(null)

const evidenceOpen = ref(false)
const chunks = ref<GraphChunk[]>([])
const chunksLoading = ref(false)
const chunksHasMore = ref(false)

const palette = computed(() => (props.isDark ? GRAPH_THEME_DARK : GRAPH_THEME_LIGHT))
const colorFor = (kind: GraphNodeKind) => palette.value.kind[kind]

/** Landed on a card directly, rather than on a node that has one. */
const isCardOnly = computed(() => !detail.value && !!card.value)
const kind = computed<GraphNodeKind>(() => (isCardOnly.value ? 'card' : detail.value?.kind ?? 'shelf'))
const kindColor = computed(() => colorFor(kind.value))
const title = computed(() => detail.value?.label ?? card.value?.title ?? '')
const status = computed(() => detail.value?.status ?? null)
const breadcrumb = computed<GraphNodeSummary[]>(() => detail.value?.breadcrumb ?? [])
const children = computed<GraphNodeSummary[]>(
  () => (detail.value as GraphShelfDetail | null)?.children ?? []
)
const themes = computed<GraphNodeSummary[]>(
  () => (detail.value as GraphShelfDetail | null)?.themes ?? []
)
const keywordTerms = computed<string[]>(
  () => (detail.value as GraphThemeDetail | null)?.keyword_terms ?? []
)

/**
 * The question this node would ask.
 *
 * The bridge back to Question Answering, which is the other reason someone is
 * on this page. A label is not a question, so it is phrased as one — and only
 * when there is a card, because a node with no written summary behind it has
 * nothing for the answer to stand on.
 */
const askableQuestion = computed(() => {
  if (!detail.value || !card.value) return null
  return t('graph.inspector.askTemplate', { topic: detail.value.label })
})

const facts = computed(() => {
  const node = detail.value
  if (!node) return []
  const out: Array<{ label: string, value: string | number }> = [
    { label: t('graph.inspector.evidence'), value: (node.chunk_count || 0).toLocaleString() }
  ]
  if (node.facet) out.push({ label: t('graph.inspector.facet'), value: t(`graph.facets.${node.facet}`, node.facet) })
  if (node.depth !== null && node.depth !== undefined) {
    out.push({ label: t('graph.inspector.depth'), value: node.depth })
  }
  const shelf = node as GraphShelfDetail
  if (shelf.foodon_id) out.push({ label: t('graph.inspector.foodonId'), value: shelf.foodon_id })
  if (shelf.support_lifted) {
    // Distinguished from direct support because they mean different things: a
    // shelf can be large only because its descendants are.
    out.push({ label: t('graph.inspector.supportLifted'), value: shelf.support_lifted.toLocaleString() })
  }
  const themeNode = node as GraphThemeDetail
  if (themeNode.discovered_by) {
    out.push({ label: t('graph.inspector.discoveredBy'), value: themeNode.discovered_by })
  }
  if (themeNode.shelf_ids?.length) {
    out.push({ label: t('graph.inspector.spansShelves'), value: themeNode.shelf_ids.length })
  }
  return out
})

function qualityClass(quality: string): string {
  // Status colours, reserved and never reused as a series hue. Each ships
  // with a word and an icon, so the state is never carried by colour alone.
  switch (quality) {
    case 'high': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200'
    case 'medium': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
    case 'low': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200'
    case 'debated': return 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200'
    default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
  }
}

function qualityIcon(quality: string): string {
  switch (quality) {
    case 'high': return 'i-lucide-circle-check'
    case 'medium': return 'i-lucide-circle-dot'
    case 'low': return 'i-lucide-circle-alert'
    case 'debated': return 'i-lucide-scale'
    default: return 'i-lucide-circle-help'
  }
}

async function load() {
  const id = props.nodeId
  if (!id) return
  loading.value = true
  error.value = null
  detail.value = null
  card.value = null
  chunks.value = []
  chunksHasMore.value = false
  try {
    const result = await graphApi.node(id)
    if (props.nodeId !== id) return // a faster click won
    if ((result as GraphCard).card_id && !(result as GraphNodeSummary).kind) {
      // Selecting a card node directly: there is no surrounding node, the
      // card IS the thing.
      card.value = result as GraphCard
      detail.value = null
    } else {
      detail.value = result as GraphShelfDetail | GraphThemeDetail
      card.value = (result as GraphShelfDetail).card ?? null
    }
    if (evidenceOpen.value) loadChunks()
  } catch (err) {
    if (props.nodeId !== id) return
    error.value = (err as { data?: { detail?: string } })?.data?.detail
      || (err as Error)?.message
      || t('graph.inspector.loadFailed')
  } finally {
    if (props.nodeId === id) loading.value = false
  }
}

async function loadChunks(more = false) {
  const id = props.nodeId
  if (!id || chunksLoading.value) return
  chunksLoading.value = true
  const offset = more ? chunks.value.length : 0
  try {
    const page = await graphApi.chunks(id, { limit: CHUNK_PAGE, offset })
    if (props.nodeId !== id) return
    chunks.value = more ? [...chunks.value, ...page] : page
    // A short page means the end. The route has no total, and asking for one
    // would cost a count query per open.
    chunksHasMore.value = page.length === CHUNK_PAGE
  } catch {
    if (props.nodeId === id) chunksHasMore.value = false
  } finally {
    if (props.nodeId === id) chunksLoading.value = false
  }
}

function toggleEvidence() {
  evidenceOpen.value = !evidenceOpen.value
  if (evidenceOpen.value && !chunks.value.length) loadChunks()
}

watch(() => props.nodeId, (id) => {
  evidenceOpen.value = false
  if (id) load()
  else {
    detail.value = null
    card.value = null
    error.value = null
  }
}, { immediate: true })
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { HelpArea, HelpFeatureDef, HelpFeatureText, HelpTopicDef } from '~/help/types'
import { topicForPath } from '~/help/topics'
import { requestDockPanel, useHelp } from '~/composables/useHelp'
import { useWalkthroughs } from '~/composables/useWalkthroughs'

/**
 * What the help panel says, shared by the desktop side panel and the phone
 * sheet. Two views: the topic (this page's, or one picked from the list) and
 * the list of every topic.
 */
const help = useHelp()
const walkthroughs = useWalkthroughs()
const sentry = useSentryFeedback()
const toast = useToast()
const { isCompact } = useViewport()

const ui = computed(() => help.content.value.ui)
const topic = computed(() => help.topic.value)
const topicText = computed(() => (topic.value ? help.content.value.topics[topic.value.id] : undefined))
const features = computed(() => (topic.value ? help.featuresOf(topic.value) : []))

/** The content files are typed complete, so the fallback is a safety net. */
function featureText(id: string): HelpFeatureText {
  return topicText.value?.features[id] ?? { title: id, body: '', steps: [] }
}

const expanded = ref<Set<string>>(new Set())
const starting = ref<string | null>(null)

// A new topic opens on its first feature, or on the one somebody linked to.
watch([() => topic.value?.id, () => help.focusFeature.value], async ([, focus]) => {
  const first = features.value[0]?.id
  const target = focus && features.value.some(f => f.id === focus) ? focus : first
  expanded.value = new Set(target ? [target] : [])
  if (focus) {
    await nextTick()
    document.getElementById(`help-feature-${focus}-root`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
}, { immediate: true })

function toggle(def: HelpFeatureDef) {
  const next = new Set(expanded.value)
  if (next.has(def.id)) {
    next.delete(def.id)
  } else {
    next.add(def.id)
    help.emit('expand', { topic: topic.value?.id, item: def.id })
  }
  expanded.value = next
}

/**
 * A tour runs on the page it explains. From the page's own topic that is
 * here; from a topic picked in the list it is the topic's home page — unless
 * the topic is about a page that has no fixed address (one recipe, one
 * article), where there is nowhere to send anyone.
 */
const canTour = computed(() => {
  if (!walkthroughs.ready.value || !topic.value) return false
  return help.isPageTopic.value || topicForPath(topic.value.home)?.id === topic.value.id
})

async function showMe(def: HelpFeatureDef) {
  if (!def.tour || !topic.value || starting.value) return
  starting.value = def.id
  help.emit('tour', { topic: topic.value.id, item: def.id })
  try {
    if (!help.isPageTopic.value) await navigateTo(topic.value.home)
    // The sheet covers the page on a phone, and the panel overlaps it below
    // the docking width; the tour needs to point at what is underneath.
    if (isCompact.value || !window.matchMedia('(min-width: 80rem)').matches) help.closeHelp()
    const started = await walkthroughs.start(def.tour)
    if (!started) {
      help.emit('tour_unavailable', { topic: topic.value?.id, item: def.id })
      toast.add({
        title: ui.value.tourUnavailable,
        description: ui.value.tourUnavailableBody,
        icon: 'i-lucide-route',
        color: 'neutral'
      })
    }
  } finally {
    starting.value = null
  }
}

const groupedTopics = computed(() => {
  const groups = new Map<HelpArea, HelpTopicDef[]>()
  for (const def of help.topics) {
    const list = groups.get(def.area) ?? []
    list.push(def)
    groups.set(def.area, list)
  }
  return [...groups.entries()]
})

function openFeedback() {
  help.emit('still_stuck', { action: 'feedback', topic: topic.value?.id })
  help.closeHelp()
  requestDockPanel('feedback')
}

function openBugReport() {
  help.emit('still_stuck', { action: 'bug', topic: topic.value?.id })
  help.closeHelp()
  void sentry.open({ source: 'help', topic: topic.value?.id ?? 'none' })
}
</script>

<template>
  <div class="space-y-5">
    <!-- Every topic, grouped by app. -->
    <template v-if="help.showingIndex.value || !topic || !topicText">
      <p
        v-if="!help.pageTopic.value"
        class="text-sm text-gray-600 dark:text-gray-300"
      >
        {{ ui.noTopic }}
      </p>
      <UButton
        v-else
        variant="link"
        color="neutral"
        size="sm"
        icon="i-lucide-arrow-left"
        class="-ml-2"
        @click="help.backToPage()"
      >
        {{ ui.backToPage }}
      </UButton>

      <section
        v-for="[area, defs] in groupedTopics"
        :key="area"
      >
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ ui.areas[area] }}
        </h3>
        <ul class="space-y-1">
          <li
            v-for="def in defs"
            :key="def.id"
          >
            <button
              type="button"
              class="flex w-full min-h-11 items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-white/5"
              @click="help.showTopic(def.id)"
            >
              <UIcon
                :name="def.icon"
                class="mt-0.5 size-4 shrink-0 text-brand-500"
              />
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  {{ help.content.value.topics[def.id].title }}
                  <UBadge
                    v-if="def.id === help.pageTopic.value?.id"
                    size="sm"
                    variant="subtle"
                    color="primary"
                  >{{ ui.thisPage }}</UBadge>
                </span>
                <span class="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {{ help.content.value.topics[def.id].summary }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </template>

    <!-- One topic. -->
    <template v-else>
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <UButton
          variant="link"
          color="neutral"
          size="sm"
          icon="i-lucide-layout-list"
          class="-ml-2"
          @click="help.showIndex()"
        >
          {{ ui.allTopics }}
        </UButton>
        <UButton
          v-if="!help.isPageTopic.value && help.pageTopic.value"
          variant="link"
          color="primary"
          size="sm"
          icon="i-lucide-arrow-left"
          @click="help.backToPage()"
        >
          {{ ui.backToPage }}
        </UButton>
      </div>

      <header class="flex gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
          <UIcon
            :name="topic.icon"
            class="size-5"
          />
        </span>
        <div class="min-w-0">
          <h2 class="text-base font-semibold leading-snug text-gray-900 dark:text-white">
            {{ topicText.title }}
          </h2>
          <p class="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <HelpText :text="topicText.summary" />
          </p>
        </div>
      </header>

      <section>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ ui.whatYouCanDo }}
        </h3>
        <div class="space-y-1.5">
          <HelpFeature
            v-for="def in features"
            :key="`${topic.id}:${def.id}`"
            :def="def"
            :text="featureText(def.id)"
            :ui="ui"
            :expanded="expanded.has(def.id)"
            :can-tour="canTour"
            :starting="starting === def.id"
            @toggle="toggle(def)"
            @show-me="showMe(def)"
            @video-play="help.emit('video', { topic: topic?.id, item: def.id })"
          />
        </div>
      </section>

      <section v-if="topicText.tips?.length">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ ui.tips }}
        </h3>
        <ul class="space-y-2">
          <li
            v-for="(tip, index) in topicText.tips"
            :key="index"
            class="flex gap-2 text-sm leading-relaxed text-gray-700 dark:text-gray-200"
          >
            <UIcon
              name="i-lucide-lightbulb"
              class="mt-0.5 size-4 shrink-0 text-amber-500"
            />
            <span><HelpText :text="tip" /></span>
          </li>
        </ul>
      </section>
    </template>

    <!-- Always: a way out when the help does not cover it. -->
    <section class="rounded-xl bg-gray-50 p-4 dark:bg-white/5">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ ui.stillStuck }}
      </h3>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {{ ui.stillStuckBody }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-smile"
          @click="openFeedback"
        >
          {{ ui.sendFeedback }}
        </UButton>
        <UButton
          v-if="sentry.enabled.value"
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-bug"
          @click="openBugReport"
        >
          {{ ui.reportBug }}
        </UButton>
      </div>
    </section>

    <p
      v-if="!isCompact"
      class="text-center text-xs text-gray-400 dark:text-gray-500"
    >
      {{ ui.keyboardHint }}
    </p>
  </div>
</template>

<template>
  <div class="min-h-screen bg-gradient-to-br from-earth-1 via-white to-earth-2 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
    <AppPageHeader
      :back-to="backLink.to"
      :back-label="backLink.label"
      brand-title="FoodScholar"
      brand-class="text-brand-500 dark:text-brand-400"
      subtitle="Textbook Library"
    />

    <div
      v-if="loading"
      class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <div class="grid animate-pulse gap-8 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <div class="h-5 w-32 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div class="h-12 w-5/6 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          <div class="h-6 w-2/3 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          <div class="h-56 rounded-2xl bg-white/80 ring-1 ring-zinc-200 dark:bg-zinc-800/60 dark:ring-zinc-700" />
        </div>
        <div class="space-y-4">
          <div class="h-72 rounded-2xl bg-white/80 ring-1 ring-zinc-200 dark:bg-zinc-800/60 dark:ring-zinc-700" />
          <div class="h-36 rounded-2xl bg-white/80 ring-1 ring-zinc-200 dark:bg-zinc-800/60 dark:ring-zinc-700" />
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="mx-auto max-w-2xl px-4 py-20"
    >
      <div class="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <div class="flex items-start gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <UIcon
              name="i-lucide-alert-circle"
              class="h-5 w-5 text-red-600 dark:text-red-400"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-semibold text-red-900 dark:text-red-100">
              Failed to load textbook
            </h2>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">
              {{ error }}
            </p>
            <UButton
              color="error"
              variant="soft"
              size="sm"
              class="mt-4"
              @click="loadTextbook"
            >
              Try again
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <main
      v-else-if="textbook"
      class="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
    >
      <div class="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-3">
        <div
          class="textbook-enter z-20 flex justify-end lg:sticky lg:top-20 lg:col-start-3 lg:row-start-1 lg:self-start"
          style="--delay: 40ms"
        >
          <div class="inline-flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white/90 p-2 shadow-lg shadow-gray-900/5 backdrop-blur-xl dark:border-zinc-700 dark:bg-zinc-900/85 dark:shadow-black/20">
            <LibrarySaveToLibraryButton
              :item-ref="textbook.urn"
              item-type="textbook"
              size="md"
            />
            <UButton
              v-if="authStore.hasAnyRole(['expert', 'admin'])"
              :to="`/console/assets/textbooks/${encodeURIComponent(textbook.urn)}`"
              color="primary"
              size="md"
              icon="i-lucide-pencil"
            >
              Edit textbook
            </UButton>
          </div>
        </div>

        <article class="min-w-0 space-y-8 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <header
            class="textbook-enter"
            style="--delay: 0ms"
          >
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <UBadge
                color="primary"
                variant="subtle"
              >
                <UIcon
                  name="i-lucide-book-open"
                  class="mr-1 h-3.5 w-3.5"
                />
                Textbook
              </UBadge>
              <UBadge
                v-if="primaryTopic"
                variant="outline"
                class="text-gray-600 dark:text-gray-300"
              >
                <UIcon
                  name="i-lucide-compass"
                  class="mr-1 h-3.5 w-3.5"
                />
                {{ primaryTopic }}
              </UBadge>
              <UBadge
                v-if="textbook.review_status === 'verified'"
                color="success"
                variant="subtle"
              >
                <UIcon
                  name="i-lucide-shield-check"
                  class="mr-1 h-3.5 w-3.5"
                />
                Verified
              </UBadge>
            </div>

            <h1 class="max-w-4xl text-4xl font-light tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              {{ textbook.title }}
            </h1>
            <p
              v-if="textbook.subtitle"
              class="mt-3 max-w-3xl font-serif text-xl italic leading-relaxed text-gray-500 dark:text-gray-400 sm:text-2xl"
            >
              {{ textbook.subtitle }}
            </p>

            <div
              v-if="licensePresentation"
              class="mt-6 inline-flex max-w-full flex-wrap items-center gap-3 rounded-2xl border border-brand-200/80 bg-brand-50/70 px-4 py-3 text-brand-950 shadow-sm dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-100"
            >
              <div
                class="flex shrink-0 items-center gap-1.5 text-brand-700 dark:text-brand-300"
                :aria-label="licensePresentation.label"
              >
                <span
                  v-for="mark in licensePresentation.marks"
                  :key="mark.code"
                  :title="mark.label"
                  :class="[
                    'license-mark relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    mark.code === 'sa' || mark.code === 'zero'
                      ? 'border-2 border-current'
                      : '',
                    mark.code === 'nc' ? 'license-mark--nc' : ''
                  ]"
                >
                  <UIcon
                    v-if="mark.icon"
                    :name="mark.icon"
                    :class="mark.code === 'sa' ? 'h-4.5 w-4.5' : 'h-8 w-8'"
                    aria-hidden="true"
                  />
                  <span
                    v-else
                    class="text-sm font-bold"
                    aria-hidden="true"
                  >0</span>
                </span>
              </div>
              <div class="min-w-0">
                <p class="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-brand-600/80 dark:text-brand-300/80">
                  Licence
                </p>
                <p class="break-words text-sm font-semibold">
                  {{ licensePresentation.label }}
                </p>
              </div>
            </div>

            <div
              v-if="textbook.authors.length"
              class="mt-5 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <UIcon
                name="i-lucide-users"
                class="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
              />
              <span>{{ formatAuthors(textbook.authors) }}</span>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <span
                v-if="textbook.publisher"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-building-2"
                  class="h-4 w-4"
                />
                {{ textbook.publisher }}
              </span>
              <span
                v-if="textbook.publication_year"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-calendar"
                  class="h-4 w-4"
                />
                {{ textbook.publication_year }}
              </span>
              <span
                v-if="textbook.edition"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-layers-3"
                  class="h-4 w-4"
                />
                {{ textbook.edition }} edition
              </span>
              <span
                v-if="textbook.page_count"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-files"
                  class="h-4 w-4"
                />
                {{ textbook.page_count.toLocaleString() }} pages
              </span>
              <span
                v-if="textbook.language"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-languages"
                  class="h-4 w-4"
                />
                {{ textbook.language.toUpperCase() }}
              </span>
              <span
                v-if="textbook.audience"
                class="inline-flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-graduation-cap"
                  class="h-4 w-4"
                />
                {{ textbook.audience }}
              </span>
            </div>
          </header>

          <section
            v-if="textbook.description"
            class="textbook-enter rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50 sm:p-7"
            style="--delay: 70ms"
          >
            <h2 class="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
              <UIcon
                name="i-lucide-align-left"
                class="h-5 w-5 text-brand-600 dark:text-brand-400"
              />
              About this textbook
            </h2>
            <p class="mt-4 whitespace-pre-wrap text-base font-light leading-7 text-gray-700 dark:text-gray-300">
              {{ textbook.description }}
            </p>
          </section>

          <section
            v-if="pdfArtifacts.length"
            class="textbook-enter overflow-hidden rounded-2xl border border-red-200/80 bg-white/90 shadow-sm dark:border-red-900/60 dark:bg-zinc-800/50"
            style="--delay: 110ms"
          >
            <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div class="flex min-w-0 items-center gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900">
                  <UIcon
                    name="i-lucide-file-text"
                    class="h-6 w-6"
                  />
                </div>
                <div class="min-w-0">
                  <h2 class="font-semibold text-gray-900 dark:text-white">
                    Download the textbook
                  </h2>
                  <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {{ pdfArtifacts.length === 1 ? artifactDownloadDescription(pdfArtifacts[0]!) : `${pdfArtifacts.length} PDF files are available.` }}
                  </p>
                </div>
              </div>
              <div class="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <UButton
                  v-for="(artifact, index) in pdfArtifacts"
                  :key="artifact.id"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-download"
                  :loading="downloadingArtifactId === artifact.id"
                  :disabled="!artifact.id"
                  class="justify-center"
                  @click="downloadArtifact(artifact)"
                >
                  {{ pdfArtifacts.length === 1 ? 'Download PDF' : `PDF ${index + 1}` }}
                </UButton>
              </div>
            </div>
          </section>

          <section
            v-if="passages.length"
            class="textbook-enter overflow-hidden rounded-2xl border border-gray-200 bg-white/90 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
            style="--delay: 140ms"
          >
            <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-zinc-700">
              <div>
                <h2 class="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                  <UIcon
                    name="i-lucide-text-quote"
                    class="h-5 w-5 text-brand-600 dark:text-brand-400"
                  />
                  Inside this textbook
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Indexed excerpts you can discover through FoodScholar.
                </p>
              </div>
              <UBadge
                color="neutral"
                variant="outline"
              >
                {{ passages.length }} excerpt{{ passages.length === 1 ? '' : 's' }}
              </UBadge>
            </div>

            <ol class="divide-y divide-gray-100 dark:divide-zinc-700">
              <li
                v-for="passage in visiblePassages"
                :key="passage.id"
                class="group px-6 py-5 transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-950/10"
              >
                <div class="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    v-if="passage.structure_path.length"
                    class="font-semibold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-400"
                  >
                    {{ passage.structure_path.join(' · ') }}
                  </span>
                  <span
                    v-if="passage.page_no != null"
                    class="ml-auto inline-flex items-center gap-1 text-gray-400 dark:text-gray-500"
                  >
                    <UIcon
                      name="i-lucide-file-text"
                      class="h-3.5 w-3.5"
                    />
                    Page {{ passage.page_no }}
                  </span>
                </div>
                <p class="line-clamp-5 text-sm font-light leading-6 text-gray-700 dark:text-gray-300">
                  {{ passage.text }}
                </p>
              </li>
            </ol>

            <div
              v-if="passages.length > passagePreviewLimit"
              class="border-t border-gray-100 px-6 py-4 dark:border-zinc-700"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                :aria-expanded="showAllPassages"
                @click="showAllPassages = !showAllPassages"
              >
                {{ showAllPassages ? 'Show fewer excerpts' : `Show all ${passages.length} excerpts` }}
                <UIcon
                  :name="showAllPassages ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="h-4 w-4"
                />
              </button>
            </div>
          </section>

          <section
            v-if="otherArtifacts.length"
            class="textbook-enter rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
            style="--delay: 210ms"
          >
            <div class="mb-4">
              <h2 class="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                <UIcon
                  name="i-lucide-paperclip"
                  class="h-5 w-5 text-brand-600 dark:text-brand-400"
                />
                Additional source material
              </h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Files attached to this catalog record.
              </p>
            </div>

            <ul class="space-y-3">
              <li
                v-for="artifact in otherArtifacts"
                :key="artifact.id"
                class="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-zinc-700 dark:bg-zinc-900/40 sm:flex-row sm:items-center"
              >
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  <UIcon
                    :name="artifactIcon(artifact)"
                    class="h-5 w-5"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {{ artifact.title || 'Textbook file' }}
                  </p>
                  <p
                    v-if="artifact.description"
                    class="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{ artifact.description }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {{ artifactTypeLabel(artifact) }}
                    <template v-if="artifact.file_size">
                      · {{ formatFileSize(artifact.file_size) }}
                    </template>
                  </p>
                </div>
                <UButton
                  v-if="artifact.id"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-external-link"
                  :loading="openingArtifactId === artifact.id"
                  class="shrink-0 justify-center"
                  @click="openArtifact(artifact)"
                >
                  Open file
                </UButton>
              </li>
            </ul>
          </section>
        </article>

        <aside class="lg:col-start-3 lg:row-start-2">
          <div class="lg:sticky lg:top-24 space-y-6">
            <section
              v-if="detailItems.length"
              class="textbook-enter rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
              style="--delay: 40ms"
            >
              <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <UIcon
                  name="i-lucide-book-marked"
                  class="h-5 w-5"
                />
                Book details
              </h2>
              <dl class="mt-5 space-y-4">
                <div
                  v-for="item in detailItems"
                  :key="item.label"
                  class="flex items-start gap-3"
                >
                  <UIcon
                    :name="item.icon"
                    class="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
                  />
                  <div class="min-w-0">
                    <dt class="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {{ item.label }}
                    </dt>
                    <dd
                      class="mt-0.5 break-words text-sm text-gray-700 dark:text-gray-300"
                      :class="item.mono ? 'font-mono text-xs' : ''"
                    >
                      {{ item.value }}
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            <section
              v-if="subjectTags.length"
              class="textbook-enter rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
              style="--delay: 100ms"
            >
              <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <UIcon
                  name="i-lucide-tags"
                  class="h-5 w-5"
                />
                Subjects and keywords
              </h2>
              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="subject in subjectTags"
                  :key="subject.value"
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs',
                    subject.primary
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300'
                  ]"
                >
                  {{ subject.value }}
                </span>
              </div>
            </section>

            <section
              v-if="sourceUrl || doiUrl"
              class="textbook-enter rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
              style="--delay: 160ms"
            >
              <h2 class="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <UIcon
                  name="i-lucide-library-big"
                  class="h-5 w-5"
                />
                Source links
              </h2>

              <div class="mt-4 grid gap-2">
                <UButton
                  v-if="sourceUrl"
                  :to="sourceUrl"
                  target="_blank"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-external-link"
                  class="justify-center"
                >
                  Open {{ sourceHost }}
                </UButton>
                <UButton
                  v-if="doiUrl"
                  :to="doiUrl"
                  target="_blank"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-external-link"
                  class="justify-center"
                >
                  View DOI record
                </UButton>
              </div>
            </section>

            <NuxtLink
              to="/foodscholar/textbooks"
              class="textbook-enter group flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/80 p-5 transition-colors hover:bg-brand-100/80 dark:border-brand-800 dark:bg-brand-900/20 dark:hover:bg-brand-900/30"
              style="--delay: 280ms"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                <UIcon
                  name="i-lucide-library"
                  class="h-5 w-5"
                />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-brand-900 dark:text-brand-100">
                  Textbook Library
                </p>
                <p class="text-xs text-brand-700 dark:text-brand-300">
                  Browse more reference books
                </p>
              </div>
              <UIcon
                name="i-lucide-arrow-right"
                class="h-4 w-4 text-brand-600 transition-transform group-hover:translate-x-1 dark:text-brand-400"
              />
            </NuxtLink>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { track } from '~/composables/useTelemetry'
import textbooksApi from '~/services/textbooksApi'
import type { Textbook, TextbookArtifact, TextbookPassage } from '~/services/textbooksApi'
import {
  fetchCatalogArtifactDownloadResponse,
  getArtifactPresignedUrl,
  hasS3Backing
} from '~/services/objectStorageApi'
import { useAuthStore } from '~/stores/auth'
import { formatDoiUrl } from '~/utils/articleHelpers'

definePageMeta({ middleware: ['auth', 'profile'] })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const urn = computed(() => {
  const raw = route.params.urn
  const value = Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
  try {
    return decodeURIComponent(String(value))
  } catch {
    return String(value)
  }
})

const backLink = computed(() => {
  const previous = router.options.history.state.back as string | undefined
  if (previous && previous.startsWith('/foodscholar') && !previous.startsWith('/foodscholar/textbooks')) {
    return { to: '/foodscholar', label: 'FoodScholar' }
  }
  return { to: '/foodscholar/textbooks', label: 'Textbook Library' }
})

const textbook = ref<Textbook | null>(null)
const passages = ref<TextbookPassage[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showAllPassages = ref(false)
const downloadingArtifactId = ref('')
const openingArtifactId = ref('')

const passagePreviewLimit = 6

type DetailItem = {
  label: string
  value: string
  icon: string
  mono?: boolean
}

type SubjectTag = {
  value: string
  primary: boolean
}

type LicenseMark = {
  code: 'cc' | 'by' | 'nc' | 'sa' | 'nd' | 'zero' | 'generic'
  label: string
  icon: string | null
}

type LicensePresentation = {
  label: string
  marks: LicenseMark[]
}

const cleanStrings = (values: unknown): string[] => {
  if (!Array.isArray(values)) return []
  return [...new Set(values
    .filter((value): value is string => typeof value === 'string')
    .map(value => value.trim())
    .filter(Boolean))]
}

const primaryTopic = computed(() => cleanStrings(textbook.value?.topics)[0] || '')

const licensePresentation = computed<LicensePresentation | null>(() => {
  const raw = String(textbook.value?.license ?? '').trim()
  if (!raw) return null

  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (compact.startsWith('CC0')) {
    return {
      label: 'CC0',
      marks: [
        { code: 'cc', label: 'Creative Commons', icon: 'i-lucide-creative-commons' },
        { code: 'zero', label: 'No rights reserved', icon: null }
      ]
    }
  }

  if (compact.startsWith('CC') && ['BY', 'NC', 'SA', 'ND'].some(code => compact.includes(code))) {
    const terms: Array<'BY' | 'NC' | 'SA' | 'ND'> = []
    if (compact.includes('BY')) terms.push('BY')
    if (compact.includes('NC')) terms.push('NC')
    if (compact.includes('SA')) terms.push('SA')
    if (compact.includes('ND')) terms.push('ND')

    const definitions: Record<(typeof terms)[number], LicenseMark> = {
      BY: { code: 'by', label: 'Attribution', icon: 'i-lucide-circle-user-round' },
      NC: { code: 'nc', label: 'Non-commercial', icon: 'i-lucide-circle-dollar-sign' },
      SA: { code: 'sa', label: 'Share alike', icon: 'i-lucide-refresh-ccw' },
      ND: { code: 'nd', label: 'No derivatives', icon: 'i-lucide-circle-equal' }
    }
    const version = raw.match(/\b([1-4]\.0)\b/)?.[1]

    return {
      label: `CC ${terms.join('-')}${version ? ` ${version}` : ''}`,
      marks: [
        { code: 'cc', label: 'Creative Commons', icon: 'i-lucide-creative-commons' },
        ...terms.map(term => definitions[term])
      ]
    }
  }

  let icon = 'i-lucide-scale'
  if (/public.?domain/i.test(raw)) icon = 'i-lucide-copyright'
  if (/proprietary|all rights reserved/i.test(raw)) icon = 'i-lucide-lock-keyhole'
  if (/open.?access|\boa\b/i.test(raw)) icon = 'i-lucide-lock-open'

  return {
    label: formatLicenseName(raw),
    marks: [{ code: 'generic', label: 'Licence', icon }]
  }
})

const visiblePassages = computed(() => {
  if (showAllPassages.value) return passages.value
  return passages.value.slice(0, passagePreviewLimit)
})

const subjectTags = computed<SubjectTag[]>(() => {
  const topics = cleanStrings(textbook.value?.topics)
  const secondary = cleanStrings([
    ...(textbook.value?.keywords ?? []),
    ...(textbook.value?.tags ?? [])
  ]).filter(value => !topics.includes(value))

  return [
    ...topics.map(value => ({ value, primary: true })),
    ...secondary.map(value => ({ value, primary: false }))
  ]
})

const pdfArtifacts = computed(() =>
  (textbook.value?.artifacts ?? []).filter(artifact => artifactTypeLabel(artifact) === 'PDF'))

const otherArtifacts = computed(() =>
  (textbook.value?.artifacts ?? []).filter(artifact => artifactTypeLabel(artifact) !== 'PDF'))

const detailItems = computed<DetailItem[]>(() => {
  const book = textbook.value
  if (!book) return []

  const items: DetailItem[] = []
  const add = (label: string, value: unknown, icon: string, mono = false) => {
    const text = String(value ?? '').trim()
    if (!text || ['unknown', 'n/a', 'not stated'].includes(text.toLowerCase())) return
    items.push({ label, value: text, icon, mono })
  }

  add('Region', book.region, 'i-lucide-map-pin')
  add('ISBN', book.isbn13 || book.isbn10, 'i-lucide-scan-barcode', true)
  add('Version', book.version, 'i-lucide-git-branch')
  if (book.editors.length) add('Editors', book.editors.join(', '), 'i-lucide-user-round-pen')
  if (book.applicability_status !== 'unknown') {
    add('Applicability', formatLabel(book.applicability_status), 'i-lucide-circle-check')
  }
  return items
})

const sourceUrl = computed(() => {
  const value = String(textbook.value?.url ?? '').trim()
  if (!value) return null
  try {
    const parsed = new URL(value)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
})

const sourceHost = computed(() => {
  if (!sourceUrl.value) return 'source'
  try {
    return new URL(sourceUrl.value).hostname.replace(/^www\./, '')
  } catch {
    return 'source'
  }
})

const doiUrl = computed(() => formatDoiUrl(textbook.value?.doi))

useHead(() => ({
  title: textbook.value ? `${textbook.value.title} – FoodScholar` : 'Textbook – FoodScholar'
}))

useSeoMeta({
  description: computed(() => textbook.value?.description || 'Explore this textbook in the FoodScholar library.')
})

async function loadTextbook() {
  loading.value = true
  error.value = null
  passages.value = []
  showAllPassages.value = false
  try {
    textbook.value = await textbooksApi.getTextbook(urn.value)
    track('catalog.view', { entry_type: 'textbook', urn: urn.value }, 'catalog')
    passages.value = await textbooksApi.fetchPassages(urn.value).catch(() => [])
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(loadTextbook)

function formatAuthors(authors: string[]): string {
  const values = cleanStrings(authors)
  if (!values.length) return 'Unknown author'
  if (values.length <= 5) return values.join(', ')
  return `${values.slice(0, 5).join(', ')} et al.`
}

function formatLabel(value: unknown): string {
  return String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function formatLicenseName(value: string): string {
  const known: Record<string, string> = {
    'public-domain': 'Public domain',
    'publisher-specific-oa': 'Open access (publisher-specific)',
    'unspecified-oa': 'Open access (unspecified)',
    'other-oa': 'Open access (other)',
    'implied-oa': 'Open access (implied)',
    'proprietary': 'Proprietary / all rights reserved'
  }
  return known[value.toLowerCase()] || formatLabel(value)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function artifactTypeLabel(artifact: TextbookArtifact): string {
  const value = String(artifact.file_type || '').toLowerCase()
  if (value.includes('pdf')) return 'PDF'
  if (value.includes('/')) return value.split('/').pop()?.toUpperCase() || 'FILE'
  return value.toUpperCase() || 'FILE'
}

function artifactIcon(artifact: TextbookArtifact): string {
  return artifactTypeLabel(artifact) === 'PDF' ? 'i-lucide-file-text' : 'i-lucide-file'
}

function artifactDownloadDescription(artifact: TextbookArtifact): string {
  const title = artifact.title?.trim() || 'Original PDF'
  return artifact.file_size ? `${title} · ${formatFileSize(artifact.file_size)}` : title
}

async function fetchArtifactResponse(artifact: TextbookArtifact) {
  if (hasS3Backing(artifact)) {
    try {
      const url = await getArtifactPresignedUrl(artifact)
      return await fetch(url)
    } catch {
      return fetchCatalogArtifactDownloadResponse(artifact.id)
    }
  }

  return fetchCatalogArtifactDownloadResponse(artifact.id)
}

function artifactFilename(artifact: TextbookArtifact, response: Response): string {
  const disposition = response.headers.get('content-disposition') || ''
  const utf8Name = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  let responseName = plainName

  if (utf8Name) {
    try {
      responseName = decodeURIComponent(utf8Name)
    } catch {
      responseName = utf8Name
    }
  }

  const fallback = artifact.title?.trim() || `textbook-${artifact.id}`
  const safeName = String(responseName || fallback)
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim()

  if (artifactTypeLabel(artifact) === 'PDF' && !safeName.toLowerCase().endsWith('.pdf')) {
    return `${safeName}.pdf`
  }
  return safeName
}

async function downloadArtifact(artifact: TextbookArtifact) {
  downloadingArtifactId.value = artifact.id
  try {
    const response = await fetchArtifactResponse(artifact)
    if (!response.ok) throw new Error(`Download failed with status ${response.status}`)

    const blobUrl = URL.createObjectURL(await response.blob())
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = artifactFilename(artifact, response)
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(blobUrl)
  } catch (downloadError) {
    console.error('[TextbookDetail] Failed to download artifact:', downloadError)
    toast.add({
      title: 'Download failed',
      description: 'The textbook file could not be downloaded right now.',
      color: 'error'
    })
  } finally {
    downloadingArtifactId.value = ''
  }
}

async function openArtifact(artifact: TextbookArtifact) {
  const popup = window.open('', '_blank', 'noopener,noreferrer')
  openingArtifactId.value = artifact.id
  try {
    if (hasS3Backing(artifact)) {
      const url = await getArtifactPresignedUrl(artifact)
      if (popup) popup.location.href = url
      else window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    const response = await fetchCatalogArtifactDownloadResponse(artifact.id)
    if (!response.ok) throw new Error(`Open failed with status ${response.status}`)

    const blobUrl = URL.createObjectURL(await response.blob())
    if (popup) popup.location.href = blobUrl
    else window.open(blobUrl, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  } catch (openError) {
    popup?.close()
    console.error('[TextbookDetail] Failed to open artifact:', openError)
    toast.add({
      title: 'File could not be opened',
      description: 'Please try again in a moment.',
      color: 'error'
    })
  } finally {
    openingArtifactId.value = ''
  }
}
</script>

<style scoped>
.textbook-enter {
  animation: textbook-enter 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0ms);
}

.license-mark--nc::after {
  position: absolute;
  width: 70%;
  height: 2px;
  border-radius: 9999px;
  background: currentColor;
  content: '';
  transform: rotate(-45deg);
}

@keyframes textbook-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .textbook-enter {
    animation: none;
  }
}
</style>

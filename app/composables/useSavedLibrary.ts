import { ref, computed } from 'vue'
import { useHouseholdStore } from '~/stores/household'
import memberSavedItemsApi, { type SavedItemType } from '~/services/memberSavedItemsApi'
import articlesApi, { type Article } from '~/services/articlesApi'
import catalogApi, { type CatalogGuide } from '~/services/catalogApi'
import textbooksApi, { type Textbook } from '~/services/textbooksApi'

/**
 * Loads a member's saved LITERATURE (articles, guides, textbooks) and hydrates
 * each URN into its full card object. Recipes are handled separately on the
 * library page via the recipe store — this covers everything else the typed
 * saved-items backend can hold.
 *
 * Each item is fetched by URN in parallel; a single failed fetch (e.g. a guide
 * that was since removed) is dropped rather than failing the whole section, so
 * one stale save can't blank the list.
 */

interface SavedLiterature {
  articles: Article[]
  guides: CatalogGuide[]
  textbooks: Textbook[]
}

async function hydrate<T>(
  refs: string[],
  fetchOne: (urn: string) => Promise<T>
): Promise<T[]> {
  const settled = await Promise.allSettled(refs.map(urn => fetchOne(urn)))
  return settled
    .filter((r): r is PromiseFulfilledResult<T> => r.status === 'fulfilled')
    .map(r => r.value)
}

export function useSavedLibrary() {
  const householdStore = useHouseholdStore()

  const articles = ref<Article[]>([])
  const guides = ref<CatalogGuide[]>([])
  const textbooks = ref<Textbook[]>([])
  const loading = ref(false)
  const error = ref(false)

  // How many URNs were saved per type, independent of how many hydrated — lets
  // the page tell "you saved nothing" from "we couldn't load what you saved".
  const savedCounts = ref<Record<SavedItemType, number>>({
    recipe: 0, article: 0, guide: 0, textbook: 0
  })

  const total = computed(
    () => articles.value.length + guides.value.length + textbooks.value.length
  )
  const literatureSavedCount = computed(
    () => savedCounts.value.article + savedCounts.value.guide + savedCounts.value.textbook
  )

  const load = async () => {
    const memberId = householdStore.currentMember?.id
    if (!memberId) {
      articles.value = []
      guides.value = []
      textbooks.value = []
      return
    }

    loading.value = true
    error.value = false
    try {
      // One list call per type (each returns just the saved URNs).
      const [articleItems, guideItems, textbookItems] = await Promise.all([
        memberSavedItemsApi.listSavedItems(memberId, 'article'),
        memberSavedItemsApi.listSavedItems(memberId, 'guide'),
        memberSavedItemsApi.listSavedItems(memberId, 'textbook')
      ])

      savedCounts.value = {
        recipe: savedCounts.value.recipe,
        article: articleItems.length,
        guide: guideItems.length,
        textbook: textbookItems.length
      }

      const [a, g, t] = await Promise.all([
        hydrate(articleItems.map(i => i.item_ref), urn => articlesApi.getArticle(urn)),
        hydrate(guideItems.map(i => i.item_ref), urn => catalogApi.getGuide(urn)),
        hydrate(textbookItems.map(i => i.item_ref), urn => textbooksApi.getTextbook(urn))
      ])
      articles.value = a
      guides.value = g
      textbooks.value = t
    } catch (e) {
      console.error('[useSavedLibrary] Failed to load saved literature:', e)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  return {
    articles, guides, textbooks,
    loading, error, total, literatureSavedCount, savedCounts,
    load
  }
}

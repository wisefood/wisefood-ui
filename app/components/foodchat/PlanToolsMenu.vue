<template>
  <!--
    FoodChat's tools, as buttons.

    Typed capabilities — summarise the week or one day, total a plan, list what
    to buy, keep the plan, replace one day, swap one meal — reachable only by
    hoping a sentence classified into the right handler. Most of them had no
    route through the gateway at all, so no caller was even possible.

    The manifest drives this menu rather than a hardcoded list: FoodChat
    generates it from its own registry, so a tool that exists is offered and a
    tool that is offered exists. Each entry declares whether it changes the plan,
    which is what separates the confirm-first items from the rest.
  -->
  <UDropdownMenu
    :items="menuItems"
    :popper="{ placement: 'bottom-end' }"
  >
    <UButton
      size="xs"
      color="neutral"
      variant="ghost"
      :icon="running ? 'i-lucide-loader-2' : 'i-lucide-wand-sparkles'"
      :class="running ? 'animate-spin' : ''"
      :disabled="busy || !available.length"
      :aria-label="t('foodChatHome.tools.label')"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { FoodChatTool } from '~/services/foodchatApi'

const props = withDefaults(defineProps<{
  /** The manifest, as fetched. Empty means the surface is unreachable — the
      button disables rather than offering actions that will 404. */
  tools: FoodChatTool[]
  /** Which canvas this menu sits on: it decides what the tools can target. */
  planType: 'daily' | 'weekly'
  /** The day this menu belongs to, on a weekly or multi-day plan. */
  day?: number | null
  /**
   * Where this menu sits.
   *
   * `'day'` is the copy that hangs off one day's row, and it offers only the
   * tools that are ABOUT a day. Without this every day row repeated the whole
   * plan-level list — "summarise the week" and "what to buy" once per day —
   * which reads as seven ways to do the same thing.
   */
  scope?: 'plan' | 'day'
  /** Name of the tool currently running, so only its own button spins. */
  running?: string | null
  busy?: boolean
}>(), {
  day: null,
  scope: 'plan',
  running: null,
  busy: false
})

const emit = defineEmits<{
  invoke: [tool: FoodChatTool, args: Record<string, unknown>]
}>()

const { t } = useI18n()

/** A tool is offered only when this canvas can supply its required arguments. */
const available = computed(() => props.tools.filter(
  tool => argsFor(tool) !== null && inScope(tool)
))

/** Day menus offer day tools; the plan menu offers everything it can supply. */
function inScope(tool: FoodChatTool): boolean {
  if (props.scope !== 'day') return true
  return 'day' in (tool.parameters?.properties ?? {})
}

const running = computed(() =>
  Boolean(props.running && available.value.some(tool => tool.name === props.running))
)

/**
 * The arguments this canvas can give a tool, or null when it cannot.
 *
 * `session_id` is filled by the caller, which owns it. What is decided here is
 * everything positional: a day-scoped tool needs a day, and a menu with no day
 * cannot honestly offer one. Returning null rather than guessing keeps the
 * "replace this day" item off a canvas where "this day" has no meaning.
 */
function argsFor(tool: FoodChatTool): Record<string, unknown> | null {
  const required = tool.parameters?.required ?? []
  const args: Record<string, unknown> = {}

  if (required.includes('day')) {
    if (props.day == null) return null
    args.day = props.day
  }
  if (required.includes('meal_type')) {
    // Nothing on this menu addresses a single slot — the meal card's own
    // replace control does. Offering it here would need a slot picker.
    return null
  }
  if ((tool.parameters?.properties ?? {}).plan_type) {
    args.plan_type = props.planType
  }
  return args
}

/**
 * Readers first, then the tools that change the plan.
 *
 * Two groups rather than one list: `UDropdownMenu` draws a separator between
 * nested arrays, and the manifest already says which side each tool belongs on.
 * A member should not find "replace this day" sitting flush against "show the
 * totals" as if they carried the same weight.
 */
const menuItems = computed<DropdownMenuItem[][]>(() => {
  const toItem = (tool: FoodChatTool): DropdownMenuItem => ({
    label: label(tool),
    icon: props.running === tool.name ? 'i-lucide-loader-2' : icon(tool.name),
    disabled: props.busy,
    onSelect: () => {
      const args = argsFor(tool)
      if (args) emit('invoke', tool, args)
    }
  })
  const readers = available.value.filter(tool => !tool.mutates).map(toItem)
  const mutators = available.value.filter(tool => tool.mutates).map(toItem)
  return [readers, mutators].filter(group => group.length > 0)
})

/**
 * The translated label when there is one, the manifest's summary otherwise.
 *
 * A tool added to FoodChat's registry appears here immediately, in English,
 * rather than not appearing until someone remembers the locale files.
 */
function label(tool: FoodChatTool): string {
  const key = `foodChatHome.tools.${TOOL_KEYS[tool.name] ?? ''}`
  if (!TOOL_KEYS[tool.name]) return tool.summary
  const translated = t(key, props.day != null ? { day: props.day } : {})
  return translated === key ? tool.summary : translated
}

const TOOL_KEYS: Record<string, string> = {
  summarize_week: 'weekSummary',
  summarize_day: 'daySummary',
  replace_day: 'replaceDay',
  plan_totals: 'planTotals',
  save_plan: 'savePlan',
  shopping_list: 'shoppingList'
}

const TOOL_ICONS: Record<string, string> = {
  summarize_week: 'i-lucide-calendar-range',
  summarize_day: 'i-lucide-calendar-check',
  replace_day: 'i-lucide-refresh-cw',
  plan_totals: 'i-lucide-calculator',
  swap_meal: 'i-lucide-repeat',
  save_plan: 'i-lucide-bookmark',
  shopping_list: 'i-lucide-shopping-basket'
}

function icon(name: string): string {
  return TOOL_ICONS[name] ?? 'i-lucide-play'
}
</script>

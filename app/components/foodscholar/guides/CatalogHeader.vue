<template>
  <UCard
    :ui="{ body: 'p-6 sm:p-8' }"
    class="overflow-hidden border border-gray-200/70 bg-white/95 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
  >
    <div class="relative">
      <div class="absolute inset-x-0 top-0 h-24 rounded-3xl bg-gradient-to-r from-brand-100/70 via-earth-1/90 to-brandg-100/70 blur-3xl dark:from-brand-500/10 dark:via-brandp-500/5 dark:to-brandg-500/10" />

      <div class="relative space-y-6">
        <div class="space-y-3">
          <UBadge
            v-if="badge"
            color="primary"
            variant="soft"
          >
            {{ badge }}
          </UBadge>

          <div class="space-y-2">
            <h1 class="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              {{ title }}
            </h1>
            <p class="max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300 sm:text-base">
              {{ description }}
            </p>
          </div>

          <div v-if="$slots.default" class="flex flex-wrap gap-2">
            <slot />
          </div>
        </div>

        <form class="space-y-3" @submit.prevent="emit('submit')">
          <FoodscholarNLInput
            :model-value="modelValue"
            :placeholder="placeholder"
            :input-class="inputClass"
            @update:model-value="emit('update:modelValue', String($event ?? ''))"
            @enter="emit('submit')"
          >
            <template #left>
              <UIcon
                name="i-lucide-search"
                class="h-5 w-5 text-gray-500 dark:text-gray-400"
              />
            </template>

            <template #right>
              <button
                type="submit"
                :disabled="submitting"
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm shadow-brand-700/20 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UIcon
                  v-if="submitting"
                  name="i-lucide-loader-2"
                  class="h-4 w-4 animate-spin"
                />
                <UIcon
                  v-else
                  name="i-lucide-arrow-up"
                  class="h-4 w-4"
                />
              </button>
            </template>
          </FoodscholarNLInput>

          <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <p>{{ helperText }}</p>
            <span class="uppercase tracking-[0.16em]">Enter to search</span>
          </div>
        </form>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  modelValue?: string
  placeholder?: string
  helperText?: string
  badge?: string | null
  submitting?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search dietary guides, topics, or rules',
  helperText: 'Search can surface both guide records and guideline rules.',
  badge: null,
  submitting: false
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'submit'): void
}>()

const inputClass = 'w-full h-14 rounded-2xl border border-gray-200/80 bg-gradient-to-r from-white via-earth-1/50 to-brandg-50/40 pl-11 pr-16 text-sm text-gray-900 shadow-sm shadow-slate-900/5 placeholder:text-gray-500 focus:border-brand-400/70 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-zinc-700/80 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 dark:text-zinc-100 dark:shadow-black/20 dark:placeholder:text-zinc-400 dark:focus:border-brand-500/70 dark:focus:ring-brand-500/20 sm:text-[15px]'
</script>

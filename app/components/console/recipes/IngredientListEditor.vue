<template>
  <div class="space-y-2.5">
    <div
      v-for="(ingredient, index) in ingredients"
      :key="`ingredient-row-${index}`"
      class="rounded-xl border border-gray-200/70 bg-white/95 px-2.5 py-2 shadow-sm dark:border-white/10 dark:bg-zinc-900/80"
    >
      <div class="flex items-center gap-2">
        <span class="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 px-2 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-200">
          {{ index + 1 }}
        </span>

        <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <UInput
            :model-value="ingredient.measurement"
            :disabled="disabled"
            placeholder="e.g. 2 tbsp"
            @update:model-value="value => updateIngredient(index, 'measurement', String(value || ''))"
          />
          <UInput
            :model-value="ingredient.name"
            :disabled="disabled"
            placeholder="e.g. olive oil"
            @update:model-value="value => updateIngredient(index, 'name', String(value || ''))"
          />
        </div>

        <div class="flex shrink-0 items-center gap-0.5">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-arrow-up"
            :disabled="disabled || index === 0"
            @click="moveIngredient(index, -1)"
          />
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-arrow-down"
            :disabled="disabled || index === ingredients.length - 1"
            @click="moveIngredient(index, 1)"
          />
          <UButton
            type="button"
            color="error"
            variant="ghost"
            size="xs"
            icon="i-lucide-trash-2"
            :disabled="disabled"
            @click="removeIngredient(index)"
          />
        </div>
      </div>
    </div>

    <div
      v-if="ingredients.length === 0"
      class="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-5 text-center dark:border-white/10 dark:bg-white/5"
    >
      <p class="text-sm text-gray-600 dark:text-gray-300">
        No ingredients yet. Add the first one to complete the recipe payload.
      </p>
    </div>

    <UButton
      type="button"
      color="neutral"
      variant="outline"
      icon="i-lucide-plus"
      :disabled="disabled"
      @click="addIngredient"
    >
      {{ addLabel }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type EditableIngredient = {
  name: string
  measurement: string
}

const props = withDefaults(defineProps<{
  modelValue: EditableIngredient[]
  disabled?: boolean
  addLabel?: string
}>(), {
  disabled: false,
  addLabel: 'Add ingredient'
})

const emit = defineEmits<{
  'update:modelValue': [value: EditableIngredient[]]
}>()

const ingredients = computed(() => Array.isArray(props.modelValue) ? props.modelValue : [])

function emitIngredients(nextIngredients: EditableIngredient[]) {
  emit('update:modelValue', nextIngredients)
}

function addIngredient() {
  emitIngredients([
    ...ingredients.value,
    {
      measurement: '',
      name: ''
    }
  ])
}

function updateIngredient(index: number, field: keyof EditableIngredient, value: string) {
  const nextIngredients = ingredients.value.map((ingredient, currentIndex) => {
    if (currentIndex !== index) {
      return ingredient
    }

    return {
      ...ingredient,
      [field]: value
    }
  })

  emitIngredients(nextIngredients)
}

function removeIngredient(index: number) {
  emitIngredients(ingredients.value.filter((_, currentIndex) => currentIndex !== index))
}

function moveIngredient(index: number, delta: number) {
  const targetIndex = index + delta
  if (targetIndex < 0 || targetIndex >= ingredients.value.length) {
    return
  }

  const nextIngredients = [...ingredients.value]
  const [movedIngredient] = nextIngredients.splice(index, 1)
  nextIngredients.splice(targetIndex, 0, movedIngredient)
  emitIngredients(nextIngredients)
}
</script>

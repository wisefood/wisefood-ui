<template>
  <div class="space-y-1">
    <div
      v-if="localSteps.length === 0"
      class="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-5 text-center dark:border-white/10 dark:bg-white/5"
    >
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Add the first instruction step to start shaping the recipe.
      </p>
    </div>

    <TransitionGroup
      name="instruction-step"
      tag="div"
      class="space-y-2.5"
    >
      <div
        v-for="(step, index) in localSteps"
        :key="step.id"
        data-step-row
        class="rounded-xl px-2 py-1.5 transition-[box-shadow,opacity,transform] duration-200"
        :class="step.id === activeDragId
          ? 'bg-brand-50/60 opacity-80 shadow-sm ring-1 ring-brand-200 dark:bg-brand-900/20 dark:ring-brand-700'
          : step.id === dragOverId
            ? 'bg-brand-50/40 ring-1 ring-brand-300 dark:bg-brand-900/10 dark:ring-brand-600'
            : 'bg-gray-50/60 dark:bg-white/4'"
        @dragenter.prevent="handleDragEnter(step.id)"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="inline-flex h-8 w-5 shrink-0 cursor-grab items-center justify-center text-gray-300 transition hover:text-brand-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-600 dark:hover:text-brand-400"
              :class="step.id === activeDragId ? 'cursor-grabbing text-brand-500 dark:text-brand-400' : ''"
              :disabled="disabled"
              draggable="true"
              aria-label="Drag to reorder instruction"
              @dragstart="handleDragStart(step.id, $event)"
              @dragend="handleDragEnd"
            >
              <UIcon
                name="i-lucide-grip-vertical"
                class="h-4 w-4"
              />
            </button>

            <span class="inline-flex h-6 min-w-6 items-center justify-center text-xs font-semibold tabular-nums text-gray-400 dark:text-gray-500">
              {{ index + 1 }}
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <textarea
              :ref="element => setTextareaRef(element, step.id)"
              :value="step.value"
              rows="1"
              :disabled="disabled"
              :placeholder="`Describe step ${index + 1}`"
              class="min-h-[2.5rem] w-full resize-none overflow-hidden border-0 border-b border-gray-200/70 bg-transparent px-2 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-brand-500"
              @input="handleStepInput(step.id, $event)"
            />
          </div>

          <div class="flex items-center">
            <UButton
              type="button"
              color="error"
              variant="ghost"
              size="xs"
              icon="i-lucide-trash-2"
              :disabled="disabled"
              @click="removeStep(step.id)"
            />
          </div>
        </div>
      </div>
    </TransitionGroup>

    <button
      type="button"
      class="group flex w-full items-center gap-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="disabled"
      @click="addStep"
    >
      <span class="h-px flex-1 bg-gray-200 transition group-hover:bg-brand-400 dark:bg-white/10 dark:group-hover:bg-brand-500" />
      <span class="flex items-center gap-1.5 text-xs font-medium text-gray-400 transition group-hover:text-brand-500 dark:text-gray-500 dark:group-hover:text-brand-400">
        <UIcon name="i-lucide-plus" class="h-3.5 w-3.5" />
        {{ addLabel }}
      </span>
      <span class="h-px flex-1 bg-gray-200 transition group-hover:bg-brand-400 dark:bg-white/10 dark:group-hover:bg-brand-500" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

type InstructionStep = {
  id: number
  value: string
}

const props = withDefaults(defineProps<{
  modelValue: string[]
  disabled?: boolean
  addLabel?: string
}>(), {
  disabled: false,
  addLabel: 'Add instruction'
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const activeDragId = ref<number | null>(null)
const dragOverId = ref<number | null>(null)
const localSteps = ref<InstructionStep[]>([])
const textareaRefs = ref<Record<number, HTMLTextAreaElement>>({})

let nextInstructionStepId = 0
let dragGhostEl: HTMLElement | null = null

function createInstructionStep(value = ''): InstructionStep {
  nextInstructionStepId += 1

  return {
    id: nextInstructionStepId,
    value
  }
}

function syncLocalSteps(nextValues: string[]) {
  const previousSteps = localSteps.value
  const usedIndexes = new Set<number>()

  localSteps.value = nextValues.map((value, index) => {
    const stepAtSameIndex = previousSteps[index]
    if (stepAtSameIndex && stepAtSameIndex.value === value && !usedIndexes.has(index)) {
      usedIndexes.add(index)
      return stepAtSameIndex
    }

    const matchedIndex = previousSteps.findIndex((step, stepIndex) => (
      !usedIndexes.has(stepIndex) && step.value === value
    ))

    if (matchedIndex !== -1) {
      usedIndexes.add(matchedIndex)
      return previousSteps[matchedIndex]
    }

    return createInstructionStep(value)
  })
}

function emitSteps() {
  emit('update:modelValue', localSteps.value.map(step => step.value))
}

function setTextareaRef(element: Element | null, stepId: number) {
  if (element instanceof HTMLTextAreaElement) {
    textareaRefs.value[stepId] = element
    return
  }

  delete textareaRefs.value[stepId]
}

function resizeTextarea(target: HTMLTextAreaElement) {
  target.style.height = '0px'
  target.style.height = `${Math.min(target.scrollHeight, 160)}px`
}

function resizeAllTextareas() {
  Object.values(textareaRefs.value).forEach((textarea) => {
    if (textarea) {
      resizeTextarea(textarea)
    }
  })
}

function updateStep(stepId: number, value: string) {
  localSteps.value = localSteps.value.map(step => (
    step.id === stepId
      ? { ...step, value }
      : step
  ))
  emitSteps()
}

function handleStepInput(stepId: number, event: Event) {
  const target = event.target as HTMLTextAreaElement | null
  const nextValue = target?.value || ''
  updateStep(stepId, nextValue)

  if (target) {
    resizeTextarea(target)
  }
}

async function addStep() {
  const nextStep = createInstructionStep('')
  localSteps.value = [...localSteps.value, nextStep]
  emitSteps()

  await nextTick()
  const textarea = textareaRefs.value[nextStep.id]
  if (textarea) {
    textarea.focus()
    resizeTextarea(textarea)
  }
}

function removeStep(stepId: number) {
  localSteps.value = localSteps.value.filter(step => step.id !== stepId)
  delete textareaRefs.value[stepId]

  if (activeDragId.value === stepId) {
    handleDragEnd()
  }

  emitSteps()
}

function reorderSteps(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return
  }

  const nextSteps = [...localSteps.value]
  const [movedStep] = nextSteps.splice(fromIndex, 1)

  if (!movedStep) {
    return
  }

  nextSteps.splice(toIndex, 0, movedStep)
  localSteps.value = nextSteps
  emitSteps()
}

function moveStep(stepId: number, delta: number) {
  const currentIndex = localSteps.value.findIndex(step => step.id === stepId)
  const targetIndex = currentIndex + delta

  if (targetIndex < 0 || targetIndex >= localSteps.value.length) {
    return
  }

  reorderSteps(currentIndex, targetIndex)
}

function handleDragStart(stepId: number, event: DragEvent) {
  if (props.disabled) {
    return
  }

  activeDragId.value = stepId
  dragOverId.value = stepId

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'

    const sourceRow = (event.target as HTMLElement)?.closest?.('[data-step-row]') as HTMLElement | null
    dragGhostEl = document.createElement('div')
    dragGhostEl.style.position = 'fixed'
    dragGhostEl.style.top = '-9999px'
    dragGhostEl.style.left = '-9999px'
    dragGhostEl.style.pointerEvents = 'none'

    if (sourceRow) {
      const clone = sourceRow.cloneNode(true) as HTMLElement
      const { width, height } = sourceRow.getBoundingClientRect()
      clone.style.width = `${width}px`
      clone.style.height = `${height}px`
      clone.style.opacity = '0.85'
      dragGhostEl.appendChild(clone)
    }

    document.body.appendChild(dragGhostEl)
    event.dataTransfer.setDragImage(dragGhostEl, event.offsetX, event.offsetY)
  }
}

function handleDragEnter(stepId: number) {
  if (props.disabled || activeDragId.value === null) {
    return
  }

  if (dragOverId.value === stepId) {
    return
  }

  dragOverId.value = stepId

  if (activeDragId.value === stepId) {
    return
  }

  const fromIndex = localSteps.value.findIndex(step => step.id === activeDragId.value)
  const toIndex = localSteps.value.findIndex(step => step.id === stepId)

  reorderSteps(fromIndex, toIndex)
}

function handleDrop() {
  handleDragEnd()
}

function handleDragEnd() {
  activeDragId.value = null
  dragOverId.value = null

  if (dragGhostEl) {
    dragGhostEl.remove()
    dragGhostEl = null
  }
}

watch(() => props.modelValue, (value) => {
  syncLocalSteps(Array.isArray(value) ? value : [])
}, { deep: true, immediate: true })

watch(localSteps, async () => {
  await nextTick()
  resizeAllTextareas()
}, { deep: true, immediate: true })
</script>

<style scoped>
.instruction-step-move,
.instruction-step-enter-active,
.instruction-step-leave-active {
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease,
    box-shadow 180ms ease;
}

.instruction-step-enter-from,
.instruction-step-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.99);
}
</style>

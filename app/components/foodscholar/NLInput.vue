<template>
    <div class="relative group">
        <div
            v-if="$slots.left"
            class="absolute left-4 flex items-center pointer-events-none z-10"
            :class="multiline ? 'bottom-3.5' : 'top-1/2 -translate-y-1/2'"
        >
            <slot name="left" />
        </div>

        <!-- Multiline: a textarea that grows with the question up to a few
             rows, so a long question is read back as it is typed rather than
             scrolled through a one-line window. The keyboard's Enter key
             sends only where a physical Shift exists to make a newline the
             other way; on a touch keyboard Enter is a newline and the send
             button is the way to ask, and enterkeyhint says as much. -->
        <textarea
            v-if="multiline"
            ref="fieldRef"
            v-model="internalValue"
            rows="1"
            :placeholder="placeholder"
            :disabled="disabled"
            :autofocus="autofocus"
            :name="name"
            :enterkeyhint="submitsOnEnter ? 'send' : 'enter'"
            :class="[inputClass, 'resize-none overflow-y-auto']"
            v-bind="$attrs"
            @keydown.enter="onEnterKey"
            @input="fitToContent"
        />
        <input
            v-else
            v-model="internalValue"
            @keyup.enter="onEnter"
            :type="type"
            :placeholder="placeholder"
            :disabled="disabled"
            :autofocus="autofocus"
            :name="name"
            :class="inputClass"
            v-bind="$attrs"
        />

        <div
            v-if="$slots.right"
            class="absolute right-4 flex items-center z-10"
            :class="multiline ? 'bottom-1' : 'top-1/2 -translate-y-1/2'"
        >
            <slot name="right" />
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useViewport } from '~/composables/useViewport'

const props = defineProps({
    modelValue: { type: [String, Number], default: '' },
    placeholder: { type: String, default: 'Ask about nutrition, ingredients, or food science...' },
    inputClass: {
        type: String,
        default:
            'w-full h-12 pl-11 pr-14 rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-gradient-to-r from-white to-emerald-50/60 dark:from-zinc-900 dark:to-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-500 dark:placeholder:text-zinc-400 shadow-sm shadow-slate-900/5 dark:shadow-black/25 focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-500/25 focus:border-brand-400/70 dark:focus:border-brand-500/70 transition-all duration-200'
    },
    disabled: { type: Boolean, default: false },
    type: { type: String, default: 'text' },
    name: { type: String, default: undefined },
    autofocus: { type: Boolean, default: false },
    /** Render a growing textarea instead of a one-line input. */
    multiline: { type: Boolean, default: false },
    /** How tall the textarea may grow, in lines, before it scrolls. */
    maxRows: { type: Number, default: 5 }
})

const emit = defineEmits(['update:modelValue', 'enter'])

const { isCoarsePointer } = useViewport()
const fieldRef = ref(null)

const internalValue = computed({
    get() {
        return props.modelValue
    },
    set(val) {
        emit('update:modelValue', val)
    }
})

const submitsOnEnter = computed(() => !isCoarsePointer.value)

function onEnter() {
    emit('enter', internalValue.value)
}

function onEnterKey(event) {
    if (!submitsOnEnter.value || event.shiftKey || event.isComposing) return
    event.preventDefault()
    emit('enter', internalValue.value)
}

/**
 * Size the textarea to its content, capped at `maxRows` lines.
 *
 * Collapsing to `auto` first lets it shrink again when lines are deleted;
 * the caller's `min-h-*` class keeps the one-line height from going below
 * the composer's chrome.
 */
function fitToContent() {
    const el = fieldRef.value
    if (!el) return
    const style = getComputedStyle(el)
    const lineHeight = parseFloat(style.lineHeight) || 24
    const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
    const maxHeight = lineHeight * props.maxRows + padding
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
}

watch(() => props.modelValue, () => {
    if (props.multiline) nextTick(fitToContent)
})

onMounted(() => {
    if (props.multiline) fitToContent()
})
</script>

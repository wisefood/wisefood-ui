<template>
    <div class="relative group">
        <div v-if="$slots.left" class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
            <slot name="left" />
        </div>

        <input
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

        <div v-if="$slots.right" class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center z-10">
            <slot name="right" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

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
    autofocus: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'enter'])

const internalValue = computed({
    get() {
        return props.modelValue
    },
    set(val) {
        emit('update:modelValue', val)
    }
})

function onEnter() {
    emit('enter', internalValue.value)
}
</script>

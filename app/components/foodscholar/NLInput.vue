<template>
    <div class="relative">
        <div v-if="$slots.left" class="absolute left-4 top-0 h-full flex items-center pointer-events-none">
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

        <div v-if="$slots.right" class="absolute right-4 top-0 h-full flex items-center">
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
            'w-full pl-10 pr-14 py-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500'
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


<template>
    <div class="border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 py-6">
            <!-- Back link row (kept on its own line) -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <NuxtLink
                        v-if="showBack"
                        :to="backTo"
                        class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                        <UIcon :name="backIcon" class="w-5 h-5" />
                        <span class="text-sm font-medium">{{ backLabel }}</span>
                    </NuxtLink>
                </div>
            </div>

            <!-- Brand (left) and Section (right) on the same horizontal line -->
            <div class="mt-4 flex items-center justify-between">
                <div>
                    <h1 class="text-3xl sm:text-4xl font-light text-gray-900 dark:text-white tracking-tight">
                        <span class="font-serif italic text-brand-500 text-4xl sm:text-5xl">{{ brandTitle }}</span>
                    </h1>
                    <p v-if="brandLead" class="mt-2 text-gray-600 dark:text-gray-300 font-light">
                        {{ brandLead }}
                    </p>
                </div>

                <div v-if="sectionTitle" class="flex flex-col items-end justify-center text-right ml-4">
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ sectionTitle }}</h2>
                    <p v-if="sectionSubtitle" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {{ sectionSubtitle }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
    // Back navigation
    showBack: { type: Boolean, default: true },
    backTo: { type: [String, Object], default: '/dashboard' },
    backLabel: { type: String, default: 'Back to Dashboard' },
    backIcon: { type: String, default: 'i-lucide-arrow-left' },

    // Top/brand title and lead
    brandTitle: { type: String, default: 'FoodScholar' },
    brandLead: {
        type: String,
    },

    // Section header and subheader
    sectionTitle: { type: String },
    sectionSubtitle: {
        type: String,
    }
})
</script>
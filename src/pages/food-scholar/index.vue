<template>
    <Chatbar />
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

interface FoodScholarSession {
  session_id: string
  session_title?: string
  metadata?: {
    title?: string
  }
}

interface FoodScholarSessionsResponse {
  success: boolean
  result?: {
    sessions?: FoodScholarSession[]
  }
}

definePage({
  name: "food-scholar",
  meta: {
    layout: 'default',
    titleKey: 'Food Scholar',
    descriptionKey: 'Learn about food science with AI',
    sidebar: [
      { label: 'Chat & Ask', to: '/food-scholar', icon: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-message-circle-question"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15.02 19.52c-2.341 .736 -5 .606 -7.32 -.52l-4.7 1l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c1.649 1.407 2.575 3.253 2.742 5.152" /><path d="M19 22v.01" /><path d="M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" /></svg>' },
      { label: 'Data Catalog', to: '/applications', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-file-database"> <path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 12.75m-4 0a4 1.75 0 1 0 8 0a4 1.75 0 1 0 -8 0"></path><path d="M8 12.5v3.75c0 .966 1.79 1.75 4 1.75s4 -.784 4 -1.75v-3.75"></path><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>~</svg>' }
    ],
    sidebarScrollable: [],
  }
});

const route = useRoute()
const authStore = useAuthStore()

const sessions = ref<FoodScholarSession[]>([])

const sidebarSessions = computed(() =>
  sessions.value.map((session) => ({
    label: session.metadata?.title ?? session.session_title ?? 'Untitled session',
    to: `/food-scholar?session=${session.session_id}`,
  }))
)

watch(sidebarSessions, (items) => {
  route.meta.sidebarScrollable = items
}, { immediate: true })

const fetchSessions = async () => {
  try {
    if (!authStore.isAuthenticated) {
      await authStore.initialize()
    }

    const token = authStore.getToken()
    if (!token) {
      return
    }

    const response = await fetch('https://wisefood.gr/rest/api/v1/foodscholar/sessions', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to load sessions (${response.status})`)
    }

    const payload = await response.json() as FoodScholarSessionsResponse
    sessions.value = payload.result?.sessions ?? []
  } catch (error) {
    console.error('Failed to load Food Scholar sessions', error)
  }
}

onMounted(() => {
  fetchSessions()
})
</script>

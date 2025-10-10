<template>
  <div class="d-flex">
    <!-- Main Chat Content -->
    <div class="flex-grow-1 p-4">
      <Chatbar @search="handleChatMessage" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useFoodScholarSessions } from '@/composables/useFoodscholarSessions'
import Sidebar from '@/components/Sidebar.vue'
import Chatbar from '@/components/Chatbar.vue'

// Composable for FoodScholar sessions
const { sidebarSessions, addSession } = useFoodScholarSessions()

// Static pinned items
const staticSidebarItems = [
  { label: 'New Chat', to: '/food-scholar', icon: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-message-circle-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12.007 19.98a9.869 9.869 0 0 1 -4.307 -.98l-4.7 1l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c1.992 1.7 2.93 4.04 2.747 6.34" /><path d="M16 19h6" /><path d="M19 16v6" /></svg>' },
  { label: 'Data Catalog', to: '/applications', icon: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-file-database"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12.75m-4 0a4 1.75 0 1 0 8 0a4 1.75 0 1 0 -8 0" /><path d="M8 12.5v3.75c0 .966 1.79 1.75 4 1.75s4 -.784 4 -1.75v-3.75" /><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /></svg>' },
]

/** Create a new session */
async function createSession(title?: string) {
  try {
    await addSession(title)
  } catch (err) {
    console.error('Failed to create session', err)
  }
}

/** Optional: handle chat messages from Chatbar */
async function handleChatMessage(message: string) {
  console.log('Chat message:', message)
}
</script>

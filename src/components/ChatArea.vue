<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-auto p-4">
      <ChatMessage v-for="(msg, i) in messages" :key="i" :message="msg" />
    </div>
    <div class="p-2 border-t">
      <input
        type="text"
        v-model="inputMessage"
        @keydown.enter="send"
        placeholder="Type your message..."
        class="w-full border rounded p-2"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { Message } from '@/services/foodscholarService'
import ChatMessage from './ChatMessage.vue'

const props = defineProps<{
  messages: Message[]
  sendMessage: (msg: string) => Promise<void>
}>()

const inputMessage = ref('')

async function send() {
  if (!inputMessage.value.trim()) return
  await props.sendMessage(inputMessage.value.trim())
  inputMessage.value = ''
}
</script>

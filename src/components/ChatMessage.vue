<template>
  <div :class="['chat-message', message.role === 'user' ? 'user' : 'assistant']">
    <div class="bubble">{{ message.content }}</div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'
import type { Message } from '@/composables/useFoodscholarSessions'

const props = defineProps<{ message: Message }>()
</script>

<style scoped>
.chat-message {
  display: flex;
  margin: 4px 0;
}
.chat-message.user {
  justify-content: flex-end;
}
.chat-message .bubble {
  max-width: 60%;
  padding: 8px 12px;
  border-radius: 16px;
  background-color: #eee;
}
.chat-message.user .bubble {
  background-color: #cce5ff;
}
</style>

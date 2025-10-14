<template>
  <div :class="['chat-message', message.role === 'user' ? 'user' : 'assistant']">
    <div class="bubble">
      <div class="chat-bubble-body">
        <p>{{ message.content }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

type ChatMessagePayload = {
  role: 'user' | 'ai' | 'assistant'
  content: string
}

const props = defineProps<{ message: ChatMessagePayload }>()
</script>

<style scoped>
.chat-message {
  display: flex;
  margin: 0.5rem 0;
}

.chat-message.assistant {
  justify-content: flex-start;
}

.chat-message.user {
  justify-content: flex-end;
}

.bubble {
  max-width: min(680px, 90%);
  border-radius: 18px;
  padding: 0.85rem 1.1rem;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  background: rgba(241, 245, 249, 0.9);
  color: rgba(15, 23, 42, 0.88);
}

.chat-message.user .bubble {
  background: linear-gradient(135deg, rgba(199, 140, 168, 0.92), rgba(248, 129, 157, 0.92));
  color: #fff;
  border-bottom-right-radius: 6px;
}

.chat-message.assistant .bubble {
  border-bottom-left-radius: 6px;
}

.chat-bubble-body {
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
}

.chat-bubble-body p {
  margin: 0;
}
</style>

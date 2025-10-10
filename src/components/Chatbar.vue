<template>
  <div class="container-xl" style="margin-top: 15vh;;">
    <div class="align-items-center text-center m">
        <!-- Typewriter Header -->
        <div id="typewriter" class="h1 mb-4">{{ displayText }}</div>

        <!-- Input + Button -->
        <div class="input-icon">
        <input
            v-model="input"
            @keydown.enter="emitSearch"
            type="text"
            class="form-control form-control-rounded p-5 h2"
            style="height: 3.0em;"
            placeholder="Type anything to search"
            autocomplete="off"
        />
        </div>

        <!-- Suggestion Buttons -->
        <div class="row row-cards text-center align-items-center justify-content-center mx-2 my-2 py-2">
        <div v-for="(suggestion, index) in suggestions" :key="index" class="col-12 col-md-6 col-lg-4">
            <button
            class="btn btn-outline-primary btn-pill w-100 mb-2"
            @click="setInput(suggestion)"
            >
            {{ suggestion }}
            </button>
        </div>
        </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits<{ (e: 'search', value: string): void }>()

const input = ref('')
const displayText = ref('')
const showStages = ref(false)

const suggestions = [
    '🍌 What are the nutritional facts of bananas?',
    '🍕 How many calories are in a slice of pizza?',
    '🥗 What are the health benefits of quinoa?',
    '🥚 How much protein is in a boiled egg?',
    '🌱 What vitamins are found in spinach?'
]

const typewriterTexts = [
'What food fact are you curious about?',
'Search for nutritional insights on your favorite foods',
'Explore health benefits of different ingredients',
'Find answers to your food-related questions'
]

function setInput(value: string) {
  input.value = value
  emitSearch()
}

function emitSearch() {
  if (!input.value.trim()) return
  emit('search', input.value.trim())
  showStages.value = true
}

function typeWriterEffect() {
  const text = typewriterTexts[Math.floor(Math.random() * typewriterTexts.length)]
  let i = 0
  const speed = 50
  const interval = setInterval(() => {
    displayText.value += text.charAt(i)
    i++
    if (i >= text.length) clearInterval(interval)
  }, speed)
}

onMounted(() => typeWriterEffect())
</script>

<style scoped>

@keyframes blink {
  from, to {
    border-color: transparent;
  }
  50% {
    border-color: #007bff;
  }
}
</style>

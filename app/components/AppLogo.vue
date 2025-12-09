<template>
  <NuxtLink to="/" class="inline-block">
    <img 
      src="/logo.png" 
      alt="WISEFOOD" 
      :class="`h-${height} w-auto mx-auto transition-transform hover:scale-105`" 
    />
  </NuxtLink>
</template>

<script setup>
defineProps({
  height: {
    type: String,
    default: '16'
  }
})
</script>

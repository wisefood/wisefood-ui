<template>
    <Chatbar />
</template>

<script lang="ts" setup>

// Fetch chats from API



definePage({
  name: "food-scholar",
  meta: {
    layout: 'default',
    titleKey: 'Food Scholar',
    descriptionKey: 'Learn about food science with AI',
    sidebar: [
      { label: 'Chat & Ask', to: '/food-scholar', icon: '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-pencil"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" /><path d="M13.5 6.5l4 4" /></svg>' },
      { label: 'Data Catalog', to: '/applications', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-file-database"> <path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 12.75m-4 0a4 1.75 0 1 0 8 0a4 1.75 0 1 0 -8 0"></path><path d="M8 12.5v3.75c0 .966 1.79 1.75 4 1.75s4 -.784 4 -1.75v-3.75"></path><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>~</svg>' }
    ],
    sidebarScrollable: [
      { label: 'Lesson 1: Fermentation', to: '/chat/1' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },
      { label: 'Lesson 2: Umami', to: '/chat/2' },

      // ...
    ],
  }
});
</script>


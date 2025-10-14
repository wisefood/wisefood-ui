<template>
  <body>
  <div class="page">
    <transition name="slide" appear>
      <Sidebar 
        :fullname="fullname" 
        :roles="roles" 
        :fixed-items="fixedSidebarItems"
        :scroll-items="scrollSidebarItems"
      />
    </transition>
    <div class="layout-fluid">
      <Navbar 
        :fullname="fullname" 
        :roles="roles"
      />
    </div>
    <div class="page-wrapper">
      <div class="page-body">
        <div class="container-xl">
          <router-view />
        </div>
      </div>
      <transition name="fade" appear>
        <AppFooter />
      </transition>
    </div>
  </div>
  </body>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAuthStore } from "@/stores/authStore";
import { useAppStore, type SidebarItem } from '@/stores/app'

const authStore = useAuthStore();
const appStore = useAppStore()

const fullname = authStore.user?.given_name + ' ' + authStore.user?.family_name || 'Guest User';
const roles = authStore.user?.roles || [];

const fallbackFixedItems: SidebarItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Food Scholar', to: '/food-scholar' },
  { label: 'Recipe Wrangler', to: '/recipe-wrangler' },
  { label: 'Food Chat', to: '/food-chat' },
]

const fixedSidebarItems = computed(() =>
  appStore.sidebarFixedItems.length ? appStore.sidebarFixedItems : fallbackFixedItems
)

const scrollSidebarItems = computed(() => appStore.sidebarScrollItems)
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 1.0s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Slide transition for Sidebar */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.8s ease, opacity 0.8s ease;
}

/* Starting and ending states for enter/leave */
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>

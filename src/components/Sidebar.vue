<template>
  <aside class="navbar navbar-vertical navbar-expand-lg bg-yellow h3" style="margin-top: 56px;" data-bs-theme="light">
    <div class="container-fluid">
      <!-- Navbar toggler & brand for small screens -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar-menu" aria-controls="sidebar-menu" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <h1 class="navbar-brand navbar-brand-autodark d-lg-none">
        <router-link to="/dashboard" class="p-2">
          <img src="/images/logo.png" alt="WiseFood" width="180px" />
        </router-link>
      </h1>

      <!-- User & action buttons -->
      <div class="navbar-nav flex-row d-lg-none">
        <div class="nav-item d-none d-lg-flex me-3">
          <div class="btn-list">
            <a href="https://github.com/tabler/tabler" class="btn" target="_blank" rel="noreferrer">
              <!-- icon omitted for brevity -->
              Source code
            </a>
            <a href="https://github.com/sponsors/codecalm" class="btn" target="_blank" rel="noreferrer">
              <!-- icon omitted for brevity -->
              Sponsor
            </a>
          </div>
        </div>
        <!-- Theme toggles / notifications / user avatar -->
        <div class="d-none d-lg-flex">
          <!-- omitted for brevity -->
        </div>
      </div>

      <!-- Sidebar menu -->
      <div class="collapse navbar-collapse pt-3" id="sidebar-menu">
        <!-- Fixed items -->
        <ul class="navbar-nav pt-lg-0 " style="max-height: 100px;">
          <li v-for="item in fixedItems" :key="item.to" class="nav-item p-0 rounded" :class="{ active: $route.path === item.to }">
            <RouterLink class="nav-link" :to="item.to">
              <span class="nav-link-icon d-md-none d-lg-inline-block">
                <span v-if="item.icon && item.icon.startsWith('<svg')" v-html="item.icon"></span>
                <span v-else-if="item.icon" class="iconify" :data-icon="item.icon" data-inline="false"></span>
              </span>
              <span class="nav-link-title">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>

        <!-- Scrollable sessions -->
        <p class="page-pretitle p-0 ms-3 mt-2 mb-1">Previous Chats</p>
        <ul class="navbar-nav pt-lg-0 overflow-auto" style="max-height: calc(100vh - 200px);">
          <li v-for="item in scrollItems" :key="item.to" class="m-0 p-0 text-blue" style="font-size: 0.875rem;" :class="{ active: $route.path === item.to }">
            <RouterLink class="nav-link" :to="item.to">
              <span class="nav-link-title">{{ item.label }}</span>
            </RouterLink>
          </li>        
        </ul>
      </div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

type SidebarItem = { label: string; to: string; icon?: string }

const props = defineProps({
  fullname: { type: String, default: 'Guest User' },
  roles: { type: Array as () => string[], default: () => [] },
  fixedItems: { type: Array as () => SidebarItem[], default: () => [] },   // <--- static items
  scrollItems: { type: Array as () => SidebarItem[], default: () => [] },  // <--- sessions
})

</script>

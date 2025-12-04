<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)
const defaultSidebar: NavigationMenuItem[][] = []

const toSidebarGroups = (items?: LayoutSidebarItems): NavigationMenuItem[][] => {
  if (!items || items.length === 0) {
    return []
  }

  const groups = Array.isArray(items[0])
    ? items as NavigationMenuItem[][]
    : [items as NavigationMenuItem[]]

  return groups.map(group => group.slice())
}

const isInternalLink = (to: NavigationMenuItem['to']) => typeof to === 'string' && to.startsWith('/')

const markActiveItem = (item: NavigationMenuItem, currentPath: string): NavigationMenuItem => {
  const next: NavigationMenuItem = {
    ...item
  }

  if (Array.isArray(item.children) && item.children.length) {
    next.children = item.children.map(child => markActiveItem(child, currentPath))
    if (next.children.some(child => child.active)) {
      next.active = true
    }
  }

  if (typeof item.active === 'boolean') {
    next.active = item.active
  } else if (isInternalLink(item.to)) {
    const target = (item.to as string).replace(/\/+$/, '')
    const path = currentPath.replace(/\/+$/, '')
    next.active = path === target || path.startsWith(`${target}/`)
  }

  return next
}

const markActiveGroups = (groups: NavigationMenuItem[][], currentPath: string) =>
  groups.map(group => group.map(item => markActiveItem(item, currentPath)))

const sidebarNavigation = computed(() => {
  const metaGroups = toSidebarGroups(route.meta.sidebarNavigation)
  const groups = metaGroups.length ? metaGroups : defaultSidebar
  return markActiveGroups(groups, route.path)
})

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="lg:bg-transparent"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <div v-if="sidebarNavigation.length" class="flex flex-col gap-3">
          <UNavigationMenu
            v-for="(group, index) in sidebarNavigation"
            :key="index"
            :collapsed="collapsed"
            :items="group"
            orientation="vertical"
            tooltip
            popover
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />

  </UDashboardGroup>
</template>

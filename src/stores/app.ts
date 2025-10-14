import { defineStore } from 'pinia'

export type SidebarItem = {
  label: string
  to: string
  icon?: string
}

type SidebarState = {
  sidebarFixedItems: SidebarItem[]
  sidebarScrollItems: SidebarItem[]
}

export const useAppStore = defineStore('app', {
  state: (): SidebarState => ({
    sidebarFixedItems: [],
    sidebarScrollItems: [],
  }),

  actions: {
    setSidebarFixedItems(items: SidebarItem[]) {
      this.sidebarFixedItems = [...items]
    },
    setSidebarScrollItems(items: SidebarItem[]) {
      this.sidebarScrollItems = [...items]
    },
    resetSidebarScrollItems() {
      this.sidebarScrollItems = []
    },
    resetSidebarFixedItems() {
      this.sidebarFixedItems = []
    },
    resetSidebar() {
      this.resetSidebarFixedItems()
      this.resetSidebarScrollItems()
    },
  },
})

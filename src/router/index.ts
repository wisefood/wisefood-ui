/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { i18n } from '@/i18n'
import { routes } from 'vue-router/auto-routes'
import { useAuthStore } from "@/stores/authStore";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['login', 'signup'];

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Wait for auth to be initialized (only happens once)
  if (!authStore.initialized) {
    await authStore.initialize();
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(to.name as string);

  // If user is authenticated and trying to access login/signup, redirect to dashboard
  if (authStore.isAuthenticated && isPublicRoute) {
    return { name: 'dashboard' };
  }

  // If user is NOT authenticated and trying to access protected route, redirect to login
  if (!authStore.isAuthenticated && !isPublicRoute) {
    return { name: 'login' };
  }

  // Allow navigation
  return true;
});

function applyPageMeta(to: any) {
  const t = i18n.global.t as (key: string) => string

  const titleKey = to.meta.titleKey as string | undefined
  const descKey  = to.meta.descriptionKey as string | undefined

  const appName = 'WiseFood'
  document.title = titleKey ? `${appName} | ${t(titleKey)}` : appName

  if (descKey) {
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', t(descKey))
  }
}

router.afterEach((to) => {
  applyPageMeta(to)
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
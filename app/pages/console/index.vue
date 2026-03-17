<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(213,51,85,0.14),_transparent_32%),linear-gradient(180deg,_rgba(246,239,230,0.96)_0%,_rgba(255,255,255,1)_34%,_rgba(202,213,178,0.32)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(213,51,85,0.18),_transparent_28%),linear-gradient(180deg,_rgba(24,24,27,1)_0%,_rgba(9,9,11,1)_100%)]">
    <main class="container mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <section class="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 sm:p-8">
        <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(166,181,43,0.24),_transparent_58%)] lg:block" />

        <div class="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <UBadge
                color="primary"
                variant="soft"
              >
                Privileged workspace
              </UBadge>
              <UBadge
                color="neutral"
                variant="outline"
              >
                {{ privilegeLabel }}
              </UBadge>
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ generatedAt }}</span>
            </div>

            <p class="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-brand-500">
              Console
            </p>
            <h1 class="max-w-2xl text-4xl font-light tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Expert oversight with the same WiseFood session, now under a protected `/console/*` namespace.
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300 sm:text-lg">
              Signed in as <span class="font-semibold text-gray-900 dark:text-white">{{ userDisplayName }}</span>.
              This dashboard is an indicative launch surface for expert and admin workflows, and it is already wired to the existing Keycloak-backed auth store.
            </p>

            <div class="mt-6 flex flex-wrap gap-3">
              <UButton
                to="/foodscholar"
                color="primary"
                icon="i-lucide-graduation-cap"
              >
                Review FoodScholar content
              </UButton>
              <UButton
                to="/profiles"
                color="neutral"
                variant="outline"
                icon="i-lucide-users"
              >
                Change user context
              </UButton>
            </div>
          </div>

          <UCard
            class="w-full max-w-md border-none bg-gray-950 text-white shadow-none dark:bg-white/5"
            :ui="{ body: 'p-5 sm:p-6' }"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm uppercase tracking-[0.2em] text-white/55">
                  Session brief
                </p>
                <p class="mt-2 text-2xl font-semibold">
                  {{ primaryRoleLabel }}
                </p>
              </div>
              <div class="rounded-2xl bg-white/10 p-3">
                <UIcon
                  name="i-lucide-shield-check"
                  class="h-6 w-6 text-brandg-300"
                />
              </div>
            </div>

            <div class="mt-6 space-y-4 text-sm text-white/80">
              <div class="flex items-center justify-between gap-4">
                <span>SSO session</span>
                <span class="font-medium text-white">Active</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span>Allowed roles</span>
                <span class="font-medium text-white">Expert or Admin</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span>Current profile context</span>
                <span class="max-w-[14rem] truncate text-right font-medium text-white">{{ currentContextLabel }}</span>
              </div>
            </div>
          </UCard>
        </div>
      </section>

      <UAlert
        class="mt-6"
        color="primary"
        variant="soft"
        icon="i-lucide-lock-keyhole"
        title="Central console protection is active"
        description="Any route under /console/* now reuses the existing auth store and is restricted to users whose realm roles include expert or admin."
      />

      <section class="mt-8 grid gap-4 md:grid-cols-3">
        <UCard
          v-for="stat in stats"
          :key="stat.label"
          class="border-white/70 bg-white/85 shadow-lg shadow-gray-200/50 dark:border-white/10 dark:bg-zinc-900/75 dark:shadow-none"
          :ui="{ body: 'p-5' }"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ stat.label }}
              </p>
              <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stat.value }}
              </p>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {{ stat.description }}
              </p>
            </div>
            <div
              class="rounded-2xl p-3"
              :class="stat.iconWrapperClass"
            >
              <UIcon
                :name="stat.icon"
                class="h-5 w-5"
                :class="stat.iconClass"
              />
            </div>
          </div>
        </UCard>
      </section>

      <section class="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <UCard
          class="border-white/70 bg-white/88 shadow-[0_18px_60px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-zinc-900/78 dark:shadow-none"
          :ui="{ body: 'p-6' }"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Launch surface
              </p>
              <h2 class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                Indicative expert workbench
              </h2>
            </div>
            <UBadge
              color="neutral"
              variant="outline"
            >
              Ready for expansion
            </UBadge>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <article
              v-for="module in modules"
              :key="module.title"
              class="rounded-3xl border border-gray-200/80 bg-gray-50/80 p-5 transition-transform duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div class="flex items-start justify-between gap-4">
                <div
                  class="rounded-2xl p-3"
                  :class="module.iconWrapperClass"
                >
                  <UIcon
                    :name="module.icon"
                    class="h-5 w-5"
                    :class="module.iconClass"
                  />
                </div>
                <UBadge
                  :color="module.badgeColor"
                  variant="soft"
                >
                  {{ module.badge }}
                </UBadge>
              </div>

              <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                {{ module.title }}
              </h3>
              <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {{ module.description }}
              </p>

              <div class="mt-5">
                <UButton
                  v-if="module.to"
                  :to="module.to"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  icon="i-lucide-arrow-up-right"
                >
                  {{ module.cta }}
                </UButton>
                <UButton
                  v-else
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  disabled
                  icon="i-lucide-clock-3"
                >
                  {{ module.cta }}
                </UButton>
              </div>
            </article>
          </div>
        </UCard>

        <div class="space-y-6">
          <UCard
            class="border-white/70 bg-white/88 dark:border-white/10 dark:bg-zinc-900/78"
            :ui="{ body: 'p-6' }"
          >
            <p class="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Access
            </p>
            <h2 class="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              Session and role summary
            </h2>

            <div class="mt-5 flex flex-wrap gap-2">
              <UBadge
                v-for="role in displayRoles"
                :key="role"
                color="primary"
                variant="outline"
              >
                {{ role }}
              </UBadge>
            </div>

            <dl class="mt-6 space-y-4 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-gray-500 dark:text-gray-400">
                  Account
                </dt>
                <dd class="max-w-[16rem] truncate text-right font-medium text-gray-900 dark:text-white">
                  {{ accountIdentifier }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-gray-500 dark:text-gray-400">
                  Display name
                </dt>
                <dd class="max-w-[16rem] truncate text-right font-medium text-gray-900 dark:text-white">
                  {{ userDisplayName }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-gray-500 dark:text-gray-400">
                  Protected area
                </dt>
                <dd class="font-medium text-gray-900 dark:text-white">
                  /console/*
                </dd>
              </div>
            </dl>
          </UCard>

          <UCard
            class="border-white/70 bg-white/88 dark:border-white/10 dark:bg-zinc-900/78"
            :ui="{ body: 'p-6' }"
          >
            <p class="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Next steps
            </p>
            <h2 class="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              Good foundations for future console features
            </h2>

            <ul class="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li
                v-for="step in nextSteps"
                :key="step"
                class="flex items-start gap-3"
              >
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="mt-0.5 h-4 w-4 shrink-0 text-brandg-500"
                />
                <span>{{ step }}</span>
              </li>
            </ul>
          </UCard>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { includesRole } from '~/utils/authRoles'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Console'
})

useSeoMeta({
  description: 'Protected console for WiseFood experts and admins'
})

const authStore = useAuthStore()
const householdStore = useHouseholdStore()

const generatedAt = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date())

const userDisplayName = computed(() => {
  const user = authStore.currentUser
  return user?.name || user?.username || user?.email || 'WiseFood Expert'
})

const accountIdentifier = computed(() => {
  const user = authStore.currentUser
  return user?.email || user?.username || user?.id || 'Authenticated session'
})

const displayRoles = computed(() => {
  const roles = authStore.currentUser?.roles ?? []
  return roles.length ? roles : ['authenticated']
})

const primaryRoleLabel = computed(() => {
  const roles = authStore.currentUser?.roles ?? []

  if (includesRole(roles, 'admin') && includesRole(roles, 'expert')) {
    return 'Admin + Expert'
  }

  if (includesRole(roles, 'admin')) {
    return 'Admin'
  }

  return 'Expert'
})

const privilegeLabel = computed(() => `${primaryRoleLabel.value} access`)

const currentContextLabel = computed(() => {
  const member = householdStore.currentMember
  return member?.name || 'Independent console session'
})

const stats = computed(() => [
  {
    label: 'Authorization',
    value: primaryRoleLabel.value,
    description: 'Resolved from the same Keycloak realm roles already used in the app.',
    icon: 'i-lucide-badge-check',
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-900/30',
    iconClass: 'text-brand-500'
  },
  {
    label: 'Namespace',
    value: '/console/*',
    description: 'Reserved for future operational and expert-only tooling.',
    icon: 'i-lucide-panels-top-left',
    iconWrapperClass: 'bg-brandg-50 dark:bg-brandg-900/20',
    iconClass: 'text-brandg-600 dark:text-brandg-400'
  },
  {
    label: 'Current context',
    value: currentContextLabel.value,
    description: 'Shares the same user session and surrounding app state.',
    icon: 'i-lucide-user-round-cog',
    iconWrapperClass: 'bg-gray-100 dark:bg-white/10',
    iconClass: 'text-gray-700 dark:text-gray-200'
  }
])

const modules = [
  {
    title: 'Knowledge review queue',
    description: 'A natural home for validating scientific content, flagged answers, and expert annotations before publication.',
    badge: 'Available now',
    badgeColor: 'primary' as const,
    cta: 'Open FoodScholar',
    to: '/foodscholar',
    icon: 'i-lucide-graduation-cap',
    iconWrapperClass: 'bg-brand-50 dark:bg-brand-900/30',
    iconClass: 'text-brand-500'
  },
  {
    title: 'Recipe quality checks',
    description: 'Reserve this area for reviewing generated recipes, nutrition edge cases, and side-by-side QA comparisons.',
    badge: 'Available now',
    badgeColor: 'neutral' as const,
    cta: 'Open RecipeWrangler',
    to: '/recipe-wrangler',
    icon: 'i-lucide-chef-hat',
    iconWrapperClass: 'bg-brandg-50 dark:bg-brandg-900/20',
    iconClass: 'text-brandg-600 dark:text-brandg-400'
  },
  {
    title: 'Escalations inbox',
    description: 'A future destination for sensitive user cases, moderation follow-up, and expert intervention workflows.',
    badge: 'Coming soon',
    badgeColor: 'warning' as const,
    cta: 'Planned module',
    to: '',
    icon: 'i-lucide-inbox',
    iconWrapperClass: 'bg-amber-50 dark:bg-amber-500/10',
    iconClass: 'text-amber-600 dark:text-amber-300'
  },
  {
    title: 'Operational analytics',
    description: 'Use this section later for expert throughput, content health, and release-readiness signals across the platform.',
    badge: 'Coming soon',
    badgeColor: 'warning' as const,
    cta: 'Planned module',
    to: '',
    icon: 'i-lucide-chart-column',
    iconWrapperClass: 'bg-sky-50 dark:bg-sky-500/10',
    iconClass: 'text-sky-600 dark:text-sky-300'
  }
]

const nextSteps = [
  'Add more pages under /console/* and they will automatically inherit the same centralized route protection.',
  'Use the existing auth store getters in components so role-based UI stays consistent across the app.',
  'Plug in expert-only datasets, queues, or moderation workflows without introducing a second authentication path.'
]
</script>

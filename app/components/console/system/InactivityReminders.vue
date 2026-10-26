<template>
  <UCard
    :ui="{ body: 'p-5' }"
    class="border border-gray-200/70 dark:border-white/10"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Inactivity reminders
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          A friendly email to people who have stopped using WiseFood. Changes reach every replica within about thirty seconds; no redeploy.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-refresh-cw"
        aria-label="Reload"
        :loading="loading"
        @click="load"
      />
    </div>

    <UAlert
      v-if="loadError"
      class="mt-4"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      :description="loadError"
    />

    <template v-if="status">
      <!-- What stops it working, said before anything else. -->
      <div class="mt-4 space-y-2">
        <UAlert
          v-if="!status.schema_ready"
          color="error"
          variant="soft"
          icon="i-lucide-database"
          title="The notifications schema is not applied"
          description="Apply schemas/70_notifications.sql to this database (it is safe to run twice). Until then nothing is recorded or sent."
        />
        <UAlert
          v-if="!status.mail_enabled"
          color="warning"
          variant="soft"
          icon="i-lucide-mail-x"
          title="Email is not configured on the API"
          description="SMTP_HOST is unset, so no reminder can leave. Configure the gateway's mail settings first."
        />
        <UAlert
          v-if="!status.scheduler_enabled"
          color="neutral"
          variant="soft"
          icon="i-lucide-clock"
          title="The daily schedule is switched off for this deployment"
          description="NOTIFICATIONS_ENABLED is false on the API. Cycles still run when you press Run now."
        />
      </div>

      <!-- Mode -->
      <div class="mt-5">
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          Mode
        </p>
        <div
          class="mt-2 grid gap-2 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Reminder mode"
        >
          <button
            v-for="option in modes"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="draft.mode === option.value"
            class="rounded-xl border p-3 text-left transition-colors"
            :class="draft.mode === option.value
              ? option.activeClass
              : 'border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20'"
            @click="draft.mode = option.value"
          >
            <span class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <UIcon
                :name="option.icon"
                class="h-4 w-4"
              />
              {{ option.label }}
            </span>
            <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              {{ option.description }}
            </span>
          </button>
        </div>
      </div>

      <!-- Timing -->
      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <UFormField
          label="First reminder after"
          hint="days"
        >
          <UInputNumber
            v-model="draft.inactive_after_days"
            :min="limit('inactive_after_days')[0]"
            :max="limit('inactive_after_days')[1]"
            :step="1"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Then every"
          hint="days"
        >
          <UInputNumber
            v-model="draft.repeat_every_days"
            :min="limit('repeat_every_days')[0]"
            :max="limit('repeat_every_days')[1]"
            :step="1"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="At most"
          hint="per absence"
        >
          <UInputNumber
            v-model="draft.max_reminders"
            :min="limit('max_reminders')[0]"
            :max="limit('max_reminders')[1]"
            :step="1"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Send at"
          :hint="`${localHour} your time`"
        >
          <USelect
            v-model="draft.send_hour_utc"
            :items="hours"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Per cycle, at most"
          hint="emails"
        >
          <UInputNumber
            v-model="draft.max_per_run"
            :min="limit('max_per_run')[0]"
            :max="limit('max_per_run')[1]"
            :step="10"
            class="w-full"
          />
        </UFormField>
      </div>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {{ cadenceSentence }} Coming back resets the count. The per-cycle cap spreads a large first backlog over several days.
      </p>

      <!-- Who -->
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div class="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Only verified addresses
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              An unverified address may not belong to the account holder; a kept guest account is left unverified on purpose.
            </p>
          </div>
          <USwitch
            v-model="draft.verified_only"
            aria-label="Only verified addresses"
          />
        </div>
        <div class="flex items-start justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              Include admins and experts
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Off by default: staff run the platform and are not who this is for. Guests and agents are never included.
            </p>
          </div>
          <USwitch
            v-model="draft.include_staff"
            aria-label="Include admins and experts"
          />
        </div>
      </div>

      <!-- Experimental recipients -->
      <UFormField
        class="mt-5"
        label="Experimental mode sends to"
        :help="recipientsHelp"
        :error="recipientsError || undefined"
      >
        <UInput
          v-model="recipientsText"
          placeholder="admin@wisefood.gr, colleague@example.org"
          class="w-full"
        />
      </UFormField>

      <div class="mt-5 flex flex-wrap items-center justify-end gap-2">
        <span
          v-if="changedLine"
          class="mr-auto text-xs text-gray-500 dark:text-gray-400"
        >
          {{ changedLine }}
        </span>
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="!dirty || saving"
          @click="discard"
        >
          Discard
        </UButton>
        <UButton
          icon="i-lucide-save"
          :disabled="!dirty || !!recipientsError || !status.schema_ready"
          :loading="saving"
          @click="requestSave"
        >
          Save
        </UButton>
      </div>

      <USeparator class="my-5" />

      <!-- Where things stand -->
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="tile in tiles"
          :key="tile.label"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ tile.label }}
          </p>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ tile.value }}
          </p>
          <p
            v-if="tile.hint"
            class="text-xs text-gray-400 dark:text-gray-500"
          >
            {{ tile.hint }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-5 flex flex-wrap items-end gap-2">
        <UFormField
          label="Sample language"
          class="w-36"
        >
          <USelect
            v-model="sampleLocale"
            :items="languages"
          />
        </UFormField>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-send"
          :loading="busy === 'test'"
          :disabled="!status.mail_enabled || !status.schema_ready || busy !== null"
          @click="sendTest"
        >
          Send me a sample
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-users"
          :loading="busy === 'preview'"
          :disabled="!status.schema_ready || busy !== null"
          @click="loadPreview"
        >
          Who is due now?
        </UButton>
        <UButton
          :color="status.config.mode === 'live' ? 'warning' : 'primary'"
          icon="i-lucide-play"
          :loading="busy === 'run'"
          :disabled="status.config.mode === 'off' || !status.mail_enabled || !status.schema_ready || busy !== null"
          @click="requestRun"
        >
          Run now
        </UButton>
      </div>
      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Run now uses the saved mode{{ dirty ? ' — save your changes first to run with them' : '' }}. Nobody is reminded twice for the same absence, whichever cycle reaches them first.
      </p>

      <!-- Preview -->
      <div
        v-if="preview"
        class="mt-5"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ preview.due }} {{ preview.due === 1 ? 'person is' : 'people are' }} due a {{ preview.mode }} reminder
            <span class="font-normal text-gray-500 dark:text-gray-400">
              of {{ preview.eligible }} eligible, {{ preview.considered }} accounts
            </span>
          </p>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            aria-label="Close the preview"
            @click="preview = null"
          />
        </div>
        <div
          v-if="skippedBadges.length"
          class="mt-2 flex flex-wrap gap-1.5"
        >
          <UBadge
            v-for="badge in skippedBadges"
            :key="badge.key"
            color="neutral"
            variant="soft"
            size="sm"
          >
            {{ badge.label }}: {{ badge.count }}
          </UBadge>
        </div>
        <UTable
          class="mt-3"
          :data="preview.rows"
          :columns="previewColumns"
        >
          <template #empty>
            <p class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Nobody is due a reminder right now.
            </p>
          </template>
        </UTable>
        <p
          v-if="preview.due > preview.max_per_run"
          class="mt-2 text-xs text-gray-500 dark:text-gray-400"
        >
          The next cycle reaches the {{ preview.max_per_run }} who have been away longest; the rest follow on later days.
        </p>
      </div>

      <!-- History -->
      <div class="mt-6 grid gap-6 xl:grid-cols-2">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            Recent cycles
          </p>
          <UTable
            class="mt-2"
            :data="status.runs"
            :columns="runColumns"
          >
            <template #empty>
              <p class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No cycle has run yet.
              </p>
            </template>
          </UTable>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            Recent emails
          </p>
          <UTable
            class="mt-2"
            :data="log"
            :columns="logColumns"
          >
            <template #empty>
              <p class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No reminder has been sent yet.
              </p>
            </template>
          </UTable>
        </div>
      </div>
    </template>

    <UModal
      v-model:open="confirmingLive"
      title="Send reminders to participants?"
      :description="`From the next cycle, people away for ${draft.inactive_after_days} days or more get a reminder at their own address — up to ${draft.max_per_run} a day at ${hourLabel(draft.send_hour_utc)} UTC. Try experimental mode first if you have not seen the emails yet.`"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="confirmingLive = false"
          >
            Not yet
          </UButton>
          <UButton
            color="warning"
            icon="i-lucide-send"
            :loading="saving"
            @click="save"
          >
            Go live
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="confirmingRun"
      title="Send live reminders now?"
      description="This runs a cycle immediately and writes to every participant who is due, up to the per-cycle cap. Anyone already reminded for their current absence is skipped."
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="confirmingRun = false"
          >
            Cancel
          </UButton>
          <UButton
            color="warning"
            icon="i-lucide-play"
            :loading="busy === 'run'"
            @click="runNow"
          >
            Send now
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>

<script setup lang="ts">
/**
 * Inactivity reminders, on Platform Operations. Admin-only, like everything on
 * that page; the gateway enforces it on every endpoint.
 *
 * Built around the one mistake that cannot be undone — writing to
 * participants before anyone has seen the email. Experimental mode delivers
 * the very same mails to the admins instead, "Send me a sample" works in any
 * mode, "Who is due now?" answers without sending, and switching to live asks
 * first.
 */
import { computed, h, onMounted, reactive, ref, resolveComponent } from 'vue'
import notificationsApi, {
  reminderFailure,
  type ReminderConfig,
  type ReminderLogRow,
  type ReminderMode,
  type ReminderPreview,
  type ReminderPreviewRow,
  type ReminderRun,
  type ReminderStatus
} from '~/services/notificationsApi'

const UBadge = resolveComponent('UBadge')
const toast = useToast()

const status = ref<ReminderStatus | null>(null)
const log = ref<ReminderLogRow[]>([])
const preview = ref<ReminderPreview | null>(null)
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const busy = ref<'test' | 'preview' | 'run' | null>(null)
const confirmingLive = ref(false)
const confirmingRun = ref(false)
const sampleLocale = ref('en')

const blank = (): ReminderConfig => ({
  mode: 'off',
  inactive_after_days: 14,
  repeat_every_days: 14,
  max_reminders: 2,
  send_hour_utc: 9,
  max_per_run: 50,
  test_recipients: [],
  verified_only: true,
  include_staff: false
})
const draft = reactive<ReminderConfig>(blank())
const recipientsText = ref('')

const modes: Array<{ value: ReminderMode, label: string, icon: string, description: string, activeClass: string }> = [
  {
    value: 'off',
    label: 'Off',
    icon: 'i-lucide-pause',
    description: 'Nothing is sent. Activity is still recorded, so switching on later starts from real data.',
    activeClass: 'border-gray-400 bg-gray-50 dark:border-white/30 dark:bg-white/5'
  },
  {
    value: 'experimental',
    label: 'Experimental',
    icon: 'i-lucide-flask-conical',
    description: 'The real cycle, but every email goes to the admins below, marked with who it was for.',
    activeClass: 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10'
  },
  {
    value: 'live',
    label: 'Live',
    icon: 'i-lucide-send',
    description: 'Participants receive their reminders. Each email carries a one-click way to stop them.',
    activeClass: 'border-brand-500 bg-brand-50 dark:border-brand-500/70 dark:bg-brand-500/10'
  }
]

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Magyar', value: 'hu' },
  { label: 'Slovenščina', value: 'sl' },
  { label: 'Ελληνικά', value: 'el' }
]

const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`
const hours = Array.from({ length: 24 }, (_, hour) => ({ label: `${hourLabel(hour)} UTC`, value: hour }))

/** The UTC send hour on the admin's own clock, which is how they think of it. */
const localHour = computed(() => {
  const at = new Date()
  at.setUTCHours(draft.send_hour_utc, 0, 0, 0)
  return at.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
})

const limit = (key: string): [number, number] => status.value?.limits?.[key] ?? [1, 1000]

const cadenceSentence = computed(() => {
  const first = `${draft.inactive_after_days} day${draft.inactive_after_days === 1 ? '' : 's'}`
  if (draft.max_reminders === 1) return `One reminder after ${first} away.`
  return `A first reminder after ${first} away, then one every ${draft.repeat_every_days} day${draft.repeat_every_days === 1 ? '' : 's'}, ${draft.max_reminders} at most.`
})

const ADDRESS = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/
const parsedRecipients = computed(() => recipientsText.value
  .split(/[,;\s]+/)
  .map(part => part.trim().toLowerCase())
  .filter(Boolean))
const recipientsError = computed(() => {
  const bad = parsedRecipients.value.filter(address => !ADDRESS.test(address))
  if (bad.length) return `Not an address: ${bad.join(', ')}`
  if (parsedRecipients.value.length > 10) return 'At most ten addresses.'
  return ''
})
const recipientsHelp = computed(() => {
  const fallback = status.value?.admin_email
  return fallback
    ? `Comma-separated. Left empty, experimental emails go to the deployment admin, ${fallback}.`
    : 'Comma-separated. Required for experimental mode: this deployment has no ADMIN_EMAIL to fall back to.'
})

const saved = computed<ReminderConfig | null>(() => status.value?.config ?? null)
const dirty = computed(() => {
  const stored = saved.value
  if (!stored) return false
  const recipients = [...new Set(parsedRecipients.value)]
  return (Object.keys(blank()) as Array<keyof ReminderConfig>).some((key) => {
    if (key === 'test_recipients') return recipients.join(',') !== stored.test_recipients.join(',')
    return draft[key] !== stored[key]
  })
})

const changedLine = computed(() => dirty.value ? 'Unsaved changes' : '')

function adopt(next: ReminderStatus) {
  status.value = next
  Object.assign(draft, blank(), next.config)
  recipientsText.value = next.config.test_recipients.join(', ')
}

function discard() {
  if (status.value) adopt(status.value)
}

const formatWhen = (value?: string | null) => value ? new Date(value).toLocaleString() : '—'
const formatDay = (value?: string | null) => value ? new Date(value).toLocaleDateString() : '—'

const tiles = computed(() => {
  const value = status.value
  if (!value) return []
  const sent = value.counts.sent_last_30_days ?? {}
  const lastRun = value.runs[0]
  return [
    {
      label: 'Next scheduled cycle',
      value: value.config.mode === 'off' ? 'None — reminders are off' : formatWhen(value.next_run_at),
      hint: value.config.mode === 'off' ? '' : `${value.config.mode} mode`
    },
    {
      label: 'Last cycle',
      value: lastRun ? formatWhen(lastRun.started_at) : 'Never',
      hint: lastRun ? `${lastRun.stats.sent ?? 0} sent, ${lastRun.stats.failed ?? 0} failed` : ''
    },
    {
      label: 'Sent in the last 30 days',
      value: `${sent.live ?? 0} live`,
      hint: `${sent.experimental ?? 0} experimental · ${sent.test ?? 0} samples`
    },
    {
      label: 'Accounts with recorded activity',
      value: (value.counts.tracked_accounts ?? 0).toLocaleString(),
      hint: `${value.counts.opted_out ?? 0} turned reminders off`
    }
  ]
})

const SKIP_LABELS: Record<string, string> = {
  guest: 'Guests',
  agent: 'Agents',
  service_account: 'Service accounts',
  disabled: 'Disabled accounts',
  no_email: 'No usable address',
  unverified: 'Unverified address',
  staff: 'Admins and experts',
  opted_out: 'Turned reminders off',
  recently_active: 'Active recently',
  reminders_used_up: 'Already had every reminder',
  waiting_for_next: 'Waiting for the next interval',
  no_activity_row: 'No activity record'
}
const skippedBadges = computed(() => Object.entries(preview.value?.skipped ?? {})
  .filter(([, count]) => count > 0)
  .map(([key, count]) => ({ key, count, label: SKIP_LABELS[key] ?? key })))

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', hu: 'Magyar', sl: 'Slovenščina', el: 'Ελληνικά' }

const previewColumns = [
  {
    accessorKey: 'email',
    header: 'Person',
    cell: ({ row }: { row: { original: ReminderPreviewRow } }) => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'truncate text-sm text-gray-900 dark:text-white' }, row.original.first_name || '—'),
      h('p', { class: 'truncate font-mono text-[0.6875rem] text-gray-400 dark:text-gray-500' }, row.original.email)
    ])
  },
  {
    accessorKey: 'days_inactive',
    header: 'Away',
    cell: ({ row }: { row: { original: ReminderPreviewRow } }) => row.original.days_inactive === null
      ? h('span', { class: 'text-gray-500', title: 'Their last visit predates activity tracking; the email says "a while".' }, 'unknown')
      : `${row.original.days_inactive} days`
  },
  {
    accessorKey: 'sequence',
    header: 'Reminder',
    cell: ({ row }: { row: { original: ReminderPreviewRow } }) => `#${row.original.sequence}`
  },
  {
    accessorKey: 'locale',
    header: 'Language',
    cell: ({ row }: { row: { original: ReminderPreviewRow } }) => LANGUAGE_NAMES[row.original.locale] ?? row.original.locale
  },
  {
    accessorKey: 'in_next_run',
    header: 'Next cycle',
    cell: ({ row }: { row: { original: ReminderPreviewRow } }) => h(UBadge, {
      size: 'sm',
      variant: 'soft',
      color: row.original.in_next_run ? 'success' : 'neutral'
    }, () => row.original.in_next_run ? 'included' : 'later')
  }
]

const MODE_COLOURS: Record<string, 'neutral' | 'warning' | 'primary' | 'info'> = {
  live: 'primary',
  experimental: 'warning',
  test: 'info'
}

const runColumns = [
  {
    accessorKey: 'started_at',
    header: 'Started',
    cell: ({ row }: { row: { original: ReminderRun } }) => h('div', [
      h('p', { class: 'text-sm' }, formatWhen(row.original.started_at)),
      h('p', { class: 'text-[0.6875rem] text-gray-400' }, row.original.source === 'manual' ? 'run by an admin' : 'scheduled')
    ])
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    cell: ({ row }: { row: { original: ReminderRun } }) => h(UBadge, {
      size: 'sm', variant: 'soft', color: MODE_COLOURS[row.original.mode] ?? 'neutral'
    }, () => row.original.mode)
  },
  {
    accessorKey: 'stats',
    header: 'Due → sent',
    cell: ({ row }: { row: { original: ReminderRun } }) => {
      const s = row.original.stats ?? {}
      const extra = [
        s.failed ? `${s.failed} failed` : '',
        s.deferred ? `${s.deferred} deferred` : '',
        s.already_handled ? `${s.already_handled} already done` : ''
      ].filter(Boolean).join(', ')
      return h('div', [
        h('p', { class: 'text-sm tabular-nums' }, `${s.due ?? 0} → ${s.sent ?? 0}`),
        extra ? h('p', { class: 'text-[0.6875rem] text-gray-400' }, extra) : null,
        row.original.error ? h('p', { class: 'text-[0.6875rem] text-red-600 dark:text-red-400' }, row.original.error) : null
      ])
    }
  }
]

const logColumns = [
  {
    accessorKey: 'created_at',
    header: 'When',
    cell: ({ row }: { row: { original: ReminderLogRow } }) => formatWhen(row.original.sent_at || row.original.created_at)
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    cell: ({ row }: { row: { original: ReminderLogRow } }) => h(UBadge, {
      size: 'sm', variant: 'soft', color: MODE_COLOURS[row.original.mode] ?? 'neutral'
    }, () => row.original.mode === 'test' ? 'sample' : row.original.mode)
  },
  {
    accessorKey: 'recipient',
    header: 'To',
    cell: ({ row }: { row: { original: ReminderLogRow } }) => h('div', { class: 'min-w-0' }, [
      h('p', { class: 'truncate font-mono text-xs' }, row.original.recipient || '—'),
      row.original.sequence
        ? h('p', { class: 'text-[0.6875rem] text-gray-400' }, `reminder #${row.original.sequence} · away since ${formatDay(row.original.inactive_since)}`)
        : null
    ])
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }: { row: { original: ReminderLogRow } }) => h(UBadge, {
      size: 'sm',
      variant: 'soft',
      color: row.original.status === 'sent' ? 'success' : row.original.status === 'failed' ? 'error' : 'neutral',
      title: row.original.error || undefined
    }, () => row.original.attempts > 1 ? `${row.original.status} (${row.original.attempts} tries)` : row.original.status)
  }
]

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const next = await notificationsApi.status()
    adopt(next)
    log.value = next.schema_ready ? (await notificationsApi.log(30)).rows : []
  } catch (error) {
    loadError.value = reminderFailure(error, 'Could not load the reminder settings.')
  } finally {
    loading.value = false
  }
}

function requestSave() {
  if (draft.mode === 'live' && saved.value?.mode !== 'live') {
    confirmingLive.value = true
    return
  }
  void save()
}

async function save() {
  saving.value = true
  try {
    const next = await notificationsApi.save({
      ...draft,
      test_recipients: [...new Set(parsedRecipients.value)]
    })
    adopt(next)
    confirmingLive.value = false
    toast.add({
      title: 'Reminder settings saved',
      description: next.config.mode === 'off'
        ? 'Reminders are off.'
        : `${next.config.mode === 'live' ? 'Live' : 'Experimental'} from the next cycle (${formatWhen(next.next_run_at)}).`,
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (error) {
    toast.add({
      title: 'Not saved',
      description: reminderFailure(error, 'The settings could not be saved.'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    saving.value = false
  }
}

async function sendTest() {
  busy.value = 'test'
  try {
    const result = await notificationsApi.sendTest({ locale: sampleLocale.value })
    toast.add({
      title: result.sent ? 'Sample sent' : 'The mail server did not accept the sample',
      description: result.sent ? `Check ${result.to}.` : 'See the gateway log for the reason.',
      color: result.sent ? 'success' : 'warning',
      icon: result.sent ? 'i-lucide-mail-check' : 'i-lucide-mail-x'
    })
    log.value = (await notificationsApi.log(30)).rows
  } catch (error) {
    toast.add({ title: 'Sample not sent', description: reminderFailure(error, 'The sample could not be sent.'), color: 'error' })
  } finally {
    busy.value = null
  }
}

async function loadPreview() {
  busy.value = 'preview'
  try {
    preview.value = await notificationsApi.preview(100)
  } catch (error) {
    toast.add({ title: 'Preview failed', description: reminderFailure(error, 'Could not work out who is due.'), color: 'error' })
  } finally {
    busy.value = null
  }
}

function requestRun() {
  if (status.value?.config.mode === 'live') {
    confirmingRun.value = true
    return
  }
  void runNow()
}

async function runNow() {
  busy.value = 'run'
  try {
    const result = await notificationsApi.runNow()
    confirmingRun.value = false
    toast.add({
      title: `Cycle finished: ${result.sent} sent`,
      description: [
        `${result.due} due`,
        result.failed ? `${result.failed} failed` : '',
        result.deferred ? `${result.deferred} left for later cycles` : '',
        result.already_handled ? `${result.already_handled} already reminded` : ''
      ].filter(Boolean).join(', '),
      color: result.failed ? 'warning' : 'success',
      icon: 'i-lucide-check'
    })
    await load()
    if (preview.value) await loadPreview()
  } catch (error) {
    toast.add({ title: 'Cycle did not run', description: reminderFailure(error, 'The cycle could not run.'), color: 'error' })
  } finally {
    busy.value = null
  }
}

onMounted(() => {
  void load()
})
</script>

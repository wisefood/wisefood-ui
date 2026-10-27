import wisefoodRestApi from './wisefoodRestApi'
import { getWisefoodRestApiUrl } from '~/utils/runtimeConfig'
import { analyticsHeaders } from '~/composables/useAnalyticsSession'

/**
 * Inactivity reminders: the admin card on Platform Operations, the switch on
 * My Profile, and the public page a reminder's "turn these off" link opens.
 *
 * Gateway: `src/routers/notifications.py` and `/users/me/notification-preferences`.
 */

export type ReminderMode = 'off' | 'experimental' | 'live'

export interface ReminderConfig {
  mode: ReminderMode
  inactive_after_days: number
  repeat_every_days: number
  max_reminders: number
  send_hour_utc: number
  max_per_run: number
  test_recipients: string[]
  verified_only: boolean
  include_staff: boolean
}

export interface ReminderRun {
  id: number
  mode: 'live' | 'experimental'
  source: 'scheduled' | 'manual'
  run_date: string
  triggered_by: string | null
  started_at: string
  finished_at: string | null
  error: string | null
  stats: {
    considered?: number
    eligible?: number
    due?: number
    sent?: number
    failed?: number
    already_handled?: number
    deferred?: number
    skipped?: Record<string, number>
  }
}

export interface ReminderStatus {
  config: ReminderConfig
  defaults: ReminderConfig
  limits: Record<string, [number, number]>
  mail_enabled: boolean
  scheduler_enabled: boolean
  effective_test_recipients: string[]
  admin_email: string | null
  schema_ready: boolean
  runs: ReminderRun[]
  counts: {
    tracked_accounts?: number
    opted_out?: number
    sent_last_30_days?: Record<string, number>
  }
  next_run_at: string | null
  now: string
}

export interface ReminderPreviewRow {
  user_id: string
  email: string
  first_name: string | null
  locale: string
  last_seen_at: string
  estimated: boolean
  days_inactive: number | null
  sequence: number
  in_next_run: boolean
}

export interface ReminderPreview {
  mode: 'live' | 'experimental'
  considered: number
  eligible: number
  due: number
  max_per_run: number
  skipped: Record<string, number>
  rows: ReminderPreviewRow[]
}

export interface ReminderLogRow {
  id: number
  mode: 'live' | 'experimental' | 'test'
  user_id: string | null
  recipient: string | null
  sequence: number | null
  inactive_since: string | null
  status: 'claimed' | 'sent' | 'failed'
  attempts: number
  error: string | null
  run_id: number | null
  created_at: string
  sent_at: string | null
}

export interface ReminderRunResult extends Required<Pick<ReminderRun['stats'], 'sent' | 'failed' | 'due' | 'deferred'>> {
  run_id: number
  mode: 'live' | 'experimental'
  already_handled: number
}

export interface NotificationPreferences {
  inactivity_reminders: boolean
  updated_at: string | null
  updated_via: string | null
  /** False for a guest, or before the deployment has the schema: hide the switch. */
  applies: boolean
}

/** The message a failed call should show, rather than "Request failed". */
export const reminderFailure = (error: unknown, fallback: string): string => {
  const detail = (error as { data?: { error?: { detail?: string } } })?.data?.error?.detail
  return detail || fallback
}

class NotificationsApiService {
  private base = '/notifications/inactivity'

  status(): Promise<ReminderStatus> {
    return wisefoodRestApi.get<ReminderStatus>(this.base)
  }

  save(config: ReminderConfig): Promise<ReminderStatus> {
    return wisefoodRestApi.put<ReminderStatus>(this.base, { config })
  }

  preview(limit = 100): Promise<ReminderPreview> {
    return wisefoodRestApi.get<ReminderPreview>(`${this.base}/preview`, { params: { limit } })
  }

  log(limit = 50): Promise<{ rows: ReminderLogRow[] }> {
    return wisefoodRestApi.get<{ rows: ReminderLogRow[] }>(`${this.base}/log`, { params: { limit } })
  }

  sendTest(body: { to?: string, locale?: string }): Promise<{ sent: boolean, to: string }> {
    return wisefoodRestApi.post<{ sent: boolean, to: string }>(`${this.base}/test`, body)
  }

  runNow(): Promise<ReminderRunResult> {
    return wisefoodRestApi.post<ReminderRunResult>(`${this.base}/run`, {})
  }

  myPreferences(): Promise<NotificationPreferences> {
    return wisefoodRestApi.get<NotificationPreferences>('/users/me/notification-preferences')
  }

  setMyReminders(enabled: boolean): Promise<NotificationPreferences> {
    return wisefoodRestApi.put<NotificationPreferences>('/users/me/notification-preferences', {
      inactivity_reminders: enabled
    })
  }

  /*
   * The two calls the unsubscribe page makes. Plain fetch, no session: the
   * person may be reading the mail on a phone that has never signed in, and
   * the token in the link is the credential.
   */
  private async publicPost<T>(path: string, token: string): Promise<T | null> {
    try {
      const url = `${getWisefoodRestApiUrl()}/notifications/${path}?token=${encodeURIComponent(token)}&source=page`
      const response = await fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json', ...analyticsHeaders() },
        referrerPolicy: 'no-referrer'
      })
      if (!response.ok) return null
      const body = await response.json() as { result?: T }
      return body?.result ?? null
    } catch {
      return null
    }
  }

  unsubscribe(token: string) {
    return this.publicPost<{ unsubscribed: boolean, preview: boolean }>('unsubscribe', token)
  }

  resubscribe(token: string) {
    return this.publicPost<{ subscribed: boolean, preview: boolean }>('resubscribe', token)
  }
}

export default new NotificationsApiService()

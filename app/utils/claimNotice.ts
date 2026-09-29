/**
 * What the login page tells a guest who just kept their account.
 *
 * The claim signs this tab out on the way to the login page (a guest never
 * had a Keycloak session to fall back on), and a toast does not survive the
 * change of layout. The note is stashed here for the login card to pick up,
 * once — session storage, because it belongs to this tab and this moment.
 */
const KEY = 'wisefood_claim_notice'

export interface ClaimNotice {
  email: string
  verification_sent: boolean
}

export function stashClaimNotice(notice: ClaimNotice): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(notice))
  } catch {
    // Blocked storage: the login page simply shows no note.
  }
}

export function takeClaimNotice(): ClaimNotice | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    window.sessionStorage.removeItem(KEY)
    const parsed = JSON.parse(raw) as Partial<ClaimNotice>
    if (typeof parsed.email !== 'string') return null
    return { email: parsed.email, verification_sent: parsed.verification_sent === true }
  } catch {
    return null
  }
}

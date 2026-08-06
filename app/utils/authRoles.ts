export const CONSOLE_ALLOWED_ROLES = ['expert', 'admin'] as const

/**
 * Roles allowed to operate the platform, as opposed to curate its content.
 *
 * Experts edit articles, guides and guidelines; only admins reindex, inspect
 * cluster state, or queue corpus-wide embedding work. Keeping the two lists
 * separate is what lets the console show the same pages to both while hiding
 * the destructive surfaces from one.
 */
export const ADMIN_ROLES = ['admin'] as const

const normalizeRole = (role: string) => role.trim().toLowerCase()

export const includesRole = (
  roles: readonly string[] | null | undefined,
  role: string
): boolean => {
  const targetRole = normalizeRole(role)
  return (roles ?? []).some(currentRole => normalizeRole(currentRole) === targetRole)
}

export const includesAnyRole = (
  roles: readonly string[] | null | undefined,
  requiredRoles: readonly string[]
): boolean => requiredRoles.some(role => includesRole(roles, role))

export const canAccessConsole = (
  roles: readonly string[] | null | undefined
): boolean => includesAnyRole(roles, CONSOLE_ALLOWED_ROLES)

export const isAdmin = (
  roles: readonly string[] | null | undefined
): boolean => includesAnyRole(roles, ADMIN_ROLES)

export const CONSOLE_ALLOWED_ROLES = ['expert', 'admin'] as const

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

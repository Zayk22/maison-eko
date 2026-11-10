/**
 * Pure admin comparison. No imports, so this can be tested in a plain
 * node environment without pulling in @clerk/nextjs/server.
 *
 * Both arguments must be non-empty strings after trimming. Whitespace-only
 * values are treated as missing so a trailing space in ADMIN_USER_ID does
 * not accidentally lock the admin out.
 */
export function isAdminUser(
  userId: string | null | undefined,
  adminId: string | null | undefined,
): boolean {
  if (!userId || !adminId) return false;
  const u = userId.trim();
  const a = adminId.trim();
  if (u.length === 0 || a.length === 0) return false;
  return u === a;
}
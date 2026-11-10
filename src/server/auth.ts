import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/admin";

export type AdminAuthResult =
  | { status: "ok"; userId: string }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "misconfigured" };

/**
 * Server-side guard. Call this at the top of every admin page, layout,
 * route handler and server action. Do not rely on the proxy alone.
 *
 * Pages respond to:
 * - unauthenticated  with `redirect("/sign-in")`
 * - forbidden        with a 403-style page
 * - misconfigured    with a 500-style page
 *
 * API route handlers respond to:
 * - unauthenticated  with 401 JSON
 * - forbidden        with 403 JSON
 * - misconfigured    with 500 JSON
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const { userId } = await auth();

  if (!userId) {
    return { status: "unauthenticated" };
  }

  const adminId = process.env.ADMIN_USER_ID;
  if (!adminId || adminId.trim().length === 0) {
    return { status: "misconfigured" };
  }

  if (!isAdminUser(userId, adminId)) {
    return { status: "forbidden" };
  }

  return { status: "ok", userId };
}
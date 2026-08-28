// Client components can't call revalidatePath directly (server-only) — this
// hits the /admin/revalidate route handler instead, which is covered by the
// same staff-only middleware gate as every other /admin/* route.
export async function revalidateAdminPaths(paths: string[]): Promise<void> {
  try {
    await fetch("/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });
  } catch {
    // Best-effort — the page's normal ISR window still catches up even if
    // this call fails, so a save should never be blocked on it.
  }
}

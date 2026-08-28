"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminLogoutButton() {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full navigation — clears any client-side/router-cached state from
    // the just-ended staff session before landing on the login page.
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="rounded-[2px] border border-forest px-4 py-2.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/account/login-form";

export default function AccountLoginPage() {
  // ?redirect= support (e.g. bounced here from /account) without
  // useSearchParams(), which would require a Suspense boundary — reading
  // window.location on mount avoids that for a plain client component.
  const [redirectTo, setRedirectTo] = useState("/account");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("redirect");
    if (r && r.startsWith("/")) setRedirectTo(r);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-1 block font-serif text-2xl text-ink no-underline">
            The Finishing Hub
          </Link>
          <div className="text-xs uppercase tracking-[0.2em] text-[#8a8073]">Sign in</div>
        </div>
        <LoginForm
          onSuccess={() => {
            // Full navigation, not router.push — the server needs the
            // freshly-set session cookie on the very next request.
            window.location.href = redirectTo;
          }}
        />
        <div className="mt-6 flex items-center justify-between text-[13px]">
          <Link href="/account/signup" className="text-forest hover:underline">
            Create an account
          </Link>
          <Link href="/account/forgot-password" className="text-[#6b6155] hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}

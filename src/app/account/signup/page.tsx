"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignupForm } from "@/components/account/signup-form";

export default function AccountSignupPage() {
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
          <div className="text-xs uppercase tracking-[0.2em] text-[#8a8073]">
            Create an account
          </div>
        </div>
        <SignupForm />
        <div className="mt-6 text-center text-[13px]">
          <span className="text-[#6b6155]">Already have an account? </span>
          <Link
            href={`/account/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-forest hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

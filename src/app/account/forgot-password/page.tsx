import Link from "next/link";
import { ForgotPasswordForm } from "@/components/account/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-1 block font-serif text-2xl text-ink no-underline">
            The Finishing Hub
          </Link>
          <div className="text-xs uppercase tracking-[0.2em] text-[#8a8073]">
            Reset your password
          </div>
        </div>
        <ForgotPasswordForm />
        <div className="mt-6 text-center text-[13px]">
          <Link href="/account/login" className="text-forest hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

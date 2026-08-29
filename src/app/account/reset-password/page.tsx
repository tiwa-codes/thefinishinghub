import Link from "next/link";
import { ResetPasswordForm } from "@/components/account/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-1 block font-serif text-2xl text-ink no-underline">
            The Finishing Hub
          </Link>
          <div className="text-xs uppercase tracking-[0.2em] text-[#8a8073]">
            Set a new password
          </div>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}

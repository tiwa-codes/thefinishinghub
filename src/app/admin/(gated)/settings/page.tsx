"use client";

import { useState, type FormEvent } from "react";

export default function AdminSettingsPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter an email address.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? "Could not send invite.");
      return;
    }
    setSuccess(`Invite sent to ${email.trim()}.`);
    setEmail("");
  }

  return (
    <div className="max-w-[480px]">
      <div className="mb-6 font-serif text-2xl text-ink">Settings</div>
      <div className="rounded-[2px] border border-[#ddd5c4] bg-white p-6">
        <div className="mb-1 font-serif text-lg text-ink">Invite staff member</div>
        <p className="mb-4 text-sm text-[#8a8073]">
          Sends an email invite and grants admin access once accepted.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@thefinishinghub.com"
            required
            className="flex-1 rounded-[2px] border border-[#cfc6b6] px-3 py-2 text-sm text-ink outline-none focus:border-forest"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-[2px] bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-deep-forest disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send invite"}
          </button>
        </form>
        {error && <p className="mt-3 text-[13px] text-[#b3261e]">{error}</p>}
        {success && <p className="mt-3 text-[13px] text-forest">{success}</p>}
      </div>
    </div>
  );
}

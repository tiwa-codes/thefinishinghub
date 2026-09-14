"use client";

import { useState } from "react";

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 3.5A10 10 0 0 0 4.7 16.2L3 21l4.9-1.7A10 10 0 1 0 20.5 3.5Z"></path>
      <path d="M8.5 9.5c.3 3 2.7 5.4 5.7 5.7.9.1 1.6-.6 1.6-1.4v-.5l-2-.6-.7.9a5.6 5.6 0 0 1-2.9-2.9l.9-.7-.6-2h-.5c-.8 0-1.5.7-1.4 1.5Z"></path>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 14.5 14.5 9.5"></path>
      <path d="M11 6.5 12.4 5a3.5 3.5 0 0 1 5 5L16 11.4"></path>
      <path d="M13 17.5 11.6 19a3.5 3.5 0 0 1-5-5L8 12.6"></path>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="1.5"></rect>
      <path d="M4 6.5 12 13l8-6.5"></path>
    </svg>
  );
}

export function ShareRow({ productName, productSlug }: { productName: string; productSlug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://thefinishinghub.com/products/${productSlug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (older browser, insecure context) — no
      // fallback needed here, the visible URL is already in the address bar.
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-[#6b6155]">Share this piece:</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${productName} - ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="flex cursor-pointer items-center text-[#4a4339] hover:text-forest"
      >
        <WhatsAppIcon />
      </a>
      <span className="relative">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy link"
          className="flex cursor-pointer items-center text-[#4a4339] hover:text-forest"
        >
          <LinkIcon />
        </button>
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[2px] bg-ink px-2 py-1 text-[11px] text-cream">
            Copied!
          </span>
        )}
      </span>
      <a
        href={`mailto:?subject=${encodeURIComponent(productName)}&body=${encodeURIComponent(`I thought you might like this: ${url}`)}`}
        aria-label="Share by email"
        className="flex cursor-pointer items-center text-[#4a4339] hover:text-forest"
      >
        <EmailIcon />
      </a>
    </div>
  );
}

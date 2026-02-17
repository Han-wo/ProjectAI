"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-xl border border-white/40 bg-white/70 px-3 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
    >
      Sign Out
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl: "/"
    });

    if (!result || result.error) {
      setError("로그인 정보가 올바르지 않습니다.");
      setIsLoading(false);
      return;
    }

    router.push(result.url ?? "/");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <section className="glass-card w-full p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tide">
          LLM Workspace Access
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Sign In</h1>
        <p className="mt-2 text-sm text-soft">
          `AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD`로 로그인합니다.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm text-soft">
            Email
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-xl border border-ink/15 bg-white/80 px-3 py-2 text-sm text-ink outline-none ring-0 transition focus:border-tide"
              required
            />
          </label>

          <label className="grid gap-1 text-sm text-soft">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border border-ink/15 bg-white/80 px-3 py-2 text-sm text-ink outline-none ring-0 transition focus:border-tide"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-xl bg-gradient-to-r from-ember to-[#af2d34] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </form>
      </section>
    </main>
  );
}

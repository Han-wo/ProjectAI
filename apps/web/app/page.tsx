import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { ChatPlayground } from "@/components/chat-playground";
import { SignOutButton } from "@/components/sign-out-button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto grid w-[min(1080px,calc(100%-1.5rem))] gap-4 py-8">
      <section className="glass-card grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-tide">
            Node.js Fullstack LLM Workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight md:text-5xl">
            Control Room
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-soft md:text-base">
            LiteLLM 로그 기반 멀티 프로바이더(OpenAI/Anthropic) + LangGraph + RAG를 한
            번에 검증하는 개발 대시보드입니다.
          </p>
          <p className="mt-2 text-xs text-soft/90">
            signed in as <span className="font-semibold">{session.user.email}</span>
          </p>
        </div>
        <SignOutButton />
      </section>

      <ChatPlayground />
    </main>
  );
}

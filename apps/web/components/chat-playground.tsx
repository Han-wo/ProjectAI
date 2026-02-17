"use client";

import type { LlmProvider } from "@repo/llm-core/contracts";
import { FormEvent, useEffect, useMemo, useState } from "react";

type ChatResponse = {
  provider: LlmProvider;
  model: string;
  output: string;
  createdAt: string;
  threadId?: string;
};

const DEFAULT_PROVIDER: LlmProvider = "litellm";
const fallbackProviders: LlmProvider[] = [DEFAULT_PROVIDER, "openai", "anthropic"];

export function ChatPlayground() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

  const [mode, setMode] = useState<"chat" | "agent">("chat");
  const [threadId, setThreadId] = useState("demo-thread-1");
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState<LlmProvider>("litellm");
  const [model, setModel] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a concise and precise assistant."
  );
  const [providers, setProviders] = useState<LlmProvider[]>(fallbackProviders);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProviders = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/llm/providers`, {
          method: "GET"
        });

        if (!res.ok) {
          throw new Error("provider list fetch failed");
        }

        const data = (await res.json()) as { providers?: LlmProvider[] };
        const firstProvider = data.providers?.[0];

        if (mounted && data.providers && data.providers.length > 0 && firstProvider) {
          setProviders(data.providers);
          setProvider(firstProvider);
        }
      } catch {
        if (mounted) {
          setProviders(fallbackProviders);
          setProvider(DEFAULT_PROVIDER);
        }
      }
    };

    void loadProviders();

    return () => {
      mounted = false;
    };
  }, [apiBaseUrl]);

  const canSubmit = useMemo(
    () => message.trim().length > 0 && !isLoading,
    [isLoading, message]
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResponse(null);
    setIsLoading(true);

    try {
      const endpoint = mode === "agent" ? "agent" : "chat";

      const res = await fetch(`${apiBaseUrl}/llm/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          provider,
          threadId: mode === "agent" ? threadId : undefined,
          model: model.trim() || undefined,
          systemPrompt: systemPrompt.trim() || undefined
        })
      });

      const body = (await res.json()) as
        | ChatResponse
        | {
            message?: string;
            error?: string;
          };

      if (!res.ok) {
        const reason =
          "error" in body && body.error
            ? body.error
            : "message" in body && body.message
              ? body.message
              : "unknown api error";

        throw new Error(reason);
      }

      setResponse(body as ChatResponse);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "request failed unexpectedly"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="grid gap-4 md:grid-cols-[1.02fr_1fr]">
      <form onSubmit={onSubmit} className="glass-card grid gap-3 p-4 md:p-5">
        <label className="grid gap-1 text-sm text-soft">
          Mode
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as "chat" | "agent")}
            className="field"
          >
            <option value="chat">chat</option>
            <option value="agent">langgraph-agent</option>
          </select>
        </label>

        {mode === "agent" && (
          <label className="grid gap-1 text-sm text-soft">
            Thread ID
            <input
              value={threadId}
              onChange={(event) => setThreadId(event.target.value)}
              className="field"
            />
          </label>
        )}

        <label className="grid gap-1 text-sm text-soft">
          Provider
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as LlmProvider)}
            className="field"
          >
            {providers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-soft">
          Model (optional)
          <input
            placeholder="예: openai-gpt-4.1-mini"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="field"
          />
        </label>

        <label className="grid gap-1 text-sm text-soft">
          System Prompt (optional)
          <textarea
            rows={3}
            value={systemPrompt}
            onChange={(event) => setSystemPrompt(event.target.value)}
            className="field resize-y"
          />
        </label>

        <label className="grid gap-1 text-sm text-soft">
          User Message
          <textarea
            rows={6}
            placeholder="모델에게 보낼 메시지를 입력하세요"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="field resize-y"
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-gradient-to-r from-ember to-[#af2d34] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {isLoading ? "Generating..." : "Run LLM"}
        </button>
      </form>

      <article className="glass-card p-4 md:p-5">
        <h2 className="text-base font-semibold text-ink">Response</h2>

        {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

        {!error && !response && (
          <p className="mt-3 text-sm text-soft">
            아직 응답이 없습니다. 요청을 실행해보세요.
          </p>
        )}

        {response && (
          <>
            <p className="mt-3 text-sm text-soft">
              provider: <strong className="text-ink">{response.provider}</strong> | model:{" "}
              <strong className="text-ink">{response.model}</strong>
            </p>

            {response.threadId && (
              <p className="mt-1 text-sm text-soft">
                threadId: <strong className="text-ink">{response.threadId}</strong>
              </p>
            )}

            <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl bg-[#13232a] p-3 font-mono text-xs leading-6 text-[#f5f1e7]">
              {response.output || "(empty output)"}
            </pre>

            <p className="mt-2 text-xs text-soft">createdAt: {response.createdAt}</p>
          </>
        )}
      </article>
    </section>
  );
}

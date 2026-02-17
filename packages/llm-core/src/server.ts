import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import {
  type ChatRequest,
  ChatRequestSchema,
  type ChatResponse,
  type LlmProvider
} from "./contracts";

export interface LlmCoreConfig {
  defaultProvider?: LlmProvider;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  openaiModel?: string;
  anthropicModel?: string;
  useLiteLlm?: boolean;
  liteLlmBaseUrl?: string;
  liteLlmApiKey?: string;
  liteLlmOpenaiModel?: string;
  liteLlmAnthropicModel?: string;
}

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";
const DEFAULT_LITELLM_OPENAI_MODEL = "openai-gpt-4.1-mini";
const DEFAULT_LITELLM_ANTHROPIC_MODEL = "anthropic-claude-3-5-haiku";

const parseBoolean = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }

  return value === "1" || value.toLowerCase() === "true";
};

const normalizeLiteLlmBaseUrl = (url: string): string => {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
};

const extractTextFromOpenAiContent = (content: unknown): string => {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (!part || typeof part !== "object") {
        return "";
      }

      if (!("type" in part) || part.type !== "text") {
        return "";
      }

      if (!("text" in part) || typeof part.text !== "string") {
        return "";
      }

      return part.text;
    })
    .join("\n")
    .trim();
};

export class LlmClient {
  private readonly openai?: OpenAI;

  private readonly anthropic?: Anthropic;

  private readonly liteLlm?: OpenAI;

  private readonly useLiteLlm: boolean;

  private readonly defaultProvider: LlmProvider;

  private readonly openaiModel: string;

  private readonly anthropicModel: string;

  private readonly liteLlmOpenaiModel: string;

  private readonly liteLlmAnthropicModel: string;

  constructor(config: LlmCoreConfig) {
    this.useLiteLlm = config.useLiteLlm ?? false;
    this.defaultProvider =
      config.defaultProvider ?? (this.useLiteLlm ? "litellm" : "openai");
    this.openaiModel = config.openaiModel ?? DEFAULT_OPENAI_MODEL;
    this.anthropicModel = config.anthropicModel ?? DEFAULT_ANTHROPIC_MODEL;
    this.liteLlmOpenaiModel = config.liteLlmOpenaiModel ?? DEFAULT_LITELLM_OPENAI_MODEL;
    this.liteLlmAnthropicModel =
      config.liteLlmAnthropicModel ?? DEFAULT_LITELLM_ANTHROPIC_MODEL;

    if (config.openaiApiKey) {
      this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    }

    if (config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    }

    if (this.useLiteLlm && config.liteLlmApiKey && config.liteLlmBaseUrl) {
      this.liteLlm = new OpenAI({
        apiKey: config.liteLlmApiKey,
        baseURL: normalizeLiteLlmBaseUrl(config.liteLlmBaseUrl)
      });
    }
  }

  getAvailableProviders(): LlmProvider[] {
    const providers = new Set<LlmProvider>();

    if (this.liteLlm) {
      providers.add("litellm");
      providers.add("openai");
      providers.add("anthropic");
    }

    if (this.openai) {
      providers.add("openai");
    }

    if (this.anthropic) {
      providers.add("anthropic");
    }

    return [...providers];
  }

  async chat(rawInput: unknown): Promise<ChatResponse> {
    const input = ChatRequestSchema.parse(rawInput);
    const provider = input.provider ?? this.defaultProvider;

    switch (provider) {
      case "openai":
        return this.useLiteLlm && this.liteLlm
          ? this.chatWithLiteLlm(input, this.liteLlmOpenaiModel, "openai")
          : this.chatWithOpenAI(input);
      case "anthropic":
        return this.useLiteLlm && this.liteLlm
          ? this.chatWithLiteLlm(input, this.liteLlmAnthropicModel, "anthropic")
          : this.chatWithAnthropic(input);
      case "litellm":
        return this.chatWithLiteLlm(
          input,
          input.model ?? this.liteLlmOpenaiModel,
          "litellm"
        );
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async chatWithOpenAI(input: ChatRequest): Promise<ChatResponse> {
    if (!this.openai) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const completion = await this.openai.chat.completions.create({
      model: input.model ?? this.openaiModel,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      messages: [
        ...(input.systemPrompt
          ? [{ role: "system" as const, content: input.systemPrompt }]
          : []),
        { role: "user" as const, content: input.message }
      ]
    });

    return {
      provider: "openai",
      model: completion.model,
      output: extractTextFromOpenAiContent(completion.choices[0]?.message?.content),
      createdAt: new Date().toISOString()
    };
  }

  private async chatWithAnthropic(input: ChatRequest): Promise<ChatResponse> {
    if (!this.anthropic) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    const response = await this.anthropic.messages.create({
      model: input.model ?? this.anthropicModel,
      max_tokens: input.maxTokens ?? 1024,
      temperature: input.temperature,
      system: input.systemPrompt,
      messages: [{ role: "user", content: input.message }]
    });

    const output = response.content
      .map((part) => {
        if (part.type === "text") {
          return part.text;
        }

        return "";
      })
      .join("\n")
      .trim();

    return {
      provider: "anthropic",
      model: response.model,
      output,
      createdAt: new Date().toISOString()
    };
  }

  private async chatWithLiteLlm(
    input: ChatRequest,
    defaultModel: string,
    responseProvider: LlmProvider
  ): Promise<ChatResponse> {
    if (!this.liteLlm) {
      throw new Error(
        "LiteLLM is not configured (USE_LITELLM/LITELLM_BASE_URL/LITELLM_API_KEY)"
      );
    }

    const completion = await this.liteLlm.chat.completions.create({
      model: input.model ?? defaultModel,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      messages: [
        ...(input.systemPrompt
          ? [{ role: "system" as const, content: input.systemPrompt }]
          : []),
        { role: "user" as const, content: input.message }
      ]
    });

    return {
      provider: responseProvider,
      model: completion.model,
      output: extractTextFromOpenAiContent(completion.choices[0]?.message?.content),
      createdAt: new Date().toISOString()
    };
  }
}

export const createLlmClientFromEnv = (env: NodeJS.ProcessEnv): LlmClient => {
  const defaultProvider =
    env.DEFAULT_PROVIDER === "openai" ||
    env.DEFAULT_PROVIDER === "anthropic" ||
    env.DEFAULT_PROVIDER === "litellm"
      ? env.DEFAULT_PROVIDER
      : undefined;

  return new LlmClient({
    defaultProvider,
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    openaiModel: env.OPENAI_MODEL,
    anthropicModel: env.ANTHROPIC_MODEL,
    useLiteLlm: parseBoolean(env.USE_LITELLM),
    liteLlmBaseUrl: env.LITELLM_BASE_URL,
    liteLlmApiKey: env.LITELLM_API_KEY ?? env.LITELLM_MASTER_KEY,
    liteLlmOpenaiModel: env.LITELLM_OPENAI_MODEL,
    liteLlmAnthropicModel: env.LITELLM_ANTHROPIC_MODEL
  });
};

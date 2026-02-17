import { randomUUID } from "node:crypto";

import { ChatAnthropic } from "@langchain/anthropic";
import { type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

import { AgentRequestSchema, type AgentResponse, type LlmProvider } from "./contracts";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";
const DEFAULT_LITELLM_OPENAI_MODEL = "openai-gpt-4.1-mini";
const DEFAULT_LITELLM_ANTHROPIC_MODEL = "anthropic-claude-3-5-haiku";

export interface LangGraphRunConfig {
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

interface PreparedModel {
  model: ChatOpenAI | ChatAnthropic;
  modelName: string;
  provider: LlmProvider;
}

const normalizeLiteLlmBaseUrl = (url: string): string => {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
};

const normalizeMessageContent = (content: unknown): string => {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part === "object" && "text" in part) {
          const { text } = part as { text?: unknown };
          return typeof text === "string" ? text : "";
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
};

const prepareModel = (
  provider: LlmProvider,
  modelOverride: string | undefined,
  config: LangGraphRunConfig,
  temperature: number | undefined,
  maxTokens: number | undefined
): PreparedModel => {
  const useLiteLlmForProvider =
    provider === "litellm" ||
    (config.useLiteLlm === true && (provider === "openai" || provider === "anthropic"));

  if (useLiteLlmForProvider) {
    if (!config.liteLlmApiKey || !config.liteLlmBaseUrl) {
      throw new Error(
        "LiteLLM is not configured (USE_LITELLM/LITELLM_BASE_URL/LITELLM_API_KEY)"
      );
    }

    const providerModel =
      provider === "anthropic"
        ? (config.liteLlmAnthropicModel ?? DEFAULT_LITELLM_ANTHROPIC_MODEL)
        : (config.liteLlmOpenaiModel ?? DEFAULT_LITELLM_OPENAI_MODEL);

    const modelName = modelOverride ?? providerModel;

    return {
      provider,
      modelName,
      model: new ChatOpenAI({
        apiKey: config.liteLlmApiKey,
        model: modelName,
        temperature,
        maxTokens,
        configuration: {
          baseURL: normalizeLiteLlmBaseUrl(config.liteLlmBaseUrl)
        }
      })
    };
  }

  if (provider === "openai") {
    if (!config.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const modelName = modelOverride ?? config.openaiModel ?? DEFAULT_OPENAI_MODEL;

    return {
      provider,
      modelName,
      model: new ChatOpenAI({
        apiKey: config.openaiApiKey,
        model: modelName,
        temperature,
        maxTokens
      })
    };
  }

  if (!config.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const modelName = modelOverride ?? config.anthropicModel ?? DEFAULT_ANTHROPIC_MODEL;

  return {
    provider,
    modelName,
    model: new ChatAnthropic({
      apiKey: config.anthropicApiKey,
      model: modelName,
      temperature,
      maxTokens
    })
  };
};

export const runLangGraphAgent = async (
  rawInput: unknown,
  config: LangGraphRunConfig
): Promise<AgentResponse> => {
  const input = AgentRequestSchema.parse(rawInput);
  const provider = input.provider ?? config.defaultProvider ?? "openai";
  const threadId = input.threadId ?? randomUUID();

  const prepared = prepareModel(
    provider,
    input.model,
    config,
    input.temperature,
    input.maxTokens
  );

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      const response = await prepared.model.invoke(state.messages);
      return { messages: [response] };
    })
    .addEdge(START, "agent")
    .addEdge("agent", END);

  const graph = workflow.compile();

  const messages: BaseMessage[] = [
    ...(input.systemPrompt ? [new SystemMessage(input.systemPrompt)] : []),
    new HumanMessage(input.message)
  ];

  const result = await graph.invoke(
    { messages },
    {
      configurable: {
        thread_id: threadId
      }
    }
  );

  const lastMessage = result.messages.at(-1);
  const output = normalizeMessageContent(lastMessage?.content);

  return {
    provider: prepared.provider,
    model: prepared.modelName,
    output,
    threadId,
    createdAt: new Date().toISOString()
  };
};

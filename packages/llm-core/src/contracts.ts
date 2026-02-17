import { z } from "zod";

export const LlmProviderSchema = z.enum(["openai", "anthropic", "litellm"]);
export type LlmProvider = z.infer<typeof LlmProviderSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "message is required"),
  provider: LlmProviderSchema.optional(),
  model: z.string().min(1).optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4096).optional()
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  provider: LlmProviderSchema,
  model: z.string(),
  output: z.string(),
  createdAt: z.string()
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const AgentRequestSchema = ChatRequestSchema.extend({
  threadId: z.string().min(1).optional()
});
export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export const AgentResponseSchema = ChatResponseSchema.extend({
  threadId: z.string().min(1)
});
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export const ProviderListResponseSchema = z.object({
  providers: z.array(LlmProviderSchema)
});
export type ProviderListResponse = z.infer<typeof ProviderListResponseSchema>;

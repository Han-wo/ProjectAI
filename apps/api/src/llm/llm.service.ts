import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { runLangGraphAgent } from "@repo/llm-core/langgraph";
import { createLlmClientFromEnv, type LlmClient } from "@repo/llm-core/server";
import { ZodError } from "zod";

@Injectable()
export class LlmService {
  private readonly client: LlmClient;

  constructor(private readonly configService: ConfigService) {
    this.client = createLlmClientFromEnv(this.getLlmEnv());
  }

  getProviders() {
    return this.client.getAvailableProviders();
  }

  async chat(input: unknown) {
    try {
      return await this.client.chat(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.flatten());
      }

      throw new BadGatewayException(
        error instanceof Error ? error.message : "LLM request failed"
      );
    }
  }

  async agent(input: unknown) {
    try {
      const useLiteLlm =
        this.configService.get<string>("USE_LITELLM") === "true" ||
        this.configService.get<string>("USE_LITELLM") === "1";
      const defaultProviderEnv =
        this.configService.get<string>("DEFAULT_PROVIDER") ??
        (useLiteLlm ? "litellm" : "openai");

      return await runLangGraphAgent(input, {
        defaultProvider:
          defaultProviderEnv === "anthropic" || defaultProviderEnv === "litellm"
            ? defaultProviderEnv
            : "openai",
        openaiApiKey: this.configService.get<string>("OPENAI_API_KEY") ?? "",
        anthropicApiKey: this.configService.get<string>("ANTHROPIC_API_KEY") ?? "",
        openaiModel: this.configService.get<string>("OPENAI_MODEL") ?? "",
        anthropicModel: this.configService.get<string>("ANTHROPIC_MODEL") ?? "",
        useLiteLlm,
        liteLlmBaseUrl: this.configService.get<string>("LITELLM_BASE_URL") ?? "",
        liteLlmApiKey:
          this.configService.get<string>("LITELLM_API_KEY") ??
          this.configService.get<string>("LITELLM_MASTER_KEY") ??
          "",
        liteLlmOpenaiModel: this.configService.get<string>("LITELLM_OPENAI_MODEL") ?? "",
        liteLlmAnthropicModel:
          this.configService.get<string>("LITELLM_ANTHROPIC_MODEL") ?? ""
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.flatten());
      }

      throw new BadGatewayException(
        error instanceof Error ? error.message : "LangGraph request failed"
      );
    }
  }

  private getLlmEnv(): NodeJS.ProcessEnv {
    const useLiteLlm =
      this.configService.get<string>("USE_LITELLM") === "true" ||
      this.configService.get<string>("USE_LITELLM") === "1";

    return {
      DEFAULT_PROVIDER:
        this.configService.get<string>("DEFAULT_PROVIDER") ??
        (useLiteLlm ? "litellm" : "openai"),
      OPENAI_API_KEY: this.configService.get<string>("OPENAI_API_KEY") ?? "",
      ANTHROPIC_API_KEY: this.configService.get<string>("ANTHROPIC_API_KEY") ?? "",
      OPENAI_MODEL: this.configService.get<string>("OPENAI_MODEL") ?? "",
      ANTHROPIC_MODEL: this.configService.get<string>("ANTHROPIC_MODEL") ?? "",
      USE_LITELLM: this.configService.get<string>("USE_LITELLM") ?? "",
      LITELLM_BASE_URL: this.configService.get<string>("LITELLM_BASE_URL") ?? "",
      LITELLM_API_KEY: this.configService.get<string>("LITELLM_API_KEY") ?? "",
      LITELLM_MASTER_KEY: this.configService.get<string>("LITELLM_MASTER_KEY") ?? "",
      LITELLM_OPENAI_MODEL: this.configService.get<string>("LITELLM_OPENAI_MODEL") ?? "",
      LITELLM_ANTHROPIC_MODEL:
        this.configService.get<string>("LITELLM_ANTHROPIC_MODEL") ?? ""
    };
  }
}

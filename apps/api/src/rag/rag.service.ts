import { randomUUID } from "node:crypto";

import { BadGatewayException, BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createQdrantVectorStore,
  similaritySearchWithScore,
  upsertDocuments
} from "@repo/llm-core/vector";
import { z, ZodError } from "zod";

const RagIndexRequestSchema = z.object({
  collectionName: z.string().min(1).optional(),
  documents: z
    .array(
      z.object({
        id: z.string().optional(),
        text: z.string().min(1),
        metadata: z.record(z.any()).optional()
      })
    )
    .min(1)
});

const RagSearchRequestSchema = z.object({
  collectionName: z.string().min(1).optional(),
  query: z.string().min(1),
  k: z.number().int().positive().max(20).optional()
});

@Injectable()
export class RagService {
  constructor(private readonly configService: ConfigService) {}

  async indexDocuments(rawInput: unknown) {
    try {
      const input = RagIndexRequestSchema.parse(rawInput);
      const store = await createQdrantVectorStore(
        this.getQdrantConfig(input.collectionName)
      );

      const indexedAt = new Date().toISOString();
      const docs = input.documents.map((document) => ({
        pageContent: document.text,
        metadata: {
          ...(document.metadata ?? {}),
          sourceId: document.id ?? randomUUID(),
          indexedAt
        }
      }));

      const ids = await upsertDocuments(store, docs);

      return {
        collectionName:
          input.collectionName ??
          this.configService.get<string>("QDRANT_COLLECTION") ??
          "documents",
        indexedCount: docs.length,
        ids
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.flatten());
      }

      throw new BadGatewayException(
        error instanceof Error ? error.message : "RAG index failed"
      );
    }
  }

  async searchDocuments(rawInput: unknown) {
    try {
      const input = RagSearchRequestSchema.parse(rawInput);
      const store = await createQdrantVectorStore(
        this.getQdrantConfig(input.collectionName)
      );
      const results = await similaritySearchWithScore(store, input.query, input.k ?? 4);

      return {
        collectionName:
          input.collectionName ??
          this.configService.get<string>("QDRANT_COLLECTION") ??
          "documents",
        query: input.query,
        k: input.k ?? 4,
        results: results.map(([doc, score]) => ({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
          score
        }))
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.flatten());
      }

      throw new BadGatewayException(
        error instanceof Error ? error.message : "RAG search failed"
      );
    }
  }

  private getQdrantConfig(collectionName?: string) {
    const qdrantUrl = this.configService.get<string>("QDRANT_URL") ?? "";
    const useLiteLlm =
      this.configService.get<string>("USE_LITELLM") === "true" ||
      this.configService.get<string>("USE_LITELLM") === "1";
    const openaiApiKey = this.configService.get<string>("OPENAI_API_KEY") ?? "";
    const liteLlmApiKey =
      this.configService.get<string>("LITELLM_API_KEY") ??
      this.configService.get<string>("LITELLM_MASTER_KEY") ??
      "";
    const liteLlmBaseUrl = this.configService.get<string>("LITELLM_BASE_URL") ?? "";

    if (!qdrantUrl) {
      throw new BadRequestException("QDRANT_URL is not configured");
    }

    if (useLiteLlm && (!liteLlmApiKey || !liteLlmBaseUrl)) {
      throw new BadRequestException(
        "LITELLM_API_KEY and LITELLM_BASE_URL are required for embedding via LiteLLM"
      );
    }

    if (!useLiteLlm && !openaiApiKey) {
      throw new BadRequestException(
        "OPENAI_API_KEY is required when USE_LITELLM is disabled"
      );
    }

    return {
      qdrantUrl,
      qdrantApiKey: this.configService.get<string>("QDRANT_API_KEY") ?? "",
      collectionName:
        collectionName ??
        this.configService.get<string>("QDRANT_COLLECTION") ??
        "documents",
      embeddingApiKey: useLiteLlm ? liteLlmApiKey : openaiApiKey,
      embeddingBaseUrl: useLiteLlm ? liteLlmBaseUrl : undefined,
      embeddingModel:
        this.configService.get<string>("EMBEDDING_MODEL") ??
        (useLiteLlm ? "openai-text-embedding-3-small" : "text-embedding-3-small")
    };
  }
}

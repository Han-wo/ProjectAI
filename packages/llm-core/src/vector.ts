import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";

const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

export interface QdrantStoreConfig {
  qdrantUrl: string;
  qdrantApiKey?: string;
  collectionName: string;
  embeddingApiKey: string;
  embeddingBaseUrl?: string;
  embeddingModel?: string;
  vectorSize?: number;
}

export interface VectorDocumentInput {
  pageContent: string;
  metadata?: Record<string, unknown>;
}

const normalizeEmbeddingBaseUrl = (baseUrl: string): string => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
};

export const createQdrantClient = (config: QdrantStoreConfig): QdrantClient =>
  new QdrantClient({
    url: config.qdrantUrl,
    apiKey: config.qdrantApiKey
  });

export const ensureQdrantCollection = async (
  client: QdrantClient,
  collectionName: string,
  vectorSize = 1536
): Promise<void> => {
  const collections = await client.getCollections();
  const hasCollection = collections.collections.some(
    (collection) => collection.name === collectionName
  );

  if (!hasCollection) {
    await client.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: "Cosine"
      }
    });
  }
};

export const createQdrantVectorStore = async (
  config: QdrantStoreConfig
): Promise<QdrantVectorStore> => {
  const client = createQdrantClient(config);
  await ensureQdrantCollection(client, config.collectionName, config.vectorSize ?? 1536);

  const embeddings = new OpenAIEmbeddings({
    apiKey: config.embeddingApiKey,
    model: config.embeddingModel ?? DEFAULT_EMBEDDING_MODEL,
    configuration: config.embeddingBaseUrl
      ? {
          baseURL: normalizeEmbeddingBaseUrl(config.embeddingBaseUrl)
        }
      : undefined
  });

  return QdrantVectorStore.fromExistingCollection(embeddings, {
    url: config.qdrantUrl,
    apiKey: config.qdrantApiKey,
    collectionName: config.collectionName
  });
};

export const upsertDocuments = async (
  store: QdrantVectorStore,
  documents: VectorDocumentInput[]
): Promise<unknown[]> => {
  if (documents.length === 0) {
    return [];
  }

  const result = await store.addDocuments(documents as any);
  return Array.isArray(result) ? result : [];
};

export const similaritySearch = async (
  store: QdrantVectorStore,
  query: string,
  limit = 4
) => store.similaritySearch(query, limit);

export const similaritySearchWithScore = async (
  store: QdrantVectorStore,
  query: string,
  limit = 4
) => store.similaritySearchWithScore(query, limit);

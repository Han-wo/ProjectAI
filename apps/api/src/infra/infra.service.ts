import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import neo4j, { type Driver } from "neo4j-driver";
import { Pool } from "pg";

export type DependencyState = "ok" | "error" | "skipped";

export interface DependencyStatus {
  state: DependencyState;
  latencyMs: number | null;
  detail?: string;
}

export interface InfraHealthStatus {
  status: "ok" | "degraded";
  checkedAt: string;
  dependencies: {
    postgres: DependencyStatus;
    redis: DependencyStatus;
    qdrant: DependencyStatus;
    neo4j: DependencyStatus;
  };
}

@Injectable()
export class InfraService implements OnModuleDestroy {
  private readonly postgresPool?: Pool;

  private readonly redis?: Redis;

  private readonly neo4jDriver?: Driver;

  private readonly qdrantUrl?: string;

  private readonly qdrantApiKey?: string;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>("DATABASE_URL") ?? "";
    if (databaseUrl) {
      this.postgresPool = new Pool({ connectionString: databaseUrl });
    }

    const redisUrl = this.configService.get<string>("REDIS_URL") ?? "";
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false
      });
    }

    const neo4jUri = this.configService.get<string>("NEO4J_URI") ?? "";
    const neo4jUser = this.configService.get<string>("NEO4J_USERNAME") ?? "";
    const neo4jPassword = this.configService.get<string>("NEO4J_PASSWORD") ?? "";

    if (neo4jUri && neo4jUser && neo4jPassword) {
      this.neo4jDriver = neo4j.driver(
        neo4jUri,
        neo4j.auth.basic(neo4jUser, neo4jPassword)
      );
    }

    this.qdrantUrl = this.configService.get<string>("QDRANT_URL") ?? "";
    this.qdrantApiKey = this.configService.get<string>("QDRANT_API_KEY") ?? "";
  }

  async checkDependencyHealth(): Promise<InfraHealthStatus> {
    const [postgres, redis, qdrant, neo4jStatus] = await Promise.all([
      this.timeCheck(() => this.checkPostgres()),
      this.timeCheck(() => this.checkRedis()),
      this.timeCheck(() => this.checkQdrant()),
      this.timeCheck(() => this.checkNeo4j())
    ]);

    return {
      status: [postgres, redis, qdrant, neo4jStatus].every(
        (item) => item.state !== "error"
      )
        ? "ok"
        : "degraded",
      checkedAt: new Date().toISOString(),
      dependencies: {
        postgres,
        redis,
        qdrant,
        neo4j: neo4jStatus
      }
    };
  }

  async onModuleDestroy() {
    await Promise.allSettled([
      this.postgresPool?.end(),
      this.redis?.quit(),
      this.neo4jDriver?.close()
    ]);
  }

  private async checkPostgres(): Promise<Omit<DependencyStatus, "latencyMs">> {
    if (!this.postgresPool) {
      return { state: "skipped", detail: "DATABASE_URL is missing" };
    }

    await this.postgresPool.query("SELECT 1");
    return { state: "ok" };
  }

  private async checkRedis(): Promise<Omit<DependencyStatus, "latencyMs">> {
    if (!this.redis) {
      return { state: "skipped", detail: "REDIS_URL is missing" };
    }

    if (this.redis.status === "wait") {
      await this.redis.connect();
    }

    const result = await this.redis.ping();
    if (result !== "PONG") {
      return { state: "error", detail: `Unexpected ping response: ${result}` };
    }

    return { state: "ok" };
  }

  private async checkQdrant(): Promise<Omit<DependencyStatus, "latencyMs">> {
    if (!this.qdrantUrl) {
      return { state: "skipped", detail: "QDRANT_URL is missing" };
    }

    const response = await fetch(`${this.qdrantUrl}/collections`, {
      headers: this.qdrantApiKey
        ? {
            "api-key": this.qdrantApiKey
          }
        : undefined
    });
    if (!response.ok) {
      return {
        state: "error",
        detail: `Qdrant status ${response.status}`
      };
    }

    return { state: "ok" };
  }

  private async checkNeo4j(): Promise<Omit<DependencyStatus, "latencyMs">> {
    if (!this.neo4jDriver) {
      return {
        state: "skipped",
        detail: "NEO4J_URI/NEO4J_USERNAME/NEO4J_PASSWORD is missing"
      };
    }

    const session = this.neo4jDriver.session();

    try {
      await session.run("RETURN 1 AS ok");
      return { state: "ok" };
    } finally {
      await session.close();
    }
  }

  private async timeCheck(
    fn: () => Promise<Omit<DependencyStatus, "latencyMs">>
  ): Promise<DependencyStatus> {
    const startedAt = Date.now();

    try {
      const result = await fn();
      return {
        ...result,
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        state: "error",
        detail: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - startedAt
      };
    }
  }
}

import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  OnModuleDestroy
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  createNeo4jDriver,
  runCypher,
  verifyNeo4jConnection
} from "@repo/llm-core/graph";
import { type Driver } from "neo4j-driver";
import { z, ZodError } from "zod";

const GraphQuerySchema = z.object({
  query: z.string().min(1),
  params: z.record(z.unknown()).optional()
});

@Injectable()
export class GraphService implements OnModuleDestroy {
  private readonly driver?: Driver;

  constructor(private readonly configService: ConfigService) {
    const uri = this.configService.get<string>("NEO4J_URI") ?? "";
    const username = this.configService.get<string>("NEO4J_USERNAME") ?? "";
    const password = this.configService.get<string>("NEO4J_PASSWORD") ?? "";

    if (uri && username && password) {
      this.driver = createNeo4jDriver({
        uri,
        username,
        password
      });
    }
  }

  async health() {
    if (!this.driver) {
      return {
        status: "skipped",
        detail: "NEO4J config is missing"
      };
    }

    try {
      await verifyNeo4jConnection(this.driver);

      return {
        status: "ok",
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: "error",
        detail: error instanceof Error ? error.message : "Neo4j check failed",
        checkedAt: new Date().toISOString()
      };
    }
  }

  async query(rawInput: unknown) {
    if (!this.driver) {
      throw new BadRequestException("NEO4J config is missing");
    }

    try {
      const input = GraphQuerySchema.parse(rawInput);
      const rows = await runCypher(this.driver, input.query, input.params ?? {});

      return {
        count: rows.length,
        rows
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.flatten());
      }

      throw new BadGatewayException(
        error instanceof Error ? error.message : "Cypher query failed"
      );
    }
  }

  async onModuleDestroy() {
    await this.driver?.close();
  }
}

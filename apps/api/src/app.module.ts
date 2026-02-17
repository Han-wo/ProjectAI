import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { GraphModule } from "./graph/graph.module";
import { HealthController } from "./health.controller";
import { InfraModule } from "./infra/infra.module";
import { LlmModule } from "./llm/llm.module";
import { RagModule } from "./rag/rag.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env", "../../.env.local", "../../.env"]
    }),
    GraphModule,
    LlmModule,
    InfraModule,
    RagModule
  ],
  controllers: [HealthController]
})
export class AppModule {}

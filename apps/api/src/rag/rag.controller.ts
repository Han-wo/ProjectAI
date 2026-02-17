import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { RagService } from "./rag.service";

@ApiTags("rag")
@Controller("rag")
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post("index")
  @ApiOperation({ summary: "Index documents into Qdrant vector store" })
  async index(@Body() body: unknown) {
    return this.ragService.indexDocuments(body);
  }

  @Post("search")
  @ApiOperation({ summary: "Run vector similarity search from Qdrant" })
  async search(@Body() body: unknown) {
    return this.ragService.searchDocuments(body);
  }
}

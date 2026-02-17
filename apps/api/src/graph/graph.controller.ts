import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { GraphService } from "./graph.service";

@ApiTags("graph")
@Controller("graph")
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Get("health")
  @ApiOperation({ summary: "Check Neo4j connectivity" })
  async health() {
    return this.graphService.health();
  }

  @Post("query")
  @ApiOperation({ summary: "Execute Cypher query in Neo4j" })
  async query(@Body() body: unknown) {
    return this.graphService.query(body);
  }
}

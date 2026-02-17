import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { type InfraHealthStatus, InfraService } from "./infra.service";

@ApiTags("infra")
@Controller("infra")
export class InfraController {
  constructor(private readonly infraService: InfraService) {}

  @Get("health")
  @ApiOperation({
    summary: "Check RDB/Redis/VectorDB/GraphDB connectivity"
  })
  async getInfraHealth(): Promise<InfraHealthStatus> {
    return this.infraService.checkDependencyHealth();
  }
}

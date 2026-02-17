import { Module } from "@nestjs/common";

import { InfraController } from "./infra.controller";
import { InfraService } from "./infra.service";

@Module({
  controllers: [InfraController],
  providers: [InfraService],
  exports: [InfraService]
})
export class InfraModule {}

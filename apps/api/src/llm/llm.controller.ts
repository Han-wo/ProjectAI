import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { LlmService } from "./llm.service";

@ApiTags("llm")
@Controller("llm")
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get("providers")
  @ApiOperation({ summary: "List configured LLM providers" })
  getProviders() {
    return {
      providers: this.llmService.getProviders()
    };
  }

  @Post("chat")
  @ApiOperation({ summary: "Run single-turn chat completion" })
  async chat(@Body() body: unknown) {
    return this.llmService.chat(body);
  }

  @Post("agent")
  @ApiOperation({ summary: "Run LangGraph single-step agent workflow" })
  async agent(@Body() body: unknown) {
    return this.llmService.agent(body);
  }
}

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000"
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("LLM Fullstack API")
    .setDescription("NestJS API for multi-provider LLM features")
    .setVersion("1.0.0")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  console.log(`API ready at http://localhost:${port}`);
}

void bootstrap();

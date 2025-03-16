import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as dotenv from "dotenv";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.APP_HTTP_PORT ?? 5200);
}
dotenv.config();
bootstrap();

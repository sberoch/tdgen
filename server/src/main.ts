import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import { fetch, toPassportConfig } from 'passport-saml-metadata';

async function bootstrap() {
  if (process.env.SAML_METADATA_URL) {
    await fetch({ url: process.env.SAML_METADATA_URL }).then((reader) => {
      const config = toPassportConfig(reader);
      process.env.SAML_CERT = config.idpCert ? (config.idpCert as string) : '';
      process.env.SAML_ENTRY_POINT = config.entryPoint
        ? (config.entryPoint as string)
        : '';
    });
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.enableCors();
  await app.listen(process.env.APP_HTTP_PORT ?? 5200);
}
dotenv.config();
bootstrap();

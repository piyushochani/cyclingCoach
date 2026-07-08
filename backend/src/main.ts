import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const server = express();
    server.use(express.json({ limit: '10mb' }));
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.use(helmet());

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000'];

    app.enableCors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
      credentials: true,
    });

    const port = parseInt(process.env.PORT || '3001', 10);
    await app.listen(port, '0.0.0.0');
    console.log(`Backend listening on 0.0.0.0:${port}`);
  } catch (err) {
    console.error('Failed to start backend:', err);
    process.exit(1);
  }
}
bootstrap();

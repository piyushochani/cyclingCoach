import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

async function bootstrap() {
  const server = express();
  server.use(express.json({ limit: '10mb' }));

  server.get('/health', (_req, res) => res.json({ ok: true }));

  try {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.use(helmet());

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:3000'];

    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https:\/\/([a-z0-9-]+\.)*vercel\.app$/.test(origin)) {
          return callback(null, true);
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
      credentials: true,
    });

    const port = parseInt(process.env.PORT || '3001', 10);
    console.log(`Starting backend on 0.0.0.0:${port} (PORT env=${process.env.PORT ?? 'unset'})`);
    await app.listen(port, '0.0.0.0');
    console.log(`Backend listening on 0.0.0.0:${port}`);
  } catch (err) {
    console.error('NestJS bootstrap failed — starting health-only server:', err);
    const port = parseInt(process.env.PORT || '3001', 10);
    server.listen(port, '0.0.0.0', () => {
      console.log(`Health-only server listening on 0.0.0.0:${port}`);
    });
  }
}
bootstrap();

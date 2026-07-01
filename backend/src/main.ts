import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
  });
  // ponytail: unlimited for /v1 proxy — upstream (9Router/Claude) enforces its own context limits
  app.use('/v1', require('express').json({ limit: '100mb' }));
  // /v1 proxy: allow any origin — auth is enforced by API key, not CORS
  app.use('/v1', (_req: any, res: any, next: any) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (_req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // crossOriginResourcePolicy: cho phép FE (origin khác) nhúng ảnh từ /uploads
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const uploadDir =
    app.get(ConfigService).get<string>('UPLOAD_DIR') ?? 'uploads';
  app.useStaticAssets(join(process.cwd(), uploadDir), {
    prefix: `/${uploadDir}/`,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true, // auto-transform payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = app.get(ConfigService);
  const isProd = config.get('NODE_ENV') === 'production';
  const corsOrigins = config.get<string>('CORS_ORIGINS');

  app.enableCors({
    origin: isProd ? corsOrigins?.split(',').map((s) => s.trim()) : true,
    credentials: true,
  });

  await app.listen(config.get('PORT') ?? 2053);
}
bootstrap();

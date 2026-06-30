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
  // ponytail: unlimited for claude proxy — Claude API enforces its own context limits
  app.use('/claude', require('express').json({ limit: '100mb' }));
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // crossOriginResourcePolicy: cho phép FE (origin khác) nhúng ảnh từ /uploads
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const uploadDir = app.get(ConfigService).get<string>('UPLOAD_DIR') ?? 'uploads';
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: `/${uploadDir}/` });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // strip unknown properties
    forbidNonWhitelisted: true,
    transform: true,       // auto-transform payloads to DTO instances
    transformOptions: { enableImplicitConversion: true },
  }));

  const config = app.get(ConfigService);
  const isProd = config.get('NODE_ENV') === 'production';
  const corsOrigins = config.get<string>('CORS_ORIGINS');

  app.enableCors({
    origin: isProd
      ? corsOrigins?.split(',').map((s) => s.trim())
      : true,
    credentials: true,
  });

  await app.listen(config.get('PORT') ?? 2053);
}
bootstrap();

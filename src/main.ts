import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// morgan for HTTP logging
import morgan from 'morgan';
import * as jwt from 'jsonwebtoken';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // optionally enable morgan HTTP logging
  const skipMorgan = (process.env.SKIP_MORGAN ?? 'false').toLowerCase() === 'true';
  if (!skipMorgan) {
    // middleware to verify JWT (if present) and attach to req.user so morgan and handlers can access user info
    app.use((req: any, _res: any, next: any) => {
      try {
        const authHeader = typeof req.headers?.authorization === 'string' ? req.headers.authorization : null;
        if (authHeader) {
          const token = authHeader.split(' ')[1];
          if (token) {
            try {
              const secret = process.env.JWT_SECRET ?? 'change-me';
              // verify token but don't throw for invalid/expired tokens — just don't attach
              const payload = jwt.verify(token, secret) as any;
              if (payload) {
                // normalize payload for convenience
                if (!payload.id && payload.sub) payload.id = payload.sub;
                req.user = payload;
                req.token = token;
              }
            } catch (e) {
            }
          }
        }
      } catch (e) {
        // swallow
      }
      next();
    });

    const format = process.env.MORGAN_FORMAT || 'combined';
    // add custom token to print user id when available
    (morgan as any).token('user', function (req: any) { return req.user?.id || req.user?.sub || '-'; });
    app.use(morgan(format + ' :user'));
  }
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
   });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();

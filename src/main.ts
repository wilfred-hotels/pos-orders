import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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
    credentials: true,
    optionsSuccessStatus: 200,
    exposedHeaders: ['Content-Disposition'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Simple Swagger setup
  try {
    const config = new DocumentBuilder()
      .setTitle('POS Orders API')
      .setDescription(`API documentation for POS / E-commerce backend
      
Authentication Required:
All endpoints require a valid JWT token for authentication.

How to authenticate:
1. Use the /auth/login endpoint to obtain your JWT token
2. Click the "Authorize" button at the top (or in any endpoint)
3. Enter your token with format: Bearer <your_token>
4. All subsequent requests will include your token

Role-Based Access:
- Your token contains your role information
- Some endpoints have role restrictions (e.g., super_admin only)
- The system will automatically check your role for restricted endpoints`)
      .setVersion('1.0')
      .addTag('Admin - Products Management', 'Super admin endpoints for managing all products across hotels')
      .addTag('Products - Catalog Operations', 'Regular product catalog operations')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token with format: Bearer <token>',
          in: 'header',
        },
        'jwt',
      )
      .build();

    try {
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('swagger', app, document);
    } catch (scanErr) {
      // If scanning controllers/modules fails (common with incompatible versions),
      // attempt to dump module diagnostics to help identify which module's
      // metadata caused the scanner to see undefined routes.
      // eslint-disable-next-line no-console
      console.warn('Swagger scanner failed:', (scanErr as any)?.message ?? scanErr);
      try {
        const container = (app as any).container || (app as any).applicationRef?.container;
        const modulesMap = container?.getModules ? container.getModules() : container?.modules;
        if (modulesMap && typeof modulesMap.forEach === 'function') {
          // modulesMap is a Map of moduleRef
          modulesMap.forEach((moduleRef: any, key: any) => {
            try {
              const hasRoutes = !!moduleRef.routes;
              // eslint-disable-next-line no-console
              console.warn(`Module: ${String(key)} - has routes: ${hasRoutes}`);
              if (hasRoutes && moduleRef.routes && typeof moduleRef.routes.entries === 'function') {
                // count controllers
                const entries = Array.from(moduleRef.routes.entries());
                // eslint-disable-next-line no-console
                console.warn(`  routes entries: ${entries.length}`);
              }
            } catch (inner) {
              // eslint-disable-next-line no-console
              console.warn('  failed to inspect moduleRef', inner);
            }
          });
        } else {
          // eslint-disable-next-line no-console
          console.warn('Unable to read modules map from Nest container');
        }
      } catch (diagErr) {
        // eslint-disable-next-line no-console
        console.warn('Failed to produce swagger diagnostic info:', diagErr);
      }
      const fallback = {
        openapi: '3.0.0',
        info: { title: 'POS Orders API', version: '1.0' },
        paths: {},
      };
      SwaggerModule.setup('swagger', app, fallback);
    }
  } catch (err) {
    // Protect bootstrap: if Swagger fails to scan the app modules (common when
    // versions mismatch or unexpected module shapes exist), log and continue.
    // This prevents the whole application from crashing during startup.
    // The Swagger UI will be unavailable until this is fixed.
    // eslint-disable-next-line no-console
    console.warn('Swagger setup failed, continuing without API docs:', (err as any)?.message ?? err);
  }
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();

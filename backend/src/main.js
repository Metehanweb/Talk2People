import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/errors/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS aktifleştir
  app.enableCors();

  // ConfigService'ten port değerini oku
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;

  // Global validation pipe — DTO doğrulama
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // DTO'da tanımlı olmayan alanları siler
      forbidNonWhitelisted: true, // Tanımsız alan gelirse hata fırlatır
      transform: true,       // Otomatik tip dönüşümü
    }),
  );

  // Global exception filter — merkezi hata yakalama
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);
  console.log(`[Bootstrap] Server running on http://localhost:${port}`);
}
bootstrap();

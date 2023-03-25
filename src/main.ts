import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({ skipMissingProperties: true, transform: true }),
  );
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('E-commerce API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('E-commerce')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(configService.get('SERVER_PORT'));
}
bootstrap();

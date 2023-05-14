import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { config } from 'aws-sdk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ skipMissingProperties: true, transform: true }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());

  //config.update({
  //  accessKeyId: configService.get('AWS_ACCESS_KEY'),
  //  secretAccessKey: configService.get('AWS_SECRET_KEY'),
  //  region: configService.get('AWS_REGION'),
  //});

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('E-commerce API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('E-commerce')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
  await app.listen(configService.get('SERVER_PORT'));
}
bootstrap();

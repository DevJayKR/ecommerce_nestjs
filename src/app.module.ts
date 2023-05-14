import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ProductModule } from './product/product.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { MovieModule } from './movie/movie.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FilesService } from './files/files.service';
import { FilesModule } from './files/files.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        // DATABASE INFO
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),

        // JWT INFO
        JWT_ACCESS_SECRET_KEY: Joi.string().required(),
        JWT_ACCESS_EXPIRATION_TIME: Joi.number().required(),
        JWT_REFRESH_SECRET_KEY: Joi.string().required(),
        JWT_REFRESH_EXPIRATION_TIME: Joi.number().required(),
        JWT_VERIFICATION_TOKEN_SECRET: Joi.string().required(),
        JWT_VERIFICATION_TOKEN_EXPIRATION_TIME: Joi.number().required(),

        // MAIL INFO
        EMAIL_CONFIRMATION_URL: Joi.string().required(),
        EMAIL_SERVICE: Joi.string().required(),
        EMAIL_USER: Joi.string().required(),
        EMAIL_PASSWORD: Joi.string().required(),

        // REDIS
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        REDIS_TTL: Joi.number().required(),

        // SERVER INFO
        SERVER_PORT: Joi.number().required(),

        MOVIE_ADDRESS: Joi.string().required(),

        // FACEBOOK
        FACEBOOK_CLIENT_ID: Joi.string().required(),
        FACEBOOK_CLIENT_SECRET: Joi.string().required(),
        FACEBOOK_CALLBACK_URL: Joi.string().required(),

        // GOOGLE
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().required(),

        // NAVER
        NAVER_CLIENT_ID: Joi.string().required(),
        NAVER_CLIENT_SECRET: Joi.string().required(),
        NAVER_CALLBACK_URL: Joi.string().required(),

        // KAKAO
        KAKAO_CLIENT_ID: Joi.string().required(),
        KAKAO_CALLBACK_URL: Joi.string().required(),

        // AWS
        AWS_REGION: Joi.string().required(),
        AWS_ACCESS_KEY: Joi.string().required(),
        AWS_SECRET_KEY: Joi.string().required(),
        AWS_BUCKEY_NAME: Joi.string().required(),

        // TWILIO
        TWILIO_ACCOUNT_SID: Joi.string().required(),
        TWILIO_AUTH_TOKEN: Joi.string().required(),
        TWILIO_VERIFICATION_SERVICE_SID: Joi.string().required(),
        TWILIO_PHONE_NUMBER: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    EmailModule,
    ProductModule,
    RedisModule,
    HealthModule,
    MovieModule,
    ScheduleModule.forRoot(),
    SmsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

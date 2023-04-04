import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { LocalStrategy } from './strategy/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { EmailModule } from 'src/email/email.module';
import { FacebookAuthModule, GoogleAuthModule } from '@nestjs-hybrid-auth/all';
import { FacebookAuthConfig } from './strategy/facebook.auth.config';
import { GoogleAuthConfig } from './strategy/google.auth.config';

@Module({
  imports: [
    UserModule,
    PassportModule,
    EmailModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    JwtModule.register({}),
    FacebookAuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: FacebookAuthConfig,
    }),
    GoogleAuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: GoogleAuthConfig,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}

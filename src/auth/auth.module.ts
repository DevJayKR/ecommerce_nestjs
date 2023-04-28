import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { LocalStrategy } from './strategy/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy } from './strategy/access.strategy';
import { EmailModule } from 'src/email/email.module';
import { GoogleStrategy } from './strategy/google.strategy';
import { FacebookStrategy } from './strategy/facebook.strategy';
import { NaverStrategy } from './strategy/naver.strategy';
import { KakaoStrategy } from './strategy/kakao.strategy';
import { RtStrategy } from './strategy/refresh.strategy';

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
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    AtStrategy,
    RtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    NaverStrategy,
    KakaoStrategy,
  ],
})
export class AuthModule {}

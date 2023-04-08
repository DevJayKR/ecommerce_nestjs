import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth2';
import { Source } from 'src/user/entities/source.enum';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, Source.GOOGLE) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { email, displayName } = profile;

    try {
      // Profile 이메일이 데이터베이스에 존재하면 로그인,
      const user = await this.userService.getUserByEmail(email);
      const token = this.authService.generateAccessJwt(user.id);
      return { user, token };
    } catch (e) {
      console.log(e);
      if (e.response === 'no user') {
        const newUser = await this.userService.createUserWithSocial({
          email,
          username: displayName,
          source: Source.GOOGLE,
        });
        const token = this.authService.generateAccessJwt(newUser.id);
        return { user: newUser, token };
      }
    }
  }
}

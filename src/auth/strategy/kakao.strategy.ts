import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { Source } from 'src/user/entities/source.enum';
import { AuthService } from '../auth.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, Source.KAKAO) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super({
      clientID: configService.get('KAKAO_CLIENT_ID'),
      callbackURL: configService.get('KAKAO_CALLBACK_URL'),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ) {
    console.log(profile);
    const { displayName } = profile;
    const email = profile._json.kakao_account?.email;

    try {
      const user = await this.userService.getUserByEmail(email);

      const token = this.authService.generateAccessJwt(user.id);
      return { user, token };
    } catch (e) {
      console.log(e);
      if (e.response === 'no user') {
        const newUser = await this.userService.createUserWithSocial({
          email,
          username: displayName,
          source: Source.KAKAO,
        });
        const token = this.authService.generateAccessJwt(newUser.id);
        return { user: newUser, token };
      }
    }
  }
}

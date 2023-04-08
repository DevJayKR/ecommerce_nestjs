import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-naver';
import { Source } from 'src/user/entities/source.enum';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, Source.NAVER) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get('NAVER_CLIENT_ID'),
      clientSecret: configService.get('NAVER_CLIENT_SECRET'),
      callbackURL: configService.get('NAVER_CALLBACK_URL'),
      scope: ['email', 'name', 'nickname'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ) {
    console.log(profile);
    const email = profile.emails[0].value;
    const name = 'asdf';

    try {
      // Profile 이메일이 데이터베이스에 존재하면 로그인,
      console.log(profile);
      const user = await this.userService.getUserByEmail(email);

      const token = this.authService.generateAccessJwt(user.id);
      return { user, token };
    } catch (e) {
      console.log(e);
      if (e.response === 'no user') {
        const newUser = await this.userService.createUserWithSocial({
          email,
          username: name,
          source: Source.NAVER,
          profileImg: profile._json?.profile_image,
        });

        const token = this.authService.generateAccessJwt(newUser.id);
        return { user: newUser, token };
      }
    }

    return profile;
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile } from 'passport-facebook';
import { Strategy } from 'passport-facebook';
import { Source } from 'src/user/entities/source.enum';

@Injectable()
export class FacebookStrategy extends PassportStrategy(
  Strategy,
  Source.FACEBOOK,
) {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('FACEBOOK_CLIENT_ID'),
      clientSecret: configService.get('FACEBOOK_CLIENT_SECRET'),
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL'),
      scope: 'email',
      profileFields: ['emails', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ) {
    console.log(profile);
    return profile;
  }
}

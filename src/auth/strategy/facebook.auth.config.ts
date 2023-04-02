import {
  FacebookAuthModuleOptions,
  FacebookAuthModuleOptionsFactory,
} from '@nestjs-hybrid-auth/all';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookAuthConfig implements FacebookAuthModuleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createModuleOptions():
    | FacebookAuthModuleOptions
    | Promise<FacebookAuthModuleOptions> {
    return {
      clientID: this.configService.get('FACEBOOK_CLIENT_ID'),
      clientSecret: this.configService.get('FACEBOOK_CLIENT_SECRET'),
      callbackURL: this.configService.get('FACEBOOK_CALLBACK_URL'),

      profileFields: ['photos', 'emails'],
    };
  }
}

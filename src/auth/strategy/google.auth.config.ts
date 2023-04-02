import {
  GoogleAuthModuleOptions,
  GoogleAuthModuleOptionsFactory,
} from '@nestjs-hybrid-auth/all';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAuthConfig implements GoogleAuthModuleOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createModuleOptions(): GoogleAuthModuleOptions {
    return {
      clientID: this.configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: this.configService.get('GOOGLE_CALLBACK_URL'),
    };
  }
}

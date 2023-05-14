import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = configService.get('TWILIO_ACCOUNT_SID');
    const authToken = configService.get('TWILIO_AUTH_TOKEN');

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  initialPhoneNumberVerification(phoneNumber: string) {
    const serviceSid = this.configService.get(
      'TWILIO_VERIFICATION_SERVICE_SID',
    );

    return this.twilioClient.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: '+82' + phoneNumber,
        channel: 'sms',
      });
  }

  async confirmPhoneVerifiacation(phone: string, verificationCode: string) {
    const serviceSid = this.configService.get(
      'TWILIO_VERIFICATION_SERVICE_SID',
    );

    const result = await this.twilioClient.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: '+82' + phone,
        code: verificationCode,
      });

    if (!result.valid || result.status !== 'approved') {
      throw new BadRequestException('인증 번호가 잘못 되었습니다.');
    }

    return result.valid;
  }
}

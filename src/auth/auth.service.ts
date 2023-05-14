import {
  BadRequestException,
  CACHE_MANAGER,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from './tokenPayload.interface';
import { EmailService } from 'src/email/email.service';
import { VerificationTokenPayload } from './verificationTokenPayload.interface';
import Bootpay from '@bootpay/backend-js';
import { SelfCheckAuthDto } from './dto/selfcheck-auth.dto';
import { Cache } from 'cache-manager';
import { GoogleAuthProfileDto } from './dto/google-auth-profile.dto.ts';
import { Source } from 'src/user/entities/source.enum';
import { SmsService } from 'src/sms/sms.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly smsService: SmsService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  public generateAccessJwt(userId: string): string {
    const payload: TokenPayload = { userId };
    const option: JwtSignOptions = {
      secret: this.configService.get('JWT_ACCESS_SECRET_KEY'),
      expiresIn: `${this.configService.get('JWT_ACCESS_EXPIRATION_TIME')}s`,
    };
    const token = this.jwtService.sign(payload, option);

    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_EXPIRATION_TIME',
    )}`;
  }

  public generateAccessJwtForClient(userId: string): string {
    const payload: TokenPayload = { userId };
    const option: JwtSignOptions = {
      secret: this.configService.get('JWT_ACCESS_SECRET_KEY'),
      expiresIn: `${this.configService.get('JWT_ACCESS_EXPIRATION_TIME')}s`,
    };
    const token = this.jwtService.sign(payload, option);

    return token;
  }

  public getCookieForLogout() {
    return 'Authentication=; HttpOnly; Path=/; Max-Age=0';
  }

  public async createUser(createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return user;
  }

  public async login(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);
    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched)
      throw new HttpException(
        '패스워드가 일치하지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );

    await this.cacheManager.set(user.id, user);
    return user;
  }

  async generateRefreshToken(userId: string) {
    const payload: TokenPayload = { userId };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET_KEY'),
      expiresIn: `${this.configService.get('JWT_REFRESH_EXPIRATION_TIME')}s`,
    });

    const cookie = `Refresh=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_REFRESH_EXPIRATION_TIME',
    )}`;

    return { cookie, token };
  }

  // 구글 로그인시 이메일 조회 -> 있으면 토큰 -> 없으면 회원가입
  public async loginWithGoogleAuth(
    googleAuthProfileDto: GoogleAuthProfileDto,
  ): Promise<string> {
    const { email } = googleAuthProfileDto;

    try {
      const user = await this.userService.getUserByEmail(email);
      if (user.id) return this.generateAccessJwt(user.id);
    } catch (error) {
      if (error.response === 'no user') {
        const user = await this.registerWithGoogleAuth(googleAuthProfileDto);
        return this.generateAccessJwt(user.id);
      }
    }
  }

  public async registerWithGoogleAuth(
    googleAuthProfileDto: GoogleAuthProfileDto,
  ) {
    const { email, username } = googleAuthProfileDto;

    const newUser = {
      email,
      username,
      source: Source.GOOGLE,
    };

    return await this.userService.createUserWithSocial(newUser);
  }

  public async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      });

      if (typeof payload == 'object' && 'email' in payload) {
        return payload.email;
      }

      throw new BadRequestException();
    } catch (e) {
      if (e?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }
      throw new BadRequestException('Bad confirmation token');
    }
  }

  public async confirmEmail(email: string) {
    const user = await this.userService.getUserByEmail(email);
    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email is already confirmed');
    }

    await this.userService.markEmailAsConfirmed(email);
  }

  public async afterLoginResendConfirmationLink(userId: string) {
    const user = await this.userService.getUserById(userId);

    if (user.isEmailConfirmed) {
      throw new BadRequestException('Email is already confirmed.');
    }

    await this.sendVerificationLink(user.email);
  }

  public async sendSmsOtp(phone: string) {
    await this.smsService.initialPhoneNumberVerification(phone);
  }

  public async sendEmailOtp(email: string) {
    const otp = this.generateOtp(6);
    await this.cacheManager.set(email, otp);

    await this.emailService.sendMail({
      to: email,
      subject: 'Email OTP 인증',
      text: otp,
    });
  }

  public async verifyEmailOtp(email: string, code: number): Promise<boolean> {
    const otp = await this.cacheManager.get(email);

    if (code === otp) {
      await this.cacheManager.del(email);
      return true;
    } else false;
  }

  public async verifySmsOtp(phone: string, code: string) {
    return await this.smsService.confirmPhoneVerifiacation(phone, code);
  }

  public generateOtp(length: number) {
    let otp = '';

    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }

    return otp;
  }

  public async selfCheckAuth(selfCheckAuthDto: SelfCheckAuthDto) {
    Bootpay.setConfiguration({
      application_id: this.configService.get('BOOTPAY_ID'),
      private_key: this.configService.get('BOOTPAY_PK'),
    });

    try {
      await Bootpay.getAccessToken();
      const response = await Bootpay.requestAuthentication({
        pg: selfCheckAuthDto.pg,
        method: selfCheckAuthDto.method,
        order_name: selfCheckAuthDto.order_name,
        username: selfCheckAuthDto.username,
        identity_no: selfCheckAuthDto.identity_no,
        phone: selfCheckAuthDto.phone,
        carrier: selfCheckAuthDto.carrier,
        authenticate_type: 'sms',
        authentication_id: new Date().getTime().toString(),
      });

      console.log(response);
    } catch (e) {
      console.log(e);
    }
  }

  public sendVerificationLink(email: string) {
    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_VERIFICATION_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    const url = `${this.configService.get(
      'EMAIL_CONFIRMATION_URL',
    )}?token=${token}`;

    const text = `Welcome to the application. To confirm email address, click here: ${url}`;

    return this.emailService.sendMail({
      to: email,
      subject: 'Email confirmation (sign up)',
      text,
    });
  }
}

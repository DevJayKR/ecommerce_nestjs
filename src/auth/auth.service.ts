import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from './tokenPayload.interface';
import { EmailService } from 'src/email/email.service';
import { VerificationTokenPayload } from './verificationTokenPayload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  public generateAccessJwt(userId: string) {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload);

    return token;
  }

  public async createUser(createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return user;
  }

  public async login(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);
    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched)
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    return user;
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

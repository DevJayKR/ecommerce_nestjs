import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfirmEmailDto } from 'src/user/dto/confirm-email.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AuthService } from './auth.service';
import JwtAuthGuard from './guard/jwtAuth.guard';
import { LocalAuthGuard } from './guard/localAuth.guard';
import { RequestWithUser } from './requestWithUser.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async register(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.authService.createUser(createUserDto);
    await this.authService.sendVerificationLink(createUserDto.email);

    return newUser;
  }

  @Post('confirm')
  async confirm(@Body() confirmationDto: ConfirmEmailDto) {
    const email = await this.authService.decodeConfirmationToken(
      confirmationDto.token,
    );

    await this.authService.confirmEmail(email);
    return {
      success: true,
      message: 'Confirmed email',
    };
  }

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() request: RequestWithUser) {
    const { user } = request;
    const token = this.authService.generateAccessJwt(user.id);

    return {
      user,
      token,
    };
  }

  // 로그인 전 이메일 확인용 메일 전송 API
  @Post('resend/confirm')
  async beforeLoginResendConfirmationLink(@Body('email') email: string) {
    await this.authService.sendVerificationLink(email);

    return {
      success: true,
      message: 'Please confirm your email',
    };
  }

  // 로그인 이후 이메일 확인용 메일 전송 API
  @Post('email/confirm')
  @UseGuards(JwtAuthGuard)
  async afterLoginResendConfirmationLink(@Req() req: RequestWithUser) {
    const { user } = req;

    await this.authService.afterLoginResendConfirmationLink(user.id);

    return {
      success: true,
      message: 'Please confirm your email',
    };
  }

  // profile 정보 가져오기 (로그인 한 사람)
  @UseGuards(JwtAuthGuard)
  @Get()
  authenticate(@Req() req: RequestWithUser) {
    const { user } = req;
    return user;
  }
}

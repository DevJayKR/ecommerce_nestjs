import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiHeaders,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfirmEmailDto } from 'src/user/dto/confirm-email.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { LoginUserDto } from 'src/user/dto/login-user.dto';
import { User } from 'src/user/entities/user.entity';
import { AuthService } from './auth.service';
import { SelfCheckAuthDto } from './dto/selfcheck-auth.dto';
import JwtAuthGuard from './guard/jwtAuth.guard';
import { LocalAuthGuard } from './guard/localAuth.guard';
import { RequestWithUser } from './requestWithUser.interface';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @ApiResponse({ status: HttpStatus.CREATED, type: User })
  async register(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.authService.createUser(createUserDto);
    //await this.authService.sendVerificationLink(createUserDto.email);

    return newUser;
  }

  @Post('confirm')
  @ApiResponse({
    status: HttpStatus.OK,
  })
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
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: HttpStatus.OK, type: User })
  @Post('login')
  async login(@Req() request: RequestWithUser) {
    const { user } = request;
    const token = this.authService.generateAccessJwt(user.id);
    request.res.setHeader('set-Cookie', token);

    return { user, token };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() request: RequestWithUser) {
    request.res.setHeader('set-Cookie', this.authService.getCookieForLogout());
    return {
      success: true,
      status: 200,
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
  @ApiBearerAuth()
  authenticate(@Req() req: RequestWithUser) {
    const { user } = req;
    return user;
  }

  @Post('self/check')
  async selfCheck(@Body() selfCheckAuthDto: SelfCheckAuthDto) {
    return await this.authService.selfCheckAuth(selfCheckAuthDto);
  }
}

import {
  Body,
  CACHE_MANAGER,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
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
import { Cache } from 'cache-manager';
import { UserService } from 'src/user/user.service';
import { GoogleOAuthGuard } from './guard/googleAuth.guard';
import { FacebookAuthGuard } from './guard/facebookAuth.guard';
import { NaverAuthGuard } from './guard/naverAuth.guard';
import { KakaoAuthGuard } from './guard/kakaoAuth.guard';
import RefreshAuthGuard from './guard/refreshAuth.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post('/signup')
  @ApiCreatedResponse({ status: HttpStatus.CREATED, type: User })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST })
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const newUser = await this.authService.createUser(createUserDto);
      await this.authService.sendVerificationLink(createUserDto.email);

      return {
        success: true,
        status: 201,
        message: 'register success',
        data: { user: newUser },
      };
    } catch (error) {
      console.log(error);
      if (error.code === '23505')
        throw new HttpException(
          'User email already exist.',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  @UseGuards(RefreshAuthGuard)
  @Get('refresh')
  refresh(@Req() req: RequestWithUser) {
    const accessTokenCookie = this.authService.generateAccessJwt(req.user.id);
    req.res.setHeader('Set-Cookie', accessTokenCookie);

    return req.user;
  }

  @Get('confirm')
  async confirmEmail(@Query('token') token: string) {
    const email = await this.authService.decodeConfirmationToken(token);

    await this.authService.confirmEmail(email);
    return {
      success: true,
      message: 'Confirmed email',
    };
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
    //const cookie = this.authService.generateAccessJwt(user.id);

    const accessTokenCookie = this.authService.generateAccessJwt(user.id);
    const { cookie: refreshTokenCookie, token: refreshToken } =
      await this.authService.generateRefreshToken(user.id);

    request.res.setHeader('set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);

    return { user, accessTokenCookie, refreshTokenCookie };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() request: RequestWithUser) {
    const { user } = request;
    await this.userService.removeRefreshToken(user.id);
    request.res.setHeader('set-Cookie', this.authService.getCookieForLogout());

    const cacheData = await this.cacheManager.get(user.id);
    if (cacheData) await this.cacheManager.del(user.id);

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
  async authenticate(@Req() req: RequestWithUser) {
    const { user } = req;
    const cacheData = await this.userService.saveCacheData(user.id);
    user.password = undefined;

    return cacheData ?? user;
  }

  @Post('self/check')
  async selfCheck(@Body() selfCheckAuthDto: SelfCheckAuthDto) {
    return await this.authService.selfCheckAuth(selfCheckAuthDto);
  }

  //social login google
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleLogin() {
    return 'google login';
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  googleLoginCallback(@Req() req) {
    return req.user;
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  facebookLogin() {
    return 'facebook login';
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  facebookLoginCallback(@Req() req) {
    return req.user;
  }

  @Get('naver')
  @UseGuards(NaverAuthGuard)
  naverLogin() {
    return 'naver login';
  }

  @Get('naver/callback')
  @UseGuards(NaverAuthGuard)
  naverLoginCallback(@Req() req) {
    return req.user;
  }

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  kakaoLogin() {
    return 'kakao login';
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  kakaoLoginCallback(@Req() req) {
    return req.user;
  }

  @Post('email/send-otp')
  async sendEmailOtp(@Body('email') email: string): Promise<void> {
    return await this.authService.sendEmailOtp(email);
  }

  @Post('email/verify-otp')
  async verifyEmailOtp(
    @Body('email') email: string,
    @Body('code') code: number,
  ) {
    return await this.authService.verifyEmailOtp(email, code);
  }

  @Post('sms/send-otp')
  async sendSmsOtp(@Body('phone') phone: string) {
    return await this.authService.sendSmsOtp(phone);
  }

  @Post('sms/verify-otp')
  async verifySmsOtp(@Body('phone') phone: string, @Body('code') code: string) {
    return await this.authService.verifySmsOtp(phone, code);
  }
}

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
import {
  FacebookAuthResult,
  GoogleAuthResult,
  UseFacebookAuth,
  UseGoogleAuth,
} from '@nestjs-hybrid-auth/all';
import { GoogleAuthProfileDto } from './dto/google-auth-profile.dto.ts';

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
      //await this.authService.sendVerificationLink(createUserDto.email);

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
    const token = this.authService.generateAccessJwtForClient(user.id);

    return { user, token };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() request: RequestWithUser) {
    const { user } = request;
    request.res.setHeader('set-Cookie', this.authService.getCookieForLogout());

    const cacheData = await this.cacheManager.get(user.id);
    if (cacheData) await this.cacheManager.del(user.id);

    return {
      success: true,
      status: 200,
    };
  }

  @UseGoogleAuth()
  @Get('google')
  loginWithGoogle() {
    return 'Login Google';
  }

  @UseGoogleAuth()
  @Get('google/callback')
  async googleCallback(@Req() req) {
    const result: GoogleAuthResult = req.hybridAuthResult;

    const profile: GoogleAuthProfileDto = {
      email: result.profile.emails[0].value,
      username: result.profile.displayName,
    };

    const token = await this.authService.loginWithGoogleAuth(profile);
    req.res.setHeader('set-Cookie', token);

    return {
      success: true,
      message: 'success login',
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

  @UseFacebookAuth()
  @Get('facebook')
  loginWithFacebook() {
    return 'Login Facebook';
  }

  @UseFacebookAuth()
  @Get('facebook/callback')
  facebookCallback(@Req() req) {
    const result: FacebookAuthResult = req.hybridAuthResult;
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
}

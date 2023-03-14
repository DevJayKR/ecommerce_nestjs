import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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

  // profile 정보 가져오기 (로그인 한 사람)
  @UseGuards(JwtAuthGuard)
  @Get()
  authenticate(@Req() req: RequestWithUser) {
    const { user } = req;
    return user;
  }
}

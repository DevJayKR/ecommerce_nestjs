import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/localAuth.guard';
import { RequestWithUser } from './requestWithUser.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.authService.createUser(createUserDto);
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
  //@Post('/login')
  //async login(@Body() loginUserDto: LoginUserDto) {
  //  return await this.authService.login(
  //    loginUserDto.email,
  //    loginUserDto.password,
  //  );
  //}
}

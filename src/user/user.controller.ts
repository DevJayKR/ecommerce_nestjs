import {
  Body,
  Controller,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import JwtAuthGuard from 'src/auth/guard/jwtAuth.guard';
import { RequestWithUser } from 'src/auth/requestWithUser.interface';
import { ChangePasswordDto } from './dto/change-passowrd.dto';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('update/after/password')
  @UseGuards(JwtAuthGuard)
  async changePassowrd(
    @Req() request: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const { user } = request;

    await this.userService.getUserById(user.id);
    return await this.userService.changePassword(changePasswordDto, user);
  }

  @Post('find/password')
  async findPassword(@Body('email') email: string) {
    return await this.userService.findPasswordSendEmail(email);
  }

  // 로그인 전에 패스워드 변경
  @Put('update/before/password')
  async beforeLoginChangePassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.userService.decodeTokenFromPasswordEmail(
      token,
      newPassword,
    );
  }

  // 로그인 후
  @Put('update/passwordWithToken')
  async changePasswordFromFindPassword(
    @Body('token') token: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.userService.changePasswordWithToken(
      token,
      changePasswordDto,
    );
  }

  @Patch('update/role/admin')
  async changeRole(@Body('email') email: string) {
    return await this.userService.addRoleAdmin(email);
  }
}

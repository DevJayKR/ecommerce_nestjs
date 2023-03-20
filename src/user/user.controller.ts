import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import JwtAuthGuard from 'src/auth/guard/jwtAuth.guard';
import { RequestWithUser } from 'src/auth/requestWithUser.interface';
import { ChangePasswordDto } from './dto/change-passowrd.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('update/password')
  @UseGuards(JwtAuthGuard)
  async changePassowrd(
    @Req() request: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const user = await this.userService.getUserById(request.user.id);
    return await this.userService.changePassword(changePasswordDto, user);
  }
}

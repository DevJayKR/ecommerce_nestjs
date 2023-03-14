import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  public async createUser(createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return user;
  }

  public async login(email: string, password: string) {
    const user = await this.userService.getByEmail(email);
    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched)
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    return user;
  }
}

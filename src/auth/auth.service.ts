import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from './tokenPayload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
}

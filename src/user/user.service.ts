import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-passowrd.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserById(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (user) return user;

    throw new HttpException('no user', HttpStatus.BAD_REQUEST);
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOneBy({ email });
    if (user) return user;

    throw new HttpException('no user', HttpStatus.NOT_FOUND);
  }

  async markEmailAsConfirmed(email: string) {
    return this.userRepository.update(
      { email },
      {
        isEmailConfirmed: true,
      },
    );
  }

  async createUser(createUserDto: CreateUserDto) {
    const newUser = await this.userRepository.create(createUserDto);
    await this.userRepository.save(newUser);
    newUser.password = undefined;
    return newUser;
  }

  async changePassword(changePasswordDto: ChangePasswordDto, user: User) {
    const isMatched = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isMatched)
      throw new HttpException('Password is not matched', HttpStatus.CONFLICT);

    user.password = changePasswordDto.newPassword;
    await this.userRepository.save(user);
    return user;
  }
}

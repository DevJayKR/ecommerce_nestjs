import {
  BadRequestException,
  CACHE_MANAGER,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-passowrd.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { VerificationTokenPayload } from 'src/auth/verificationTokenPayload.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';
import { Cache } from 'cache-manager';
import { Source } from './entities/source.enum';
import { CreateUserWithSocialDto } from './dto/create-user-social.dto';
import { Role } from './entities/roles.enum';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly filesService: FilesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUserById(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (user) return user;

    throw new HttpException('no user', HttpStatus.BAD_REQUEST);
  }

  async saveCacheData(id: string) {
    const cacheData = await this.cacheManager.get(id);

    const user = await this.getUserById(id);
    user.password = undefined;

    if (!cacheData) {
      await this.cacheManager.set(id, user);
      return user;
    }

    return cacheData;
  }

  async addRoleAdmin(email: string) {
    const user = await this.getUserByEmail(email);

    user.roles = [Role.User, Role.Admin];
    await this.userRepository.save(user);

    user.password = undefined;

    return user;
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

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.getUserById(userId);

    const isRefreshTokenMatch = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );

    if (isRefreshTokenMatch) {
      return user;
    }
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      currentHashedRefreshToken: null,
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const newUser = this.userRepository.create(createUserDto);
    newUser.source = Source.LOCAL;
    await this.userRepository.save(newUser);
    newUser.password = undefined;
    return newUser;
  }

  async updateProfile(userId: string, buffer: Buffer, filename: string) {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (user.profileImg) {
      await this.userRepository.update(userId, {
        ...user,
        profileImg: null,
      });

      await this.filesService.deletePublicFile(user.profileImg.id);
    }

    const profileImg = await this.filesService.uploadPublicFile(
      buffer,
      filename,
    );

    await this.userRepository.update(userId, {
      ...user,
      profileImg,
    });

    return profileImg;
  }

  async deleteProfileImage(userId: string) {
    const user = await this.getUserById(userId);
    const fileId = user.profileImg?.id;

    if (fileId) {
      await this.userRepository.update(userId, {
        ...user,
        profileImg: null,
      });
      await this.filesService.deletePublicFile(fileId);
    }
  }

  async createUserWithSocial(createUserWithSocialDto: CreateUserWithSocialDto) {
    const newUser = this.userRepository.create(createUserWithSocialDto);
    await this.userRepository.save(newUser);
    newUser.password = undefined;
    return newUser;
  }

  async changePassword(changePasswordDto: ChangePasswordDto, user: User) {
    if (user.source !== Source.LOCAL) {
      return '소셜 회원은 패스워드를 변경할 수 없습니다.';
    }

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

  async changePasswordWithToken(
    token: string,
    changePasswordDto: ChangePasswordDto,
  ) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('FIND_PASSWORD_TOKEN_SECRET'),
      });

      const user = await this.getUserByEmail(payload.email);

      await this.changePassword(changePasswordDto, user);

      return {
        success: true,
        status: 200,
        message: 'password has changed',
      };
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }
      throw new BadRequestException('Bad confirmation token');
    }
  }

  async decodeTokenFromPasswordEmail(token: string, newPassword: string) {
    const { email } = this.jwtService.verify(token, {
      secret: this.configService.get('FIND_PASSWORD_TOKEN_SECRET'),
    });

    const user = await this.getUserByEmail(email);

    if (user.source !== Source.LOCAL) {
      return '소셜 회원은 비밀번호를 변경할 수 없습니다.';
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await this.userRepository.update(
      { email },
      {
        password: hashedPassword,
      },
    );

    return 'updated password';
  }

  async findPasswordSendEmail(email: string) {
    const payload: VerificationTokenPayload = { email };
    const user = await this.getUserByEmail(email);

    if (user.source !== Source.LOCAL) {
      return {
        message:
          '소셜 로그인으로 가입한 회원은 비밀번호 변경을 할 수 없습니다.',
      };
    }

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('FIND_PASSWORD_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'FIND_PASSWORD_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    const url = `${this.configService.get(
      'EMAIL_CONFIRMATION_URL',
    )}?token=${token}`;

    if (user) {
      await this.emailService.sendMail({
        to: email,
        subject: '비밀번호 찾기',
        text: `비밀번호 찾기 ${url}`,
      });

      return {
        success: true,
        status: 200,
        message: 'sended email',
      };
    }
  }
}
